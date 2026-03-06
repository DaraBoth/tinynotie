'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

export function SpaceSky() {
  const canvasRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    let animationId;

    if (isDark) {
      // Dark: animated star field
      const stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.6 + 0.2,
        opacity: Math.random(),
        speed: (Math.random() - 0.5) * 0.8,
      }));
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach((star) => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.opacity))})`;
          ctx.fill();
          star.opacity += star.speed * 0.01;
          if (star.opacity > 1 || star.opacity < 0.05) star.speed *= -1;
        });
        animationId = requestAnimationFrame(animate);
      };
      animate();
    } else {
      // Light: soft cloud puffs drifting
      const clouds = Array.from({ length: 6 }, (_, i) => ({
        x: (i / 6) * canvas.width * 1.5 - canvas.width * 0.1,
        y: 40 + Math.random() * canvas.height * 0.45,
        width: 180 + Math.random() * 200,
        height: 60 + Math.random() * 50,
        opacity: 0.55 + Math.random() * 0.3,
        speed: 0.12 + Math.random() * 0.18,
      }));
      const drawCloud = (cx, cy, w, h, alpha) => {
        ctx.save();
        const grd = ctx.createRadialGradient(cx, cy, h * 0.1, cx, cy, w * 0.5);
        grd.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grd.addColorStop(1, `rgba(200,225,255,0)`);
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx - w * 0.22, cy + h * 0.05, w * 0.3, h * 0.38, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + w * 0.22, cy + h * 0.05, w * 0.3, h * 0.38, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.fill();
        ctx.restore();
      };
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        clouds.forEach((cloud) => {
          drawCloud(cloud.x, cloud.y, cloud.width, cloud.height, cloud.opacity);
          cloud.x += cloud.speed;
          if (cloud.x - cloud.width > canvas.width) {
            cloud.x = -cloud.width;
            cloud.y = 40 + Math.random() * canvas.height * 0.45;
          }
        });
        animationId = requestAnimationFrame(animate);
      };
      animate();
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  if (isDark) {
    return (
      <div
        className="fixed inset-0 -z-10 overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(180deg, hsl(var(--background)) 0%, rgba(var(--primary-rgb), 0.2) 55%, rgba(var(--accent-rgb), 0.16) 100%)',
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.18)' }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[450px] h-[450px] rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.2)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.45, 0.25, 0.45] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-10 w-64 h-64 rounded-full blur-2xl"
          style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(180deg, hsl(var(--background)) 0%, rgba(var(--primary-rgb), 0.08) 58%, rgba(var(--accent-rgb), 0.1) 100%)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <motion.div
        className="absolute top-8 right-16 w-32 h-32 rounded-full blur-2xl"
        style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.45)' }}
        animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.12, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute top-10 right-[4.5rem] w-16 h-16 rounded-full blur-sm"
        style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.32)' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 w-[600px] h-48 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.2)' }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[700px] h-48 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.18)' }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
    </div>
  );
}
