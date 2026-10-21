import { center } from "@/lib/content";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-name">Center for Entrepreneurship</p>
        <p>
          {center.address}
          <br />
          {center.city}
        </p>
        <p>
          <a href={center.phoneHref}>{center.phone}</a>
          <span> · </span>
          <a href={`mailto:${center.email}`}>{center.email}</a>
        </p>
        <p>{center.hours}</p>
        <p>
          <a href={center.official}>cfe.umich.edu</a>
        </p>
      </div>
    </footer>
  );
}
