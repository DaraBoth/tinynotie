'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, Plus, Menu, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/helpers';
import { useUserInfo } from '@/hooks/useQueries';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { data: userInfo } = useUserInfo(user?._id);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [];

  return (
    <>
      <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 transition-all ${isScrolled ? 'h-14' : 'h-16'} flex items-center justify-between`}>
          {/* Brand */}
          <Link href="/home" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#80ff00] flex items-center justify-center shadow-[0_0_18px_rgba(128,255,0,0.35)]">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight">
              Tiny<span className="text-[#80ff00]">Notie</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === link.href
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>

            {pathname !== '/home' && (
              <Button asChild size="sm" className="hidden md:inline-flex h-9">
                <Link href="/groups/create" className="gap-1.5">
                  <Plus className="h-4 w-4" /> New Group
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-2 py-1.5 hover:bg-muted/60 transition-colors">
                  <Avatar className="h-8 w-8 border border-primary/40">
                    {userInfo?.profile_url && (
                      <AvatarImage src={userInfo.profile_url} alt={user?.usernm || 'User'} />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {user ? getInitials(user.usernm) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
                    {user?.usernm || 'User'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/70"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          title="Navigation"
          description="Mobile navigation and account quick actions"
          className="w-[86vw] max-w-sm p-0 flex flex-col"
        >
          <SheetHeader className="px-5 pt-6 pb-4 border-b">
            <SheetTitle className="text-left">Menu</SheetTitle>
            <SheetDescription className="text-left">Navigate and manage your account</SheetDescription>
          </SheetHeader>

          <div className="flex-1 px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${pathname === link.href
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/50 bg-background/50 text-foreground hover:bg-muted/60'
                  }`}
              >
                <link.icon className="h-4 w-4" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}

            <div className="pt-2">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/groups/create');
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Group
              </Button>
            </div>
          </div>

          <div className="border-t px-4 py-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-9 w-9 border border-primary/40">
                  {userInfo?.profile_url && <AvatarImage src={userInfo.profile_url} alt={user?.usernm || 'User'} />}
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {user ? getInitials(user.usernm) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.usernm || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                </div>
              </div>
              <ThemeSwitcher />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/profile');
                }}
              >
                <User className="mr-2 h-4 w-4" /> Profile
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
