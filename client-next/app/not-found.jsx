'use client';

import Link from 'next/link';
import Lottie from 'lottie-react';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaceSky } from '@/components/SpaceSky';
import { useEffect, useState } from 'react';

export default function NotFoundPage() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    import('@/assets/notfound.json').then((data) => {
      setAnimationData(data.default);
    });
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <SpaceSky />
      
      <Card className="relative z-10 backdrop-blur-sm bg-card/90 border-primary/20 max-w-lg w-full">
        <CardHeader className="text-center">
          {animationData && (
            <div className="mx-auto mb-4">
              <Lottie
                animationData={animationData}
                loop
                style={{ width: 200, height: 200 }}
              />
            </div>
          )}
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-lg mt-2">
            Oops! Page not found
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex gap-3 justify-center pt-4">
            <Button asChild variant="outline">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
            <Button asChild>
              <Link href="/home">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
