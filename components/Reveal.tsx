"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("main [data-reveal], footer [data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            const wasWaiting = element.classList.contains("wait");
            element.classList.remove("wait");
            element.classList.add("is-in");
            if (!wasWaiting) element.classList.add("seen");
            observer.unobserve(element);
            return;
          }
          element.classList.add("wait");
        });
      },
      { rootMargin: "0px 0px 40px 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
