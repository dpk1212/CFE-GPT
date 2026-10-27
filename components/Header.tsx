"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/partners", label: "Partners" },
  { href: "/historical-data", label: "Historical Data" },
  { href: "/login", label: "Log in" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label="Entrepreneurship and Innovation, University of Michigan">
          <img src="/umei-logo.svg" alt="Entrepreneurship & Innovation, University of Michigan" />
        </Link>
        <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((value) => !value)}>
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
