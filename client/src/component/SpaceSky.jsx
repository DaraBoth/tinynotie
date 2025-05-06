import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

// Performance settings
const PERFORMANCE_MODE = {
  HIGH: "high",     // Full animations, all elements
  MEDIUM: "medium", // Reduced elements, full animations
  LOW: "low",       // Minimal elements, simplified animations
  NONE: "none"      // Static background, no animations
};

// Star component for individual stars
const Star = ({ size, color, initialX, initialY, depth }) => {
  const randomDuration = 600 + Math.random() * 300; // Extremely slow animation: Random duration between 10-15 minutes

  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        left: `${initialX}%`,
        top: `${initialY}%`,
        zIndex: -10,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ opacity: Math.random() * 0.7 + 0.3 }}
      animate={{
        opacity: [Math.random() * 0.7 + 0.3, Math.random() * 0.6 + 0.4, Math.random() * 0.7 + 0.3],
        scale: [1, 1.005, 1], // Virtually imperceptible scale change
        z: [depth, depth + 0.5, depth], // Almost no z-movement
      }}
      transition={{
        duration: randomDuration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Shooting star component
const ShootingStar = ({ delay }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  const angle = Math.random() * 45 - 22.5; // Random angle between -22.5 and 22.5 degrees

  return (
    <motion.div
      style={{
        position: "absolute",
        width: "2px",
        height: "2px",
        background: colors.primary[100],
        borderRadius: "50%",
        zIndex: -5,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.4, 0],
        scale: [0, 1, 0],
        x: [0, Math.cos(angle * Math.PI / 180) * 100],
        y: [0, Math.sin(angle * Math.PI / 180) * 100],
      }}
      transition={{
        duration: 15, // Extremely slow shooting star animation (15 seconds)
        delay,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: Math.random() * 600 + 600, // Extremely long delay between 10-20 minutes
      }}
    />
  );
};

// Nebula component for colorful gas clouds
const Nebula = ({ color, x, y, size }) => {
  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}22 0%, ${color}11 40%, ${color}05 70%, transparent 100%)`,
        left: `${x}%`,
        top: `${y}%`,
        zIndex: -15,
        mixBlendMode: "screen",
      }}
      animate={{
        scale: [1, 1.002, 1], // Almost non-existent scale change
        opacity: [0.6, 0.62, 0.6], // Barely noticeable opacity change
      }}
      transition={{
        duration: 900 + Math.random() * 300, // Extremely slow animation: 15-20 minutes per cycle
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

const SpaceSky = ({ performanceMode = PERFORMANCE_MODE.LOW }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [stars, setStars] = useState([]);
  const [shootingStars, setShootingStars] = useState([]);
  const [nebulae, setNebulae] = useState([]);
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

  useEffect(() => {
    // Determine element counts based on performance mode
    let starCount, shootingStarCount, nebulaCount;

    switch (currentPerformance) {
      case PERFORMANCE_MODE.HIGH:
        starCount = window.innerWidth < 600 ? 50 : 100;
        shootingStarCount = window.innerWidth < 600 ? 3 : 5;
        nebulaCount = window.innerWidth < 600 ? 3 : 5;
        break;
      case PERFORMANCE_MODE.MEDIUM:
        starCount = window.innerWidth < 600 ? 30 : 60;
        shootingStarCount = window.innerWidth < 600 ? 2 : 3;
        nebulaCount = window.innerWidth < 600 ? 2 : 3;
        break;
      case PERFORMANCE_MODE.LOW:
        starCount = window.innerWidth < 600 ? 8 : 15;
        shootingStarCount = window.innerWidth < 600 ? 0 : 1;
        nebulaCount = window.innerWidth < 600 ? 0 : 1;
        break;
      case PERFORMANCE_MODE.NONE:
        starCount = 0;
        shootingStarCount = 0;
        nebulaCount = 0;
        break;
      default:
        starCount = window.innerWidth < 600 ? 15 : 30;
        shootingStarCount = window.innerWidth < 600 ? 1 : 2;
        nebulaCount = window.innerWidth < 600 ? 1 : 2;
    }

    // Generate stars
    if (starCount > 0) {
      const newStars = Array.from({ length: starCount }).map((_, i) => ({
        id: `star-${i}`,
        size: Math.random() * 2 + 1, // Size between 1-3px
        color: i % 10 === 0 ? colors.blueAccent[300] : i % 15 === 0 ? colors.redAccent[300] : colors.primary[100],
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
        depth: Math.random() * -50 - 10, // Random depth for parallax effect
      }));
      setStars(newStars);
    } else {
      setStars([]);
    }

    // Generate shooting stars
    if (shootingStarCount > 0) {
      const newShootingStars = Array.from({ length: shootingStarCount }).map((_, i) => ({
        id: `shooting-star-${i}`,
        delay: Math.random() * 10, // Random initial delay
      }));
      setShootingStars(newShootingStars);
    } else {
      setShootingStars([]);
    }

    // Generate nebulae
    if (nebulaCount > 0) {
      const nebulaColors = [
        colors.blueAccent[300],
        colors.redAccent[300],
        colors.greenAccent[300],
        colors.purpleAccent ? colors.purpleAccent[300] : "#9c27b0",
      ];

      const newNebulae = Array.from({ length: nebulaCount }).map((_, i) => ({
        id: `nebula-${i}`,
        color: nebulaColors[i % nebulaColors.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 200 + 100, // Size between 100-300px
      }));
      setNebulae(newNebulae);
    } else {
      setNebulae([]);
    }
  }, [colors, currentPerformance]);

  // Use simplified animations for low-end devices
  const shouldAnimate = currentPerformance !== PERFORMANCE_MODE.NONE;

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: `linear-gradient(to bottom, ${colors.primary[900]} 0%, ${colors.primary[800]} 50%, ${colors.primary[700]} 100%)`,
        zIndex: -20,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Only render elements if animations are enabled */}
      {shouldAnimate && (
        <>
          {/* Render stars with reduced motion for low-end devices */}
          {stars.map((star) => (
            <Star key={star.id} {...star} />
          ))}

          {/* Only render shooting stars in medium and high performance modes */}
          {(currentPerformance === PERFORMANCE_MODE.HIGH ||
            currentPerformance === PERFORMANCE_MODE.MEDIUM) &&
            shootingStars.map((shootingStar) => (
              <ShootingStar key={shootingStar.id} delay={shootingStar.delay} />
            ))
          }

          {/* Render nebulae */}
          {nebulae.map((nebula) => (
            <Nebula key={nebula.id} {...nebula} />
          ))}
        </>
      )}
    </motion.div>
  );
};

export default SpaceSky;
