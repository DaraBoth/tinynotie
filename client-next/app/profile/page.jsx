'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaceSky } from '@/components/SpaceSky';
import { Topbar } from '@/components/global/Topbar';
import { ArrowLeft, Save, Camera } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUserInfo, useUpdateUserInfo } from '@/hooks/useQueries';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Loading } from '@/components/Loading';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuthStore();
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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  if (isLoading) return <Loading text="Loading profile..." />;

  const isSaving = updateMutation.isPending || uploadMutation.isPending;

  return (
    <div className="min-h-screen relative">
      <SpaceSky />
      <Topbar />

      <main className="relative z-10 container mx-auto max-w-2xl px-4 py-8">
        {/* Back */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Profile Photo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary/30 cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Click photo to change</p>
              <p className="text-sm font-medium text-foreground mt-1">@{userInfo?.usernm || user?.usernm}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account info */}
        <Card className="backdrop-blur-sm bg-card/90 border-primary/20 mt-4">
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">@{userInfo?.usernm || user?.usernm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telegram ID:</span>
              <span className="font-mono text-xs">{userInfo?.telegram_chat_id || '—'}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
