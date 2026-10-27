"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function useChartPlay(watch: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("play");
      return;
    }
    node.classList.remove("play");
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      frame = requestAnimationFrame(() => node.classList.add("play"));
      observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [watch]);

  return ref;
}

export function ChartFrame({ children, watch = "" }: { children: ReactNode; watch?: string }) {
  const ref = useChartPlay(watch);
  return (
    <div ref={ref} className="chart-frame">
      {children}
    </div>
  );
}
