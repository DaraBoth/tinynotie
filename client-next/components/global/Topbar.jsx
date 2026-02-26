'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Home, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/helpers';
import { useUserInfo } from '@/hooks/useQueries';

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: userInfo } = useUserInfo(user?._id);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              TinyNotie
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/home">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/groups/create">
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {userInfo?.profile_url && (
                    <AvatarImage src={userInfo.profile_url} alt={user?.usernm || 'User'} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user ? getInitials(user.usernm) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.usernm || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
