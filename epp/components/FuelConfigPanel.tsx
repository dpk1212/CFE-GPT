"use client";

import { FormEvent, useEffect, useState } from "react";
import { applicationsForStage } from "@/lib/fuelJudge/catalog";
import { COLUMN_LABELS, COLUMN_ORDER } from "@/lib/fuelJudge/columns";
import { DEFAULT_FUEL_CONFIG } from "@/lib/fuelJudge/defaults";
import {
  FUEL_PIPELINES,
  FUEL_STATUSES,
  type FuelApplication,
  type FuelColumnId,
  type FuelJudgeConfig,
  type FuelStageConfig,
} from "@/lib/fuelJudge/types";

export function FuelConfigPanel({ applications }: { applications: FuelApplication[] }) {
  const [config, setConfig] = useState<FuelJudgeConfig>(DEFAULT_FUEL_CONFIG);
  const [editingId, setEditingId] = useState(DEFAULT_FUEL_CONFIG.activeStageId);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch("/api/admin/fuel-config");
      const body = (await response.json().catch(() => null)) as { config?: FuelJudgeConfig; error?: string } | null;
      if (cancelled) return;
      if (!response.ok || !body?.config) {
        setError(body?.error ?? "Stage configuration could not be loaded.");
        setLoaded(true);
        return;
      }
      setConfig(body.config);
      setEditingId(body.config.activeStageId);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateStage(stageId: string, patch: Partial<FuelStageConfig>) {
    setConfig((current) => ({
      ...current,
      stages: current.stages.map((stage) => (stage.id === stageId ? { ...stage, ...patch } : stage)),
    }));
  }

  function toggleListValue<T extends string>(values: T[], value: T, checked: boolean) {
    if (checked) return values.includes(value) ? values : [...values, value];
    return values.filter((item) => item !== value);
  }

  function toggleColumns(stageId: string, column: FuelColumnId, checked: boolean) {
    const stage = config.stages.find((item) => item.id === stageId);
    if (!stage) return;
    const next = toggleListValue(stage.columns, column, checked);
    updateStage(stageId, { columns: COLUMN_ORDER.filter((item) => next.includes(item)) });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/admin/fuel-config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    });
    const body = (await response.json().catch(() => null)) as { config?: FuelJudgeConfig; error?: string } | null;
    setBusy(false);
    if (!response.ok || !body?.config) {
      setError(body?.error ?? "The configuration was not saved.");
      return;
    }
    setConfig(body.config);
    setMessage("Judge dashboard configuration saved.");
  }

  if (!loaded) return <p className="console-status">Loading judge desk setup.</p>;

  const stage = config.stages.find((item) => item.id === editingId) ?? config.stages[0];
  const active = config.stages.find((item) => item.id === config.activeStageId) ?? config.stages[0];
  const visibleCount = applicationsForStage(applications, active).length;

  return (
    <form className="desk-setup" onSubmit={save}>
      <p className="console-lead">Every approved judge sees the same queue. There is no per-judge assignment.</p>
      <div className="stage-switch">
        {config.stages.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === stage?.id ? "on" : undefined}
            aria-pressed={item.id === stage?.id}
            onClick={() => setEditingId(item.id)}
          >
            <strong>{item.id === "written" ? "Stage 1" : "Stage 2"}</strong>
            <span>{item.name}</span>
            {item.id === config.activeStageId ? <em>Judges see this</em> : null}
          </button>
        ))}
      </div>
      {stage ? (
        <div className="setup-grid">
          <section className="setup-card">
            <h2>Stage</h2>
            <label>
              Title shown to judges
              <input value={stage.name} onChange={(event) => updateStage(stage.id, { name: event.target.value })} required />
            </label>
            <label>
              Form
              <select
                value={stage.form}
                onChange={(event) => updateStage(stage.id, { form: event.target.value === "pitch" ? "pitch" : "written" })}
              >
                <option value="written">Written application review</option>
                <option value="pitch">Pitch and funding feedback</option>
              </select>
            </label>
            {stage.id === config.activeStageId ? (
              <p className="field-help">This is the stage on the judge desk.</p>
            ) : (
              <button className="btn-line" type="button" onClick={() => setConfig({ ...config, activeStageId: stage.id })}>
                Show this stage to judges
              </button>
            )}
          </section>
          <section className="setup-card">
            <h2>Queue statuses</h2>
            <div className="choice-chips">
              {FUEL_STATUSES.map((status) => {
                const on = stage.statuses.includes(status);
                return (
                  <button key={status} type="button" aria-pressed={on} onClick={() => updateStage(stage.id, { statuses: toggleListValue(stage.statuses, status, !on) })}>
                    {status}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="setup-card">
            <h2>Pipelines</h2>
            <div className="choice-chips">
              {FUEL_PIPELINES.map((pipeline) => {
                const on = stage.pipelines.includes(pipeline);
                return (
                  <button key={pipeline} type="button" aria-pressed={on} onClick={() => updateStage(stage.id, { pipelines: toggleListValue(stage.pipelines, pipeline, !on) })}>
                    {pipeline}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="setup-card">
            <h2>Visible fields</h2>
            <div className="choice-chips">
              {COLUMN_ORDER.map((column) => {
                const on = stage.columns.includes(column);
                return (
                  <button key={column} type="button" aria-pressed={on} onClick={() => toggleColumns(stage.id, column, !on)}>
                    {COLUMN_LABELS[column]}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
      <div className="console-save">
        <p>With this setup, judges see {visibleCount} application{visibleCount === 1 ? "" : "s"} in {active?.name}.</p>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Save desk setup"}</button>
      </div>
      {error ? <p className="form-note" role="alert">{error}</p> : null}
      {message ? <p className="form-note" role="status">{message}</p> : null}
    </form>
  );
}
