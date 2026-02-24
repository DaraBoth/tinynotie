'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaceSky } from '@/components/SpaceSky';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ArrowLeft, Save, User } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUserInfo, useUpdateUserInfo } from '@/hooks/useQueries';
import { Loading } from '@/components/Loading';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: userInfo, isLoading } = useUserInfo(user?._id);
  const updateMutation = useUpdateUserInfo(user?._id);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  
  useEffect(() => {
    if (userInfo) {
      setFormData({
        username: userInfo.username || '',
        email: userInfo.email || '',
      });
    }
  }, [userInfo]);
  
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };
  
  if (isLoading) {
    return <Loading text="Loading profile..." />;
  }
  
  return (
    <main className="relative min-h-screen p-4">
      <SpaceSky />
      
      <div className="relative z-10 container mx-auto max-w-2xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          
          <ThemeSwitcher />
        </div>
        
        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your account information
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-sm bg-card/90 border-primary/20 mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono">{user?._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since:</span>
              <span>{new Date(userInfo?.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
