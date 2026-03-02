'use client';

/**
 * Full-page loading state.
 * Shows a lightweight dual-ring spinner + animated text.
 * The global TopLoadingBar (in providers.jsx) covers the top strip automatically
 * for all in-flight queries — no Lottie dependency needed here.
 */
export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] gap-5 select-none">
      {/* Dual-ring spinner */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div
          className="absolute inset-2 rounded-full border-4 border-b-primary/40 border-t-transparent border-r-transparent border-l-transparent animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}
        />
      </div>

      {text && (
        <p className="text-sm text-muted-foreground animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
}

