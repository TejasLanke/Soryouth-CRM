
import { AppLogoIcon } from '@/components/app-logo-icon';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

interface LogoProps {
  className?: string;
  iconOnly?: boolean; // This prop can still be used if Logo is used elsewhere and needs to be explicitly icon-only
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <Link href="/dashboard" className={`flex items-center ${className}`}>
      <AppLogoIcon className="h-6 w-6" />
      {!iconOnly && (
        <span className="ml-2 text-lg font-semibold font-headline text-primary-foreground group-data-[sidebar=sidebar]/sidebar-wrapper:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
