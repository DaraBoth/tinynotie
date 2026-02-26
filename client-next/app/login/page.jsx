'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, User, UserPlus, Zap } from 'lucide-react';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SpaceSky } from '@/components/SpaceSky';
import { Loading } from '@/components/Loading';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/home';
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    usernm: '',
    passwd: '',
  });

  const loginMutation = useMutation({
    mutationFn: (credentials) => api.login(credentials),
    onSuccess: (response) => {
      const { status, token, usernm, _id } = response.data;
      if (status) {
        setAuth(token, { usernm, _id });
        toast.success('Welcome back!');
        router.push(redirectTo);
      } else {
        toast.error('Login failed');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.usernm || !formData.passwd) {
      toast.error('Please fill in all fields');
      return;
    }
    loginMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loginMutation.isPending) {
    return <Loading text="Logging in..." />;
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <SpaceSky />
      
      <div className="w-full max-w-md relative z-10 space-y-4">
        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="usernm" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username (Telegram ID)
                </label>
                <Input
                  id="usernm"
                  name="usernm"
                  type="text"
                  placeholder="your_telegram_username"
                  value={formData.usernm}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="passwd" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="passwd"
                    name="passwd"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.passwd}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full" size="lg">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Registration Section */}
        <Card className="backdrop-blur-sm bg-card/90 border-dashed border-2 border-primary/30">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Don&apos;t have an account?
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a secure account using your Telegram username
              </p>
            </div>
            
            <Alert className="bg-primary/5 border-primary/20">
              <Zap className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">Quick Registration</AlertTitle>
              <AlertDescription className="text-xs">
                Takes less than 30 seconds! Register via our Telegram bot and start tracking your expenses.
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => router.push('/register')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Register via Telegram Bot
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
