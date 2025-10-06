import Link from 'next/link';
import { Linkedin, Twitter, Facebook, Instagram, MapPin } from 'lucide-react';
import { publicNavigationItems } from '@/config/navigation';

export function Footer() {
  // Filter to show only key marketing pages
  const footerNavigationItems = publicNavigationItems.filter(item => 
    ['/', '/jobs', '/companies', '/about', '/contact', '/pricing'].includes(item.href)
  );

  const legalLinks = [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
    { href: '/refund', label: 'Refund Policy' },
  ];

  const socialLinks = [
    { href: '#', icon: Linkedin, label: 'LinkedIn' },
    { href: '#', icon: Twitter, label: 'Twitter' },
    { href: '#', icon: Facebook, label: 'Facebook' },
    { href: '#', icon: Instagram, label: 'Instagram' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section - Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: About & Navigation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Job Finders</h3>
            <p className="text-sm text-slate-400">
              Connecting talented professionals with their dream careers and helping companies find the perfect candidates.
            </p>
            <nav className="space-y-2">
              {footerNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-sm hover:text-primary hover:underline transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 2: Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Legal</h3>
            <nav className="space-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm hover:text-primary hover:underline transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Connect */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Connect</h3>
            <p className="text-sm text-slate-400">
              Follow us on social media for the latest updates and job opportunities.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary transition-colors"
                    aria-label={social.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright and company info */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-slate-400">
            © 2024 Job Finders. Operated by Custom Logic SA Pty LTD. All rights reserved.
          </div>
          <div className="flex items-center text-sm text-slate-400">
            <MapPin className="h-4 w-4 mr-1" />
            South Africa
          </div>
        </div>
      </div>
    </footer>
  );
}