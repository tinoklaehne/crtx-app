"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function ResizablePanel({
  children,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = window.innerWidth * 0.5,
  className
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const dragHandle = dragHandleRef.current;
    if (!panel || !dragHandle) return;

    let startX = 0;
    let startWidth = 0;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      startX = e.pageX;
      startWidth = panel.offsetWidth;
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = e.pageX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleDoubleClick = () => {
      setWidth(defaultWidth);
    };

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      setIsDragging(true);
      startX = e.touches[0].pageX;
      startWidth = panel.offsetWidth;
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].pageX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);
      setWidth(newWidth);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    dragHandle.addEventListener("mousedown", handleMouseDown);
    dragHandle.addEventListener("dblclick", handleDoubleClick);
    dragHandle.addEventListener("touchstart", handleTouchStart);

    return () => {
      dragHandle.removeEventListener("mousedown", handleMouseDown);
      dragHandle.removeEventListener("dblclick", handleDoubleClick);
      dragHandle.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, minWidth, maxWidth, defaultWidth]);

  return (
    <div
      ref={panelRef}
      className={cn("relative flex-shrink-0", className)}
      style={{ width: `${width}px` }}
      role="complementary"
      aria-label="Resizable side panel"
    >
      {children}
      <div
        ref={dragHandleRef}
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize group",
          "hover:bg-primary/10 active:bg-primary/20 transition-colors",
          isDragging && "bg-primary/20"
        )}
        role="separator"
        aria-label="Resize panel"
        aria-valuenow={width}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            setWidth(Math.max(width - 10, minWidth));
          } else if (e.key === "ArrowRight") {
            setWidth(Math.min(width + 10, maxWidth));
          }
        }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-[2px] h-4 bg-primary/50 rounded" />
        </div>
      </div>
    </div>
  );
}