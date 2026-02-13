"use client";

import { useState, useEffect, RefObject } from "react";

export function useRadarSize(svgRef: RefObject<SVGSVGElement>) {
  const [size, setSize] = useState({ width: 800, height: 800 });

  useEffect(() => {
    const updateSize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setSize({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [svgRef]);

  return size;
}