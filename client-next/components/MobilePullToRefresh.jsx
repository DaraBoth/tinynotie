'use client';

import { useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 84;
const MAX_PULL_DISTANCE = 130;

const isLikelyMobileTouch = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0;
};

export function MobilePullToRefresh({ onRefresh, enabled = true }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(null);
  const canPullRef = useRef(false);
  const runningRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);

  const setPull = (value) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  };

  const setRefreshingState = (value) => {
    refreshingRef.current = value;
    setRefreshing(value);
  };

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onTouchStart = (event) => {
      if (!isLikelyMobileTouch() || runningRef.current || refreshingRef.current) return;
      if (window.scrollY > 0) {
        canPullRef.current = false;
        startYRef.current = null;
        return;
      }

      startYRef.current = event.touches?.[0]?.clientY ?? null;
      canPullRef.current = true;
    };

    const onTouchMove = (event) => {
      if (!canPullRef.current || startYRef.current == null || runningRef.current || refreshingRef.current) return;

      const currentY = event.touches?.[0]?.clientY ?? null;
      if (currentY == null) return;

      const delta = currentY - startYRef.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }

      if (window.scrollY > 0) {
        setPull(0);
        return;
      }

      const dampened = Math.min(MAX_PULL_DISTANCE, delta * 0.5);
      setPull(dampened);

      // Stop browser bounce while user is performing a pull gesture.
      event.preventDefault();
    };

    const onTouchEnd = async () => {
      if (runningRef.current || refreshingRef.current) return;

      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD;
      setPull(0);
      startYRef.current = null;
      canPullRef.current = false;

      if (!shouldRefresh || typeof onRefresh !== 'function') return;

      runningRef.current = true;
      setRefreshingState(true);

      try {
        await onRefresh();
      } finally {
        runningRef.current = false;
        setRefreshingState(false);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, onRefresh]);

  const progress = Math.max(0, Math.min(1, pullDistance / PULL_THRESHOLD));
  const visible = refreshing || pullDistance > 4;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] flex justify-center transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ transform: `translateY(${Math.min(MAX_PULL_DISTANCE, pullDistance)}px)` }}
      aria-hidden="true"
    >
      <div className="mt-2 rounded-full border border-border/40 bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        {refreshing ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
            Refreshing...
          </div>
        ) : (
          <div className="text-xs font-semibold text-muted-foreground">
            Pull to refresh {Math.round(progress * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}
