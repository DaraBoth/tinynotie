import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Lottie from "lottie-react";
import meiwfootprint from "../assets/meiwfootprint.json";

export default function MeowFootprint() {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [rotation, setRotation] = useState(0); // Add rotation state
  const footprintSize = 249; // Adjust to the size of your Lottie animation

  useEffect(() => {
    const moveFootprint = () => {
      const newTop = Math.max(
        0,
        Math.min(
          window.innerHeight - footprintSize,
          Math.random() * window.innerHeight
        )
      );
      const newLeft = Math.max(
        0,
        Math.min(
          window.innerWidth - footprintSize,
          Math.random() * window.innerWidth
        )
      );

      const newRotation = Math.random() * 360; // Randomize rotation

      setPosition({ top: newTop, left: newLeft });
      setRotation(newRotation); // Set new rotation
    };

    const intervalId = setInterval(moveFootprint, 5160); // Move every 5.16 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        top: position.top,
        left: position.left,
        pointerEvents: "none",
        opacity: 1,
        mixBlendMode: "overlay",
        transform: `rotate(${rotation}deg)`, // Apply rotation
        transition: "transform 2s ease-in-out", // Smooth transition for rotation
      }}
    >
      <Lottie
        animationData={meiwfootprint}
        loop={true}
        style={{ width: footprintSize, height: footprintSize }}
      />
    </Box>
  );
}
