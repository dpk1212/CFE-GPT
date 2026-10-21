"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/rankings", label: "Rankings" },
  { href: "/programs", label: "Programs" },
  { href: "/courses", label: "Courses" },
  { href: "/programs/i-corps", label: "I-Corps" },
  { href: "/guide", label: "Guide" },
  { href: "/visit", label: "Visit" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label="Center for Entrepreneurship home">
          <span className="brand-mark">CFE</span>
          <span>
            <span className="brand-name">Center for Entrepreneurship</span>
            <span className="brand-sub">University of Michigan</span>
          </span>
        </Link>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" className={open ? "nav-links open" : "nav-links"} aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
