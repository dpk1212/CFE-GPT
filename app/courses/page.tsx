import type { Metadata } from "next";
import { CoursesExplorer } from "@/components/CoursesExplorer";
import { courseNotes } from "@/lib/content";

export const metadata: Metadata = {
  title: "ENTR courses",
  description: "Entrepreneurship courses open to every University of Michigan school and college. Search the published ENTR catalog.",
};

export default function CoursesPage() {
  return (
    <article className="page">
      <header className="page-hero">
        <p className="kicker">Subject code ENTR</p>
        <h1>Courses for every school, not a college inside a college.</h1>
        <p className="lede dark">
          More than thirty sections. No current prerequisite. In person. Seniors can reach the 500-level; graduate students can take 400 and above. Register in Wolverine Access or Atlas.
        </p>
      </header>
      <ul className="note-row">
        {courseNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <CoursesExplorer />
      <p className="source-line">
        Summaries are original briefings of the public catalog. Confirm the term, credit hours, and section on{" "}
        <a href="https://cfe.umich.edu/learn/entrepreneurial-courses/courses/">the official course list</a> before you enroll.
      </p>
    </article>
  );
}
