import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaceSky } from '@/components/SpaceSky';
import { ArrowRight, Share2, Calculator, MessageSquare } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <SpaceSky />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
            TinyNotie
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Smart expense tracking for groups, powered by AI
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="group">
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">
                Create Account
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="backdrop-blur-sm bg-card/80 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Share Expenses</CardTitle>
              <CardDescription>
                Easily split bills and track who owes what in your group
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="backdrop-blur-sm bg-card/80 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Calculations</CardTitle>
              <CardDescription>
                Automatic currency conversion and expense calculations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="backdrop-blur-sm bg-card/80 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Chat with your expenses using natural language queries
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <Card className="backdrop-blur-sm bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription className="text-base">
                Join thousands of users tracking expenses smarter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">
                  Create Free Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
