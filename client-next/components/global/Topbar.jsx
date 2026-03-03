'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, Home, Plus, Menu, X, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
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

  const navLinks = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/groups/create', label: 'New Group', icon: Plus },
  ];

  return (
    <header
      className={`sticky top-0 z-[100] w-full transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'
        }`}
    >
      <div className="container mx-auto px-6">
        <div className={`relative flex items-center justify-between transition-all duration-500 rounded-[2rem] px-6 h-16 border border-foreground/5 backdrop-blur-2xl ${isScrolled ? 'bg-background/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]' : 'bg-foreground/5'
          }`}>

          <div className="flex items-center gap-10">
            <Link href="/home" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-[#80ff00] flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform shadow-[0_0_15px_rgba(128,255,0,0.4)]">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
                <span className="text-xl font-black text-foreground italic tracking-tighter uppercase leading-none">
                  Tiny<span className="text-[#80ff00]">Notie</span>
                </span>
              </motion.div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] italic transition-all ${pathname === link.href
                      ? 'text-[#80ff00] bg-foreground/5'
                      : 'text-foreground/30 hover:text-foreground hover:bg-foreground/5'
                      }`}
                  >
                    {link.label}
                  </motion.div>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <ThemeSwitcher />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-all group">
                  <Avatar className="h-9 w-9 border-2 border-[#80ff00] transition-transform group-hover:scale-110">
                    {userInfo?.profile_url && (
                      <AvatarImage src={userInfo.profile_url} alt={user?.usernm || 'User'} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-[#80ff00] to-[#00ff80] text-black font-black">
                      {user ? getInitials(user.usernm) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start translate-y-[-1px]">
                    <span className="text-[10px] font-black text-foreground uppercase italic leading-none mb-1">
                      {user?.usernm || 'LEGEND'}
                    </span>
                    <span className="text-[8px] font-black text-foreground/30 uppercase tracking-widest leading-none">
                      Active Vitals
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover border-border rounded-[2rem] p-4 shadow-2xl backdrop-blur-xl">
                <DropdownMenuLabel className="px-4 pb-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1 italic">User Profile</p>
                    <p className="text-lg font-black text-white uppercase italic leading-none tracking-tighter">
                      {user?.usernm || 'Anonymous'}
                    </p>
                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">
                      {user?.email || ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 mx-2 my-2" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:bg-foreground/5 group">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-[#80ff00]/20 transition-all">
                      <User className="h-5 w-5 text-foreground/40 group-hover:text-[#80ff00]" />
                    </div>
                    <span className="font-black text-foreground/60 group-hover:text-foreground uppercase italic text-xs tracking-widest">Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground/5 mx-2 my-2" />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:bg-red-500/10 group">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                    <LogOut className="h-5 w-5 text-foreground/40 group-hover:text-red-500" />
                  </div>
                  <span className="font-black text-foreground/60 group-hover:text-red-500 uppercase italic text-xs tracking-widest">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 rounded-xl glass-button border-white/10 relative z-[110]"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                    <X className="h-6 w-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                    <Menu className="h-6 w-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-[105] bg-background/95 backdrop-blur-3xl lg:hidden flex flex-col p-6 pt-24"
          >
            <div className="grid gap-3">
              <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.4em] mb-4 italic px-4">Vault Navigation</p>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${pathname === link.href
                      ? 'bg-[#80ff00]/5 border-[#80ff00]/20 text-[#80ff00]'
                      : 'bg-foreground/5 border-foreground/5 text-foreground/60'
                      }`}
                  >
                    <div className={`p-3 rounded-xl ${pathname === link.href ? 'bg-[#80ff00]/20' : 'bg-foreground/5'}`}>
                      <link.icon className={`h-5 w-5 ${pathname === link.href ? 'text-[#80ff00]' : 'text-foreground/20'}`} />
                    </div>
                    <span className="text-xl font-black uppercase italic tracking-tighter">
                      {link.label}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>

            <div className="mt-auto space-y-4">
              <div className="p-6 rounded-[2rem] bg-foreground/5 border border-foreground/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-[#80ff00]/50 ring-4 ring-[#80ff00]/5">
                      <AvatarFallback className="bg-[#80ff00] text-black font-black italic">
                        {user ? getInitials(user.usernm) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-lg font-black text-white italic tracking-tighter uppercase truncate leading-none mb-1">{user?.usernm || 'LEGEND'}</p>
                      <p className="text-foreground/20 text-[8px] font-black uppercase truncate tracking-[0.2em]">{user?.email}</p>
                    </div>
                  </div>
                  <ThemeSwitcher />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => { setMobileMenuOpen(false); router.push('/profile'); }}
                    variant="outline"
                    className="h-12 rounded-xl bg-foreground/5 border-foreground/10 text-foreground/60 font-black uppercase italic text-[10px] tracking-widest hover:text-white"
                  >
                    Settings
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black uppercase italic text-[10px] tracking-widest border border-red-500/20"
                  >
                    Exit
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
