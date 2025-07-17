
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NAV_ITEMS } from '@/lib/constants';
import { useEffect, useState } from 'react';
import type { RolePermission } from '@/types';
import { getUserPermissions } from './users/actions';
import { useSession } from '@/hooks/use-sessions';

export function ClientSidebarMenu() {
  const pathname = usePathname();
  const session = useSession();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (session?.role) {
        setIsLoading(true);
        const userPermissions = await getUserPermissions(session.role);
        setPermissions(userPermissions);
        setIsLoading(false);
      } else if (session === null) {
        // Not logged in or session is loading
        setIsLoading(false);
      }
    }
    fetchPermissions();
  }, [session]);
  
  const allowedNavPaths = permissions.map(p => p.navPath);

  const filteredNavItems = NAV_ITEMS.filter(item => 
      item.href === '/dashboard' || // Always show dashboard
      allowedNavPaths.includes(item.href)
  );

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => {
        const isDashboard = item.href === '/dashboard';
        const isActive = isDashboard ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard';
        
        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
