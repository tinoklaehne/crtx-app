"use client";

import { getRingLabel } from "../utils/calculations";
import { Logo } from "../../layout/Logo";
import type { NodePositioning } from "@/app/types";

interface RadarRingsProps {
  centerX: number;
  centerY: number;
  minRadius: number;
  maxRadius: number;
  nodePositioning: NodePositioning;
}

export function RadarRings({
  centerX,
  centerY,
  minRadius,
  maxRadius,
  nodePositioning
}: RadarRingsProps) {
  return (
    <g>
      {/* Center Logo */}
      <g transform={`translate(${centerX - 50}, ${centerY - 50})`}>
        <foreignObject width="100" height="100">
          <div className="w-full h-full flex items-center justify-center opacity-10">
            <Logo />
          </div>
        </foreignObject>
      </g>

      {/* Rings */}
      {[9, 7, 5, 3, 1].map((level) => {
        const radius = minRadius + ((maxRadius - minRadius) * ((9 - level) / 8));
        return (
          <g key={level}>
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none" 
              className={`${level === 1 ? 'stroke-foreground/40 dark:stroke-muted-foreground/40' : 'stroke-foreground/20 dark:stroke-muted-foreground/20'}`}
              strokeWidth={level === 1 ? 1.5 : 1}
              strokeDasharray={level === 1 ? 'none' : '4 4'}
            />
            <text
              x={centerX}
              y={centerY - radius}
              textAnchor="middle"
              alignmentBaseline="middle"
              className="text-[10px] fill-foreground/60 dark:fill-muted-foreground/80"
              transform={`translate(0, -10)`}
            >
              {getRingLabel(level, nodePositioning)}
            </text>
          </g>
        );
      })}
    </g>
  );
}