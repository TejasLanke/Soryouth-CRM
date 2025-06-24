
'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SunMedium, Moon, Settings, LogOut, UserCircle } from 'lucide-react';
import { TOOLS_NAV_ITEMS } from '@/lib/constants';
import Link from 'next/link';
import { logout } from '@/app/(auth)/actions';

type User = {
  userId: string;
  name: string;
  email: string;
} | null;

export function UserNavClient({ user }: { user: User }) {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
        <Button variant="ghost" className="w-full justify-start gap-2 px-2" asChild>
          <Link href="/login">
            <UserCircle className="h-8 w-8" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Login</span>
          </Link>
        </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="user avatar" alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate group-data-[collapsible=icon]:hidden">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56 mb-2 ml-2">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
           <SunMedium className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
           <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span>Toggle theme</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tools & Sections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TOOLS_NAV_ITEMS.map((item) => (
          <DropdownMenuItem key={item.label} asChild>
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
