"use client";

import { useMemo, useState } from "react";
import { courseFilters, courses } from "@/lib/content";

export function CoursesExplorer() {
  const [filter, setFilter] = useState<(typeof courseFilters)[number]>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      const tagged = filter === "All" || course.tags.includes(filter);
      const haystack = `${course.code} ${course.title} ${course.summary} ${course.credits}`.toLowerCase();
      return tagged && (!needle || haystack.includes(needle));
    });
  }, [filter, query]);

  return (
    <div className="catalog">
      <div className="catalog-tools">
        <label>
          Search courses
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by number, title, or topic"
            type="search"
          />
        </label>
        <div className="prompt-row" role="group" aria-label="Filter courses">
          {courseFilters.map((item) => (
            <button
              key={item}
              type="button"
              className={item === filter ? "chip on" : "chip"}
              aria-pressed={item === filter}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="result-count">
          {visible.length} {visible.length === 1 ? "course" : "courses"}
        </p>
      </div>
      <div className="course-grid">
        {visible.map((course) => (
          <article key={course.code} className="course-card">
            <p className="code">{course.code}</p>
            <h3>{course.title}</h3>
            <p className="credits">{course.credits}</p>
            <p>{course.summary}</p>
            <ul>
              {course.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {visible.length === 0 && (
        <p className="empty">Nothing matches that search. Clear a filter, or email entrepreneurship@umich.edu and ask an advisor.</p>
      )}
    </div>
  );
}
