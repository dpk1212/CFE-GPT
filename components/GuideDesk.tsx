"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { answerQuestion, prompts, type GuideReply } from "@/lib/guide";

type Turn = { role: "user" | "guide"; text?: string; reply?: GuideReply };

export function GuideDesk() {
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "guide",
      reply: {
        id: "welcome",
        title: "Ask the way you would ask the front desk.",
        paragraphs: [
          "I brief the published record: the 2026 Princeton Review placement, who can take a course, I-Corps, ELP, EHour, the graduate certificate, and the TechLabs.",
          "I do not register you, and I do not guess at a deadline that the Center has not published. When a fact matters for your semester, the address is entrepreneurship@umich.edu.",
        ],
      },
    },
  ]);
  const [query, setQuery] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  function ask(value: string) {
    const next = value.trim();
    if (!next) return;
    const reply = answerQuestion(next);
    setTurns((current) => [...current, { role: "user", text: next }, { role: "guide", reply }]);
    setQuery("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(query);
  }

  return (
    <div className="guide-shell">
      <div className="prompt-row" aria-label="Suggested questions">
        {prompts.map((prompt) => (
          <button key={prompt} type="button" className="chip" onClick={() => ask(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <div className="guide-log" ref={logRef} aria-live="polite">
        {turns.map((turn, index) =>
          turn.role === "user" ? (
            <article key={index} className="bubble user">
              <p>{turn.text}</p>
            </article>
          ) : (
            <article key={index} className="bubble guide">
              <p className="bubble-kicker">CFE Guide</p>
              <h2>{turn.reply?.title}</h2>
              {turn.reply?.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {turn.reply?.facts && (
                <dl className="mini-facts">
                  {turn.reply.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {turn.reply?.links && (
                <p className="bubble-links">
                  {turn.reply.links.map((link) => (
                    <a key={link.href} href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </p>
              )}
              {turn.reply?.related && (
                <div className="related">
                  {turn.reply.related.map((item) => (
                    <button key={item} type="button" onClick={() => ask(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ),
        )}
      </div>
      <form className="composer" onSubmit={onSubmit}>
        <label htmlFor="guide-question">Your question</label>
        <div>
          <textarea
            id="guide-question"
            ref={inputRef}
            rows={2}
            value={query}
            placeholder="Ask about a program, a course, or the ranking."
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask(query);
              }
            }}
          />
          <button type="submit" className="btn btn-blue">
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
