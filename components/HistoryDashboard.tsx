"use client";

import { useMemo, useState, type ReactNode } from "react";
import { history, integer, latest, money, percent, prior, type HistoryYear } from "@/lib/history";

type Mode = "cycle" | "academic";

function delta(current: number, previous: number) {
  const change = current - previous;
  const ratio = previous === 0 ? 0 : change / previous;
  const sign = change > 0 ? "+" : "";
  return { change, label: `${sign}${Math.round(ratio * 1000) / 10}%` };
}

function labelFor(row: HistoryYear, mode: Mode) {
  return mode === "cycle" ? `’${row.cycle.slice(2)}` : row.academic.replace("–", "-");
}

export function HistoryDashboard() {
  const [mode, setMode] = useState<Mode>("cycle");
  const labels = history.map((row) => labelFor(row, mode));
  const enrollmentDelta = delta(latest.enrollment, prior.enrollment);
  const partnerDelta = delta(latest.partners, prior.partners);
  const ventureDelta = delta(latest.ventureTests ?? 0, prior.ventureTests ?? 0);
  const awardDelta = delta(latest.scholarshipDollars, prior.scholarshipDollars);

  const kpis = [
    {
      label: "Enrollment",
      value: integer(latest.enrollment),
      note: `${percent(latest.ugShare)} of undergraduates`,
      delta: enrollmentDelta.label,
      help: "Undergraduates in a reported entrepreneurship course or experience, counted once. A student in two courses is still one student.",
    },
    {
      label: "Reporting partners",
      value: integer(latest.partners),
      note: `From ${history[0].partners} in ${history[0].academic}`,
      delta: partnerDelta.label,
      help: "Colleges, schools, and units that sent undergraduate numbers for this rankings cycle. The directory names the units we have on file so far.",
    },
    {
      label: "Majors represented",
      value: integer(latest.majors),
      note: `${integer(latest.departments)} faculty departments`,
      delta: delta(latest.majors, prior.majors).label,
      help: "Distinct undergraduate majors among the enrolled students. Departments are the faculty homes that taught or sponsored the activity.",
    },
    {
      label: "Venture tests",
      value: integer(latest.ventureTests ?? 0),
      note: "Student venture testing",
      delta: ventureDelta.label,
      help: "Times students tested a venture assumption with a customer, user, or prototype. This series starts with the 2022 rankings file.",
    },
    {
      label: "Prize money, cumulative",
      value: money(latest.prizeCumulative),
      note: `${money(latest.prize)} this year`,
      delta: "",
      help: "Running total of student prize money since 2017–18. The card shows the total. The chart splits the year it was awarded from that running total.",
    },
    {
      label: "Grants and awards, cumulative",
      value: money(latest.scholarshipDollarsCumulative),
      note: `${integer(latest.scholarships)} awards · ${money(latest.scholarshipDollars)} this year`,
      delta: awardDelta.label,
      help: "Scholarships and grants from any funding source. The change is this year’s dollars versus last year. The big number is every dollar since 2017–18.",
    },
  ];

  return (
    <div className="dash">
      <section className="signature" aria-label="2025 to 2026 headline figures">
        <p>Undergraduate file · 2025–26 · for the 2027 rankings cycle</p>
        <div>
          <article><strong>{integer(latest.enrollment)}</strong><span>Enrollment</span></article>
          <article><strong>{percent(latest.ugShare)}</strong><span>Undergraduate share</span></article>
          <article><strong>{integer(latest.partners)}</strong><span>Reporting partners</span></article>
          <article><strong>{money(latest.scholarshipDollarsCumulative)}</strong><span>Cumulative awards</span></article>
        </div>
      </section>
      <div className="dash-toolbar">
        <p>Change on each card is versus the 2024–25 reporting year. Switch the axis between the rankings cycle and the academic year.</p>
        <div className="segment" role="group" aria-label="Axis labels">
          <button type="button" aria-pressed={mode === "cycle"} className={mode === "cycle" ? "on" : ""} onClick={() => setMode("cycle")}>Rankings year</button>
          <button type="button" aria-pressed={mode === "academic"} className={mode === "academic" ? "on" : ""} onClick={() => setMode("academic")}>Academic year</button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((item) => (
          <article key={item.label}>
            <p className="kpi-label">{item.label}</p>
            <p className="kpi-value">{item.value}</p>
            <p className="kpi-note">
              <span>{item.note}</span>
              {item.delta ? <span className={item.delta.startsWith("-") ? "pill down" : "pill up"}>{item.delta}</span> : <span className="pill flat">Cumulative</span>}
            </p>
            <p className="kpi-help">{item.help}</p>
          </article>
        ))}
      </div>

      <div className="chart-grid">
        <Panel title="Enrollment" note="Bars are students, counted once. The line is that count as a percent of the undergraduate body. Left axis is students. Right axis is percent.">
          <ComboChart
            labels={labels}
            bars={{ name: "Students", values: history.map((row) => row.enrollment), format: integer, axis: compactCount }}
            line={{ name: "Share of undergraduates", values: history.map((row) => row.ugShare * 100), format: (value) => `${Math.round(value)}%`, axis: (value) => `${Math.round(value)}%` }}
          />
        </Panel>
        <Panel title="Reporting partners" note="One count per rankings cycle: how many units sent undergraduate data. This is not a dollar figure and has no second axis.">
          <BarChart labels={labels} name="Partners" values={history.map((row) => row.partners)} format={integer} />
        </Panel>
        <Panel title="Reach across campus" note="Both lines use the same count axis. Navy is distinct majors. Orange is faculty departments. They are not percentages.">
          <DualLine
            labels={labels}
            a={{ name: "Majors", values: history.map((row) => row.majors), format: integer }}
            b={{ name: "Departments", values: history.map((row) => row.departments), format: integer }}
          />
        </Panel>
        <Panel title="Student venture testing" note="Each bar is the number of venture tests reported that year. Empty years were not in the file. The series begins with the 2022 rankings cycle.">
          <BarChart
            labels={labels}
            name="Venture tests"
            values={history.map((row) => row.ventureTests)}
            format={(value) => integer(value)}
          />
        </Panel>
        <Panel title="Student prize money" note="Bars are the dollars awarded that year. The line is the running total since 2017–18. Left axis is the year. Right axis is the cumulative total." wide>
          <ComboChart
            labels={labels}
            bars={{ name: "Awarded that year", values: history.map((row) => row.prize), format: money, axis: compactMoney }}
            line={{ name: "Running total", values: history.map((row) => row.prizeCumulative), format: money, axis: compactMoney }}
          />
        </Panel>
        <Panel title="Student grants and awards" note="Bars are the number of scholarships and grants. The line is cumulative dollars since 2017–18. Left axis is a count. Right axis is dollars." wide>
          <ComboChart
            labels={labels}
            bars={{ name: "Awards that year", values: history.map((row) => row.scholarships), format: integer, axis: compactCount }}
            line={{ name: "Cumulative dollars", values: history.map((row) => row.scholarshipDollarsCumulative), format: money, axis: compactMoney }}
          />
        </Panel>
      </div>

      <section className="table-wrap">
        <h2>Reporting file</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Academic year</th>
                <th>Rankings</th>
                <th>Enrollment</th>
                <th>UG share</th>
                <th>Partners</th>
                <th>Majors</th>
                <th>Departments</th>
                <th>Venture tests</th>
                <th>Prize money</th>
                <th>Prize, cumulative</th>
                <th>Awards</th>
                <th>Award dollars</th>
                <th>Award dollars, cumulative</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.academic} className={row === latest ? "current" : undefined}>
                  <td>{row.academic}</td>
                  <td>{row.cycle}</td>
                  <td>{integer(row.enrollment)}</td>
                  <td>{percent(row.ugShare)}</td>
                  <td>{integer(row.partners)}</td>
                  <td>{integer(row.majors)}</td>
                  <td>{integer(row.departments)}</td>
                  <td>{row.ventureTests == null ? "—" : integer(row.ventureTests)}</td>
                  <td>{money(row.prize)}</td>
                  <td>{money(row.prizeCumulative)}</td>
                  <td>{integer(row.scholarships)}</td>
                  <td>{money(row.scholarshipDollars)}</td>
                  <td>{money(row.scholarshipDollarsCumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, note, children, wide = false }: { title: string; note: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={wide ? "panel wide" : "panel"}>
      <h2>{title}</h2>
      <p>{note}</p>
      {children}
    </section>
  );
}

