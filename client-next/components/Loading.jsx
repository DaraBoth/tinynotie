'use client';

import Lottie from 'lottie-react';
import animationData from '@/assets/animation.json';

export function Loading({ size = 200, text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Lottie
        animationData={animationData}
        loop
        style={{ width: size, height: size }}
      />
      {text && (
        <p className="text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}
