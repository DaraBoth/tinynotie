'use client';

import { SpaceSky } from '@/components/SpaceSky';

/**
 * Full-page loading state with enhanced animations and visual hierarchy.
 * Features:
 * - Animated dual-ring spinner with counter-rotation
 * - Pulsing background glow effects
 * - Smooth text animations with staggered transitions
 * - Responsive design for mobile and desktop
 */
export function Loading({ text = 'Loading...' }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100vh] gap-8 select-none overflow-hidden bg-background">
      {/* Background effects */}
      <SpaceSky />
      
      {/* Animated glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Enhanced dual-ring spinner */}
        <div className="relative w-20 h-20">
          {/* Outer static ring */}
          <div className="absolute inset-0 rounded-full border-3 border-primary/15 shadow-lg shadow-primary/20" />
          
          {/* Fast outer spinner */}
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-primary border-r-primary/50 animate-spin shadow-lg shadow-primary/30" />
          
          {/* Slow inner counter-spinner */}
          <div
            className="absolute inset-3 rounded-full border-2 border-transparent border-b-primary/60 border-l-primary/30 shadow-lg shadow-primary/20"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          />

          {/* Center dot */}
          <div className="absolute inset-1/3 rounded-full bg-gradient-to-br from-primary to-primary/50 animate-pulse shadow-lg shadow-primary/40" />
        </div>

        {/* Text with smooth animation */}
        {text && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-lg font-semibold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent animate-pulse">
              {text}
            </p>
            
            {/* Loading dots animation */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/60"
                  style={{
                    animation: `bounce 1.4s infinite`,
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Subtle progress indicator */}
        <div className="w-48 h-1 rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"
            style={{ animation: 'shimmer 2s infinite' }}
          />
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

