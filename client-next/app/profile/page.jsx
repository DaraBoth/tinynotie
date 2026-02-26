'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpaceSky } from '@/components/SpaceSky';
import { Topbar } from '@/components/global/Topbar';
import {
  ArrowLeft, Save, Camera, User, Mail, Phone,
  AtSign, Hash, CheckCircle2, Shield, Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useUserInfo, useUpdateUserInfo } from '@/hooks/useQueries';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Loading } from '@/components/Loading';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, user } = useAuthGuard();
  const { data: userInfo, isLoading } = useUserInfo(user?._id);
  const updateMutation = useUpdateUserInfo(user?._id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    profile_url: '',
  });
  const [profilePreview, setProfilePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: (fd) => api.uploadImage(fd),
  });

  useEffect(() => {
    if (userInfo) {
      setFormData({
        first_name: userInfo.first_name || '',
        last_name: userInfo.last_name || '',
        email: userInfo.email || '',
        phone_number: userInfo.phone_number || '',
        profile_url: userInfo.profile_url || '',
      });
      setProfilePreview(userInfo.profile_url || '');
    }
  }, [userInfo]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let profileUrl = formData.profile_url;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const uploadRes = await uploadMutation.mutateAsync(fd);
        if (uploadRes.data?.status) {
          profileUrl = uploadRes.data.data?.url || profileUrl;
        } else {
          toast.error(uploadRes.data?.message || 'Image upload failed');
          return;
        }
      }
      await updateMutation.mutateAsync({ ...formData, profile_url: profileUrl });
    } catch {
      // errors handled by mutation
    }
  };

  const initials = [userInfo?.first_name, userInfo?.last_name]
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || user?.usernm?.substring(0, 2).toUpperCase() || 'U';

  const displayName = [userInfo?.first_name, userInfo?.last_name].filter(Boolean).join(' ')
    || userInfo?.usernm || user?.usernm || 'User';

  if (!hasHydrated || !isAuthenticated) return <Loading text="Checking authentication..." />;
  if (isLoading) return <Loading text="Loading profile..." />;

  const isSaving = updateMutation.isPending || uploadMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <SpaceSky />
      <Topbar />

      <div className="relative z-10 flex flex-1 flex-col md:flex-row min-h-0">

        {/* ════ LEFT PANEL ════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col items-center justify-between w-[38%] lg:w-[34%] px-10 lg:px-14 py-12 border-r border-border/30 bg-gradient-to-b from-primary/8 via-purple-500/4 to-blue-500/4 dark:from-primary/15 dark:via-purple-900/15 dark:to-background/50 backdrop-blur-sm shrink-0">
          <div className="w-full">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-4">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/30 cursor-pointer shadow-xl shadow-primary/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-4xl font-extrabold text-primary">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-white text-[10px] font-medium">Change</span>
                  </div>
                </motion.div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              <h2 className="text-xl font-bold tracking-tight text-center">{displayName}</h2>
              <p className="text-sm text-muted-foreground mt-1">@{userInfo?.usernm || user?.usernm}</p>

              {imageFile && (
                <span className="mt-3 text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-medium">
                  Unsaved photo change
                </span>
              )}
            </div>

            {/* Account info */}
            <div className="w-full space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Account Details</p>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/30 dark:bg-white/5 border border-border/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <AtSign className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Username</p>
                  <p className="text-sm font-semibold truncate">@{userInfo?.usernm || user?.usernm}</p>
                </div>
              </div>

              {userInfo?.telegram_chat_id && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/30 dark:bg-white/5 border border-border/30">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                    <Hash className="h-3.5 w-3.5 text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Telegram ID</p>
                    <p className="text-sm font-mono truncate">{userInfo.telegram_chat_id}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Account Status</p>
                  <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50 mt-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span>TinyNotie Profile</span>
          </div>
        </aside>

        {/* ════ RIGHT FORM PANEL ══════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col px-4 sm:px-8 md:px-12 lg:px-16 py-8 md:py-12 overflow-y-auto">

          {/* Mobile header */}
          <div className="md:hidden mb-8">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </button>

            {/* Mobile avatar */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/30 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-2xl font-bold text-primary">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold">{displayName}</h1>
                <p className="text-sm text-muted-foreground">@{userInfo?.usernm || user?.usernm}</p>
              </div>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Profile Settings</h1>
            <p className="text-muted-foreground text-sm">Update your personal information and profile photo.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-8 max-w-xl">

            {/* ── Personal Information ─────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="text-sm font-semibold mb-2 block">First Name</Label>
                    <Input
                      id="first_name" name="first_name"
                      placeholder="John"
                      value={formData.first_name} onChange={handleChange}
                      className="h-11 bg-background/50 backdrop-blur border-border/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-sm font-semibold mb-2 block">Last Name</Label>
                    <Input
                      id="last_name" name="last_name"
                      placeholder="Doe"
                      value={formData.last_name} onChange={handleChange}
                      className="h-11 bg-background/50 backdrop-blur border-border/60"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-border/30 -mx-4 sm:-mx-8 md:-mx-12 lg:-mx-16" />

            {/* ── Contact ──────────────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Contact
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> Email Address
                  </Label>
                  <Input
                    id="email" name="email" type="email"
                    placeholder="john@example.com"
                    value={formData.email} onChange={handleChange}
                    className="h-11 bg-background/50 backdrop-blur border-border/60"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number" className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> Phone Number
                  </Label>
                  <Input
                    id="phone_number" name="phone_number" type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone_number} onChange={handleChange}
                    className="h-11 bg-background/50 backdrop-blur border-border/60"
                  />
                </div>
              </div>
            </section>

            {/* Mobile-only account info */}
            <div className="md:hidden border-t border-border/30 -mx-4 sm:-mx-8 pt-8">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-4 sm:px-8 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Account Details
              </h2>
              <div className="space-y-2 px-4 sm:px-8 text-sm">
                <div className="flex justify-between py-2 border-b border-border/20">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-semibold">@{userInfo?.usernm || user?.usernm}</span>
                </div>
                {userInfo?.telegram_chat_id && (
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">Telegram ID</span>
                    <span className="font-mono text-xs">{userInfo.telegram_chat_id}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* ── Save row ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-6 mt-auto border-t border-border/30 -mx-4 sm:-mx-8 md:-mx-12 lg:-mx-16 px-4 sm:px-8 md:px-12 lg:px-16">
              <Button type="button" variant="ghost" onClick={() => router.push('/home')} disabled={isSaving} className="text-muted-foreground gap-2">
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" size="lg" className="min-w-[160px] gap-2" disabled={isSaving}>
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
