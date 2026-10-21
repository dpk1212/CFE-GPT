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
    { label: "Enrollment", value: integer(latest.enrollment), note: `${percent(latest.ugShare)} of undergraduates`, delta: enrollmentDelta.label },
    { label: "Reporting partners", value: integer(latest.partners), note: `From ${history[0].partners} in ${history[0].academic}`, delta: partnerDelta.label },
    { label: "Majors represented", value: integer(latest.majors), note: `${integer(latest.departments)} faculty departments`, delta: delta(latest.majors, prior.majors).label },
    { label: "Venture tests", value: integer(latest.ventureTests ?? 0), note: "Student venture testing", delta: ventureDelta.label },
    { label: "Prize money, cumulative", value: money(latest.prizeCumulative), note: `${money(latest.prize)} this year`, delta: "" },
    { label: "Grants and awards, cumulative", value: money(latest.scholarshipDollarsCumulative), note: `${integer(latest.scholarships)} awards · ${money(latest.scholarshipDollars)} this year`, delta: awardDelta.label },
  ];

  return (
    <div className="dash">
      <div className="dash-toolbar">
        <p>2025–26 reporting year, prepared for the 2027 rankings cycle. Change versus 2024–25 is shown on each card.</p>
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
              {item.note}
              {item.delta ? <span className={item.delta.startsWith("-") ? "down" : "up"}>{item.delta}</span> : null}
            </p>
          </article>
        ))}
      </div>

      <div className="chart-grid">
        <Panel title="Enrollment" note="Headcount, deduped, and share of the undergraduate student body.">
          <ComboChart
            labels={labels}
            bars={{ name: "Enrollment", values: history.map((row) => row.enrollment), format: integer }}
            line={{ name: "Share of undergraduates", values: history.map((row) => row.ugShare * 100), format: (value) => `${Math.round(value)}%` }}
          />
        </Panel>
        <Panel title="Reporting partners" note="Number of partners included in that rankings file.">
          <BarChart labels={labels} name="Partners" values={history.map((row) => row.partners)} format={integer} />
        </Panel>
        <Panel title="Reach across campus" note="Distinct majors and faculty departments in the reporting year.">
          <DualLine
            labels={labels}
            a={{ name: "Majors", values: history.map((row) => row.majors), format: integer }}
            b={{ name: "Departments", values: history.map((row) => row.departments), format: integer }}
          />
        </Panel>
        <Panel title="Student venture testing" note="Series begins with the 2022 rankings file. Earlier years were not reported in this extract.">
          <BarChart
            labels={labels}
            name="Venture tests"
            values={history.map((row) => row.ventureTests)}
            format={(value) => integer(value)}
          />
        </Panel>
        <Panel title="Student prize money" note="Annual awards as bars. The line is the running total from 2017–18." wide>
          <ComboChart
            labels={labels}
            bars={{ name: "Awarded that year", values: history.map((row) => row.prize), format: money }}
            line={{ name: "Cumulative", values: history.map((row) => row.prizeCumulative), format: money }}
          />
        </Panel>
        <Panel title="Student grants and awards" note="Count of scholarships and grants, with cumulative dollars since 2017–18." wide>
          <ComboChart
            labels={labels}
            bars={{ name: "Awards", values: history.map((row) => row.scholarships), format: integer }}
            line={{ name: "Cumulative dollars", values: history.map((row) => row.scholarshipDollarsCumulative), format: money }}
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

type Series = { name: string; values: Array<number | null>; format: (value: number) => string };

function BarChart({ labels, name, values, format }: { labels: string[]; name: string; values: Array<number | null>; format: (value: number) => string }) {
  return <ComboChart labels={labels} bars={{ name, values, format }} />;
}

function ComboChart({ labels, bars, line }: { labels: string[]; bars: Series; line?: Series }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 720;
  const height = 250;
  const pad = { l: 44, r: line ? 52 : 16, t: 16, b: 32 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const barValues = bars.values.map((value) => value ?? 0);
  const barMax = Math.max(...barValues, 1);
  const lineMax = line ? Math.max(...line.values.map((value) => value ?? 0), 1) : 1;
  const slot = innerW / labels.length;

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
        {[0, 0.5, 1].map((step) => {
          const y = pad.t + innerH - step * innerH;
          return <line key={step} x1={pad.l} x2={width - pad.r} y1={y} y2={y} className="grid" />;
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
              fill={active === index ? "#FFCB05" : "#00274C"}
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
        <span><i className="swatch navy" /> {bars.name}</span>
        {line ? <span><i className="swatch orange" /> {line.name}</span> : null}
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
  const height = 250;
  const pad = { l: 36, r: 12, t: 16, b: 32 };
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
        {[0, 0.5, 1].map((step) => {
          const y = pad.t + innerH - step * innerH;
          return <line key={step} x1={pad.l} x2={width - pad.r} y1={y} y2={y} className="grid" />;
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
