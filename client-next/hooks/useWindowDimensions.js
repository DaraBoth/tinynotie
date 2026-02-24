'use client';

import { useState, useEffect } from 'react';

const DEVICE_SIZES = {
  GALAXY_FOLD: 280,
  IPHONE_SE: 375,
  MOBILE: 600,
  TABLET: 900,
  DESKTOP: 1200,
};

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = windowDimensions;

  // Device type detection
  const isGalaxyFold = width <= DEVICE_SIZES.GALAXY_FOLD;
  const isIPhoneSE = width <= DEVICE_SIZES.IPHONE_SE;
  const isMobile = width <= DEVICE_SIZES.MOBILE;
  const isTablet = width > DEVICE_SIZES.MOBILE && width <= DEVICE_SIZES.TABLET;
  const isDesktop = width > DEVICE_SIZES.TABLET;

  // Dialog dimensions for responsive modals
  const dialogDimensions = {
    maxWidth: isGalaxyFold ? '95%' : isIPhoneSE ? '90%' : isMobile ? '85%' : '600px',
    margin: isGalaxyFold ? 8 : isIPhoneSE ? 12 : isMobile ? 16 : 24,
    padding: isGalaxyFold ? 8 : isIPhoneSE ? 12 : isMobile ? 16 : 20,
  };

  return {
    width,
    height,
    isGalaxyFold,
    isIPhoneSE,
    isMobile,
    isTablet,
    isDesktop,
    dialogDimensions,
    DEVICE_SIZES,
  };
}
