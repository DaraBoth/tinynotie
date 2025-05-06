import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

// Performance settings
const PERFORMANCE_MODE = {
  HIGH: "high",     // Full animations
  MEDIUM: "medium", // Medium animations
  LOW: "low",       // Minimal animations
  NONE: "none"      // Static background, no animations
};

// Moon component for dark mode
const Moon = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Only show in dark mode
  if (theme.palette.mode !== 'dark') return null;

  return (
    <motion.div
      style={{
        position: "absolute",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, #f5f5f5 0%, #e0e0e0 50%, #bdbdbd 100%)`,
        boxShadow: "0 0 20px rgba(255, 255, 255, 0.4)",
        right: "10%",
        top: "15%",
        zIndex: -8,
      }}
      initial={{ opacity: 0.8 }}
      animate={{
        opacity: [0.8, 0.85, 0.8],
      }}
      transition={{
        duration: 1800, // 30 minute cycle
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Moon craters */}
      <div style={{
        position: "absolute",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "#d0d0d0",
        top: "20%",
        left: "25%",
        opacity: 0.7,
      }} />
      <div style={{
        position: "absolute",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#d0d0d0",
        top: "50%",
        left: "60%",
        opacity: 0.5,
      }} />
      <div style={{
        position: "absolute",
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#d0d0d0",
        top: "70%",
        left: "30%",
        opacity: 0.6,
      }} />
    </motion.div>
  );
};

// Sun component for light mode
const Sun = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Only show in light mode
  if (theme.palette.mode !== 'light') return null;

  return (
    <motion.div
      style={{
        position: "absolute",
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: `radial-gradient(circle, #ffeb3b 0%, #ffc107 70%, #ff9800 100%)`,
        boxShadow: "0 0 40px rgba(255, 193, 7, 0.6)",
        left: "8%",
        top: "12%",
        zIndex: -8,
      }}
      initial={{ opacity: 0.7 }}
      animate={{
        opacity: [0.7, 0.75, 0.7],
      }}
      transition={{
        duration: 1800, // 30 minute cycle
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};



const SpaceSkyNew = ({ performanceMode = PERFORMANCE_MODE.LOW }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentPerformance, setCurrentPerformance] = useState(performanceMode);
  const frameRef = useRef(null);
  const isLowEndDevice = useRef(false);

  // Check if device is low-end (low memory or CPU)
  useEffect(() => {
    // Simple heuristic to detect low-end devices
    const checkPerformance = () => {
      // Check if device is mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // If it's a mobile device, default to low performance
      if (isMobile) {
        isLowEndDevice.current = true;
        setCurrentPerformance(PERFORMANCE_MODE.LOW);
        return;
      }

      // For desktop, measure FPS
      let lastTime = performance.now();
      let frames = 0;

      const countFrames = (time) => {
        frames++;

        if (time - lastTime > 1000) {
          const fps = frames * 1000 / (time - lastTime);

          // If FPS is low, reduce performance
          if (fps < 30) {
            isLowEndDevice.current = true;
            setCurrentPerformance(PERFORMANCE_MODE.LOW);
          }

          frames = 0;
          lastTime = time;
        }

        frameRef.current = requestAnimationFrame(countFrames);
      };

      frameRef.current = requestAnimationFrame(countFrames);

      // Stop measuring after 2 seconds
      setTimeout(() => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      }, 2000);
    };

    checkPerformance();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Use simplified animations for low-end devices
  const shouldAnimate = currentPerformance !== PERFORMANCE_MODE.NONE;

  // Determine background gradient based on theme mode
  const backgroundGradient = theme.palette.mode === 'dark'
    ? `linear-gradient(to bottom, ${colors.primary[900]} 0%, ${colors.primary[800]} 50%, ${colors.primary[700]} 100%)`
    : `linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 50%, #E0FFFF 100%)`;

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: backgroundGradient,
        zIndex: -20,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Only render celestial bodies if animations are enabled */}
      {shouldAnimate && (
        <>
          {/* Render moon in dark mode or sun in light mode */}
          <Moon />
          <Sun />
        </>
      )}
    </motion.div>
  );
};

export default SpaceSkyNew;
