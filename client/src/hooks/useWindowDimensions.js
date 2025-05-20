import { useState, useEffect, useMemo } from 'react';

// Device size breakpoints
const DEVICE_SIZES = {
  GALAXY_FOLD: 280, // Galaxy Fold width
  IPHONE_SE: 375, // iPhone SE width
  IPHONE_12: 390, // iPhone 12/13 width
  MOBILE: 600, // General mobile breakpoint
  TABLET: 960, // Tablet breakpoint
};

// Custom hook to get window dimensions and responsive dialog sizing
function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      // Get the actual viewport width
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

      setWindowDimensions({
        width: vw,
        height: vh,
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect is only run on mount and unmount

  // Calculate optimal dialog dimensions based on screen size
  const dialogDimensions = useMemo(() => {
    const { width, height } = windowDimensions;

    // Calculate optimal margins based on device size
    let sideMargin = 32; // Default side margin

    if (width <= DEVICE_SIZES.GALAXY_FOLD) {
      sideMargin = 16; // Smaller margins for very small devices
    } else if (width <= DEVICE_SIZES.IPHONE_SE) {
      sideMargin = 20; // Small margins for small devices
    } else if (width <= DEVICE_SIZES.IPHONE_12) {
      sideMargin = 24; // Medium margins for medium devices
    } else if (width <= DEVICE_SIZES.MOBILE) {
      sideMargin = 32; // Larger margins for larger mobile devices
    }

    // Calculate optimal dialog width
    const optimalWidth = width - (sideMargin * 2);

    // Calculate optimal dialog height (80% of viewport height for mobile, 90% for very small screens)
    const heightPercentage = width <= DEVICE_SIZES.IPHONE_SE ? 0.9 : 0.8;
    const optimalHeight = height * heightPercentage;

    return {
      width: optimalWidth,
      maxWidth: optimalWidth,
      height: optimalHeight,
      maxHeight: optimalHeight,
      sideMargin,
      isSmallDevice: width <= DEVICE_SIZES.IPHONE_SE,
      isVerySmallDevice: width <= DEVICE_SIZES.GALAXY_FOLD,
      isMobileDevice: width <= DEVICE_SIZES.MOBILE,
    };
  }, [windowDimensions]);

  return {
    ...windowDimensions,
    dialogDimensions,
    deviceSizes: DEVICE_SIZES,
  };
}

export default useWindowDimensions;
