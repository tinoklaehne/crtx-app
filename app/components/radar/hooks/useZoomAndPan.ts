"use client";

import { useState } from "react";

export function useZoomAndPan() {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 2));
  };

  return {
    zoom,
    rotation,
    x,
    y,
    handleWheel,
    setRotation,
    setX,
    setY
  };
}