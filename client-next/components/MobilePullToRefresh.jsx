'use client';

import { useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 84;
const MAX_PULL_DISTANCE = 130;

const isScrollableY = (element) => {
  if (!element || typeof window === 'undefined') return false;
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  return overflowY === 'auto' || overflowY === 'scroll';
};

const findScrollableParent = (node) => {
  let current = node;
  while (current && current !== document.body) {
    if (isScrollableY(current) && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return document.scrollingElement || document.documentElement;
};

export function MobilePullToRefresh({ onRefresh, enabled = true }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(null);
  const canPullRef = useRef(false);
  const runningRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const activeScrollerRef = useRef(null);

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
      if (runningRef.current || refreshingRef.current) return;

      const touchTarget = event.target;
      const scroller = findScrollableParent(touchTarget);
      activeScrollerRef.current = scroller;

      const scrollerTop = Number(scroller?.scrollTop || 0);
      const windowTop = Number(window.scrollY || 0);

      if (scrollerTop > 0 || windowTop > 0) {
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

      const scrollerTop = Number(activeScrollerRef.current?.scrollTop || 0);
      const windowTop = Number(window.scrollY || 0);
      if (scrollerTop > 0 || windowTop > 0) {
        canPullRef.current = false;
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
      activeScrollerRef.current = null;

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

    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart, { capture: true });
      document.removeEventListener('touchmove', onTouchMove, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
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
