'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/Loading';
import { SpaceSky } from '@/components/SpaceSky';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', user?._id],
    queryFn: async () => {
      const response = await api.getGroupsByUserId(user._id);
      return response.data.data; // Extract the actual data array
    },
    enabled: !!user?._id,
  });

  if (!isAuthenticated) {
    return <Loading text="Checking authentication..." />;
  }

  if (isLoading) {
    return <Loading text="Loading your groups..." />;
  }

  return (
    <main className="relative min-h-screen">
      <SpaceSky />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome, {user?.usernm || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your expense groups
            </p>
          </div>
          <div className="flex gap-2">
            <ThemeSwitcher />
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Groups Grid */}
        {groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Group Card */}
            <Card className="backdrop-blur-sm bg-card/80 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
              <Link href="/groups/create">
                <CardHeader className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Create New Group</CardTitle>
                  <CardDescription>
                    Start tracking expenses with friends
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            {/* Existing Groups */}
            {groups.map((group) => (
              <Card
                key={group.id}
                className="backdrop-blur-sm bg-card/80 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
              >
                <Link href={`/groups/${group.id}`}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="truncate">{group.grp_name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {group.currency && `Currency: ${group.currency}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {group.isAdmin && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="backdrop-blur-sm bg-card/80 border-primary/20 max-w-2xl mx-auto">
            <CardHeader className="text-center py-12">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">No Groups Yet</CardTitle>
              <CardDescription className="text-base">
                Create your first group to start tracking expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-12">
              <Button asChild size="lg">
                <Link href="/groups/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Group
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
