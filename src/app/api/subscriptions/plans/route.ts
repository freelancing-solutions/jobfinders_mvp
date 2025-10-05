import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'seeker' or 'employer'

    const whereClause: any = {
      isActive: true,
    };

    if (type) {
      whereClause.type = type.toUpperCase();
    }

    const plans = await prisma.plan.findMany({
      where: whereClause,
      orderBy: {
        price: 'asc',
      },
    });

    return Response.json({
      success: true,
      data: plans,
    });
  });
}
