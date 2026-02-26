'use client';

import { useIsFetching } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Thin animated progress bar at the very top of the screen.
 * Automatically appears whenever any TanStack Query fetch is in-flight.
 * Also exported as an imperative API for manual use.
 */
export function TopLoadingBar() {
  const fetchingCount = useIsFetching();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (fetchingCount > 0) {
      // Start bar
      setProgress(0);
      setVisible(true);
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);

      // Crawl to ~85 % while fetching
      let p = 0;
      intervalRef.current = setInterval(() => {
        p += Math.random() * 12;
        if (p >= 85) { p = 85; clearInterval(intervalRef.current); }
        setProgress(p);
      }, 200);
    } else {
      // Complete bar
      clearInterval(intervalRef.current);
      setProgress(100);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [fetchingCount]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="top-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
          aria-hidden
        >
          <motion.div
            className="h-full bg-primary shadow-[0_0_8px_2px] shadow-primary/70 rounded-r-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
