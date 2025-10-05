import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  billingPeriod: {
    start: Date;
    end: Date;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export class InvoiceService {
  async createInvoice(data: Omit<InvoiceData, 'id'>): Promise<string> {
    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        billingPeriodStart: data.billingPeriod.start,
        billingPeriodEnd: data.billingPeriod.end,
        items: data.items,
      },
      include: {
        user: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    // Generate PDF
    const pdfBytes = await this.generatePDF(invoice);

    // Store PDF in database or file storage
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        pdfUrl: await this.storePDF(invoice.id, pdfBytes),
      },
    });

    return invoice.id;
  }

  private async generatePDF(invoice: any): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add company header
    page.drawText('JobFinders', { x: 50, y: 750, size: 24, font });
    page.drawText('Invoice', { x: 50, y: 700, size: 18, font });

    // Add invoice details
    page.drawText(`Invoice #: ${invoice.id}`, { x: 50, y: 650, size: 12, font });
    page.drawText(`Date: ${invoice.createdAt.toLocaleDateString()}`, { x: 50, y: 630, size: 12, font });

    // Add customer details
    page.drawText('Bill To:', { x: 50, y: 580, size: 12, font });
    page.drawText(invoice.user.name, { x: 50, y: 560, size: 12, font });
    page.drawText(invoice.user.email, { x: 50, y: 540, size: 12, font });

    // Add subscription details
    page.drawText('Subscription:', { x: 50, y: 490, size: 12, font });
    page.drawText(invoice.subscription.plan.name, { x: 50, y: 470, size: 12, font });
    page.drawText(`Period: ${invoice.billingPeriodStart.toLocaleDateString()} - ${invoice.billingPeriodEnd.toLocaleDateString()}`, 
      { x: 50, y: 450, size: 12, font });

    // Add items table
    let y = 400;
    page.drawText('Description', { x: 50, y, size: 12, font });
    page.drawText('Quantity', { x: 250, y, size: 12, font });
    page.drawText('Unit Price', { x: 350, y, size: 12, font });
    page.drawText('Total', { x: 450, y, size: 12, font });

    y -= 20;
    for (const item of invoice.items) {
      page.drawText(item.description, { x: 50, y, size: 12, font });
      page.drawText(item.quantity.toString(), { x: 250, y, size: 12, font });
      page.drawText(item.unitPrice.toFixed(2), { x: 350, y, size: 12, font });
      page.drawText(item.total.toFixed(2), { x: 450, y, size: 12, font });
      y -= 20;
    }

    // Add total
    page.drawText('Total:', { x: 350, y: y - 40, size: 14, font });
    page.drawText(`${invoice.currency} ${invoice.amount.toFixed(2)}`, 
      { x: 450, y: y - 40, size: 14, font });

    return pdfDoc.save();
  }

  private async storePDF(invoiceId: string, pdfBytes: Uint8Array): Promise<string> {
    // TODO: Implement file storage (S3, etc.)
    // For now, store locally
    const path = `/invoices/${invoiceId}.pdf`;
    return path;
  }
}
