import type { Metadata } from "next";
import { VisitForm } from "@/components/VisitForm";
import { center } from "@/lib/content";

export const metadata: Metadata = {
  title: "Visit",
  description: "Find the University of Michigan Center for Entrepreneurship in the Duderstadt Center and write an advisor.",
};

export default function VisitPage() {
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.address}, ${center.city}`)}`;

  return (
    <article className="page">
      <header className="page-hero">
        <p className="kicker">North Campus</p>
        <h1>The desk is in the Duderstadt Center.</h1>
        <p className="lede dark">Come by on a weekday, or write first. Advisors are how certificate plans, applications, and odd course questions get settled.</p>
      </header>
      <div className="visit-grid">
        <div className="visit-card">
          <p className="kicker">Find the Center</p>
          <h2>{center.address}</h2>
          <p>{center.city}</p>
          <p>{center.hours}</p>
          <p>
            <a href={center.phoneHref}>{center.phone}</a>
          </p>
          <p>
            <a href={`mailto:${center.email}`}>{center.email}</a>
          </p>
          <p>
            <a href={map}>Open in maps</a>
          </p>
          <p>
            <a href={center.official}>cfe.umich.edu</a>
          </p>
        </div>
        <VisitForm />
      </div>
    </article>
  );
}
