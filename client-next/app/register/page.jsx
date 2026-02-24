'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Send, 
  Lock, 
  LogIn, 
  Copy, 
  CheckCircle2, 
  Info,
  MessageSquare,
  CheckCircle,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SpaceSky } from '@/components/SpaceSky';

export default function RegisterPage() {
  const router = useRouter();
  const [copiedCommand, setCopiedCommand] = useState(null);

  const copyToClipboard = (text, commandType) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const steps = [
    {
      number: 1,
      icon: MessageSquare,
      label: 'Open Telegram Bot',
      description: 'Click the button below to open our registration bot on Telegram',
      action: (
        <Button 
          className="w-full bg-[#0088cc] hover:bg-[#006ba6] text-white"
          onClick={() => window.open('https://t.me/DarabothBot', '_blank')}
        >
          <Send className="mr-2 h-4 w-4" />
          Open @DarabothBot
        </Button>
      ),
    },
    {
      number: 2,
      icon: Send,
      label: 'Send Registration Command',
      description: 'Send the following command to the bot to create your account',
      action: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border-l-4 border-primary font-mono">
            <code className="flex-1 text-sm">/register</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard('/register', 'register')}
              className="h-8 w-8"
            >
              {copiedCommand === 'register' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your account will be created using your Telegram username
          </p>
        </div>
      ),
    },
    {
      number: 3,
      icon: KeyRound,
      label: 'Set a Secure Password',
      description: 'After registering, set your password by sending this command',
      action: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border-l-4 border-primary font-mono">
            <code className="flex-1 text-sm">/password YourNewPassword</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard('/password YourNewPassword', 'password')}
              className="h-8 w-8"
            >
              {copiedCommand === 'password' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Replace "YourNewPassword" with a secure password (minimum 6 characters)
          </p>
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
            <AlertDescription className="text-xs">
              <strong>Important:</strong> Choose a strong password that you don&apos;t use elsewhere.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      number: 4,
      icon: LogIn,
      label: 'Login to the App',
      description: 'Now you can log in using your credentials',
      action: (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600 dark:text-green-400 min-w-[90px]">
                Username:
              </span>
              <span className="text-sm">Your Telegram username</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600 dark:text-green-400 min-w-[90px]">
                Password:
              </span>
              <span className="text-sm">The password you set in the previous step</span>
            </div>
          </div>
          <Button 
            className="w-full"
            onClick={() => router.push('/login')}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Go to Login Page
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <SpaceSky />
      
      <div className="w-full max-w-3xl relative z-10 space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/login')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>

        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Registration through our Telegram bot ensures secure account creation with your unique Telegram username.
          </AlertDescription>
        </Alert>

        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Register via <span className="text-white">Telegram</span>
            </CardTitle>
            <CardDescription className="text-base">
              Follow these steps to create your account using our Telegram bot
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.number} className="relative pl-8 pb-8 last:pb-0">
                  {/* Connector line */}
                  {step.number < steps.length && (
                    <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  {/* Step number circle */}
                  <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {step.number}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{step.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.action}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Having trouble? Contact the developer directly on Telegram:{' '}
              <a
                href="https://t.me/l3oth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                @l3oth
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    copyToClipboard('@l3oth', 'telegram');
                  }}
                  className="h-5 w-5 p-0"
                >
                  {copiedCommand === 'telegram' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </a>
            </p>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Lock className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your Telegram username helps us create a unique account for you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
