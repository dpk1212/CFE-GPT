"use client";

import { FormEvent, useState } from "react";
import { center } from "@/lib/content";

export function VisitForm() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [note, setNote] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const subject = encodeURIComponent(`CFE question from ${name || "a visitor"}`);
    const body = encodeURIComponent(
      `Name: ${name || "Not given"}\nRole: ${role}\n\n${note || "I would like to talk with an advisor."}\n`,
    );
    window.location.href = `mailto:${center.email}?subject=${subject}&body=${body}`;
  }

  return (
    <form className="visit-form" onSubmit={onSubmit}>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
      </label>
      <label>
        I am
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option>Student</option>
          <option>Graduate researcher</option>
          <option>Faculty or staff</option>
          <option>Family or guest</option>
          <option>Community founder</option>
        </select>
      </label>
      <label>
        What do you need?
        <textarea
          rows={5}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="A course, the certificate, I-Corps, EHour, or a time to visit."
        />
      </label>
      <button className="btn btn-blue" type="submit">
        Open an email to the Center
      </button>
      <p className="form-note">This opens your mail app addressed to {center.email}. Nothing is stored on this site.</p>
    </form>
  );
}
