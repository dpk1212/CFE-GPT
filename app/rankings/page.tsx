import type { Metadata } from "next";
import Link from "next/link";
import { rankings } from "@/lib/content";

export const metadata: Metadata = {
  title: "2026 Princeton Review",
  description:
    "University of Michigan is No. 1 in the Midwest and No. 4 undergraduate, No. 5 graduate on the 2026 Princeton Review and Entrepreneur entrepreneurship lists.",
};

export default function RankingsPage() {
  return (
    <article className="page">
      <header className="page-hero dark">
        <p className="kicker">Announced {rankings.announced}</p>
        <h1>Twentieth year of the list. Eleventh year of Michigan in the top ten.</h1>
        <p className="lede">
          {rankings.sourceName} rank undergraduate and graduate entrepreneurship programs separately. Michigan leads the Midwest on both, and sits fourth and fifth in the country.
        </p>
      </header>

      <div className="rank-board standalone" aria-label="2026 placements">
        <article>
          <p>Midwest undergraduate</p>
          <strong>No. 1</strong>
          <span>University of Michigan—Ann Arbor</span>
        </article>
        <article>
          <p>Midwest graduate</p>
          <strong>No. 1</strong>
          <span>University of Michigan—Ann Arbor</span>
        </article>
        <article>
          <p>National undergraduate</p>
          <strong>No. 4</strong>
          <span>Behind Houston, Texas, and Babson</span>
        </article>
        <article>
          <p>National graduate</p>
          <strong>No. 5</strong>
          <span>Rice, UCLA, Texas, and Washington lead</span>
        </article>
      </div>

      <div className="page-grid">
        <div className="prose">
          <h2>What changed from 2025</h2>
          <p>
            On the 2025 lists, Michigan’s graduate programs were No. {rankings.priorGraduate} and undergraduate programs were No. {rankings.priorUndergrad}. The Center marked that year as the tenth consecutive appearance in the worldwide top 10.
          </p>
          <p>
            The 2026 lists, released November 12, 2025, move the undergraduate program to No. {rankings.undergradNational} and the graduate program to No. {rankings.graduateNational}. Both remain first in the Midwest. The top-10 run continues.
          </p>
          <h2>How the list is built</h2>
          <p>{rankings.methodology}</p>
          <p>
            Regional No. 1 schools are named separately from the national top 50. Midwest No. 1 is not the same claim as national No. 1. This page keeps those two facts apart on purpose. National undergraduate No. 1 for 2026 is the University of Houston. National graduate No. 1 is Rice University.
          </p>
          <h2>What the Center pointed to</h2>
          <p>
            In the Center’s account of the 2025 recognition, just over 1 in 5 undergraduates enrolled in an entrepreneurship course in the 2024 academic year. Those students came from 132 of Michigan’s 144 undergraduate majors. More than 227 faculty taught the subject across 71 departments.
          </p>
          <p>
            Over the decade covered in that account, undergraduate alumni launched 688 companies and raised $1.23 billion. About a third of those ventures were still operating. The campus network around the Center includes the Entrepreneurship Minor, Ross Zell Lurie, optiMize, the School of Information, Taubman, Public Health, and the rest of a partnership the Center counts in the dozens.
          </p>
        </div>
        <aside className="aside">
          <p className="kicker">Sources</p>
          <a href={rankings.press}>Princeton Review press release</a>
          <a href={rankings.cfeStory}>CFE note on the decade in the top 10</a>
          <a href="https://entrepreneurship.umich.edu/">Campus entrepreneurship gateway</a>
          <Link href="/programs">The programs those measures describe</Link>
          <Link href="/guide">Ask the guide about the ranking</Link>
        </aside>
      </div>
    </article>
  );
}
