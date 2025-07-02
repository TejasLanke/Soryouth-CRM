
'use client';

import { AppLogoIcon } from '@/components/app-logo-icon';
import { APP_NAME } from '@/lib/constants';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      className={cn(
        "flex h-15 w-full items-center justify-start p-0 text-left hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      onClick={toggleSidebar}
    >
      <AppLogoIcon className="h-8 w-8 shrink-0" />
      {!iconOnly && (
        <span className="ml-2 truncate text-xl font-semibold font-headline text-primary-foreground group-data-[sidebar=sidebar]/sidebar-wrapper:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          {APP_NAME}
        </span>
      )}
    </Button>
  );
}