type Series = { name: string; values: Array<number | null>; format: (value: number) => string; axis?: (value: number) => string };

function compactCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `${Math.round(value)}`;
}

function compactMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function BarChart({ labels, name, values, format }: { labels: string[]; name: string; values: Array<number | null>; format: (value: number) => string }) {
  return <ComboChart labels={labels} bars={{ name, values, format }} />;
}

function ComboChart({ labels, bars, line }: { labels: string[]; bars: Series; line?: Series }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 720;
  const height = 280;
  const pad = { l: 58, r: line ? 64 : 18, t: 28, b: 36 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const barValues = bars.values.map((value) => value ?? 0);
  const barMax = Math.max(...barValues, 1);
  const lineMax = line ? Math.max(...line.values.map((value) => value ?? 0), 1) : 1;
  const slot = innerW / labels.length;
  const leftTick = bars.axis ?? ((value: number) => bars.format(Math.round(value)));
  const rightTick = line ? (line.axis ?? ((value: number) => line.format(Math.round(value)))) : undefined;

  const linePath = useMemo(() => {
    if (!line) return "";
    return line.values
      .map((value, index) => {
        if (value == null) return null;
        const x = pad.l + slot * index + slot / 2;
        const y = pad.t + innerH - (value / lineMax) * innerH;
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(" ");
  }, [line, lineMax, innerH, slot]);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={bars.name}>
        <text x={pad.l} y={16} className="axis-title">{bars.name}</text>
        {line ? <text x={width - pad.r} y={16} textAnchor="end" className="axis-title right">{line.name}</text> : null}
        {[0, 0.5, 1].map((step) => {
          const y = pad.t + innerH - step * innerH;
          return (
            <g key={step}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} className="grid" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" className="axis">{leftTick(barMax * step)}</text>
              {line && rightTick ? <text x={width - pad.r + 8} y={y + 4} className="axis right">{rightTick(lineMax * step)}</text> : null}
            </g>
          );
        })}
        {bars.values.map((value, index) => {
          const amount = value ?? 0;
          const barH = value == null ? 0 : (amount / barMax) * innerH;
          const x = pad.l + slot * index + slot * 0.22;
          const y = pad.t + innerH - barH;
          return (
            <rect
              key={labels[index]}
              x={x}
              y={y}
              width={slot * 0.56}
              height={barH}
              fill={active === index ? "#FFCB05" : index === bars.values.length - 1 ? "#E0B000" : "#00274C"}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            />
          );
        })}
        {line && linePath ? <polyline points={linePath} fill="none" stroke="#F15A24" strokeWidth="2.5" /> : null}
        {line
          ? line.values.map((value, index) => {
              if (value == null) return null;
              const x = pad.l + slot * index + slot / 2;
              const y = pad.t + innerH - (value / lineMax) * innerH;
              return <circle key={labels[index]} cx={x} cy={y} r={active === index ? 5 : 3.5} fill="#F15A24" />;
            })
          : null}
        {labels.map((label, index) => (
          <text key={label} x={pad.l + slot * index + slot / 2} y={height - 8} textAnchor="middle" className="axis">
            {label}
          </text>
        ))}
      </svg>
      <div className="legend">
        <span><i className="swatch navy" /> Left · {bars.name}</span>
        {line ? <span><i className="swatch orange" /> Right · {line.name}</span> : null}
        {active != null && bars.values[active] != null ? (
          <strong>
            {labels[active]} · {bars.format(bars.values[active] as number)}
            {line && line.values[active] != null ? ` · ${line.format(line.values[active] as number)}` : ""}
          </strong>
        ) : null}
      </div>
    </div>
  );
}

function DualLine({ labels, a, b }: { labels: string[]; a: Series; b: Series }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 720;
  const height = 280;
  const pad = { l: 52, r: 16, t: 28, b: 36 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(...a.values.map((value) => value ?? 0), ...b.values.map((value) => value ?? 0), 1);
  const slot = innerW / labels.length;
  const path = (series: Series) =>
    series.values
      .map((value, index) => {
        if (value == null) return null;
        const x = pad.l + slot * index + slot / 2;
        const y = pad.t + innerH - (value / max) * innerH;
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(" ");

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${a.name} and ${b.name}`}>
        <text x={pad.l} y={16} className="axis-title">Count</text>
        {[0, 0.5, 1].map((step) => {
          const y = pad.t + innerH - step * innerH;
          return (
            <g key={step}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} className="grid" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" className="axis">{Math.round(max * step)}</text>
            </g>
          );
        })}
        <polyline points={path(a)} fill="none" stroke="#00274C" strokeWidth="2.5" />
        <polyline points={path(b)} fill="none" stroke="#F15A24" strokeWidth="2.5" />
        {labels.map((label, index) => {
          const x = pad.l + slot * index + slot / 2;
          return (
            <g key={label} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}>
              <rect x={pad.l + slot * index} y={pad.t} width={slot} height={innerH} fill="transparent" />
              <text x={x} y={height - 8} textAnchor="middle" className="axis">{label}</text>
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span><i className="swatch navy" /> {a.name}</span>
        <span><i className="swatch orange" /> {b.name}</span>
        {active != null ? (
          <strong>
            {labels[active]} · {a.format(a.values[active] as number)} majors · {b.format(b.values[active] as number)} departments
          </strong>
        ) : null}
      </div>
    </div>
  );
}
