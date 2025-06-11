import { SunMedium } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <Link href="/dashboard" className={`flex items-center ${className}`}>
      <SunMedium className="h-6 w-6 text-primary" />
      {!iconOnly && <span className="ml-2 text-lg font-semibold font-headline text-primary-foreground group-data-[sidebar=sidebar]/sidebar-wrapper:text-sidebar-foreground">Solaris CRM</span>}
    </Link>
  );
}
