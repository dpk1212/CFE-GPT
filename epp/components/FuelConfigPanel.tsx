"use client";

import { FormEvent, useEffect, useState } from "react";
import { COLUMN_LABELS, COLUMN_ORDER } from "@/lib/fuelJudge/columns";
import { DEFAULT_FUEL_CONFIG } from "@/lib/fuelJudge/defaults";
import {
  FUEL_PIPELINES,
  FUEL_STATUSES,
  type FuelColumnId,
  type FuelJudgeConfig,
  type FuelStageConfig,
} from "@/lib/fuelJudge/types";

export function FuelConfigPanel() {
  const [config, setConfig] = useState<FuelJudgeConfig>(DEFAULT_FUEL_CONFIG);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch("/api/admin/fuel-config");
      const body = (await response.json().catch(() => null)) as
        | { config?: FuelJudgeConfig; error?: string }
        | null;
      if (cancelled) return;
      if (!response.ok || !body?.config) {
        setError(body?.error ?? "Stage configuration could not be loaded.");
        setLoaded(true);
        return;
      }
      setConfig(body.config);
      setLoaded(true);
    })();
    try {
      const stored = JSON.parse(localStorage.getItem("epp-admin-stage-open") ?? "{}") as unknown;
      if (stored && typeof stored === "object") {
        setOpenStages(stored as Record<string, boolean>);
      }
    } catch {
      setOpenStages({});
    }
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleStage(stageId: string) {
    setOpenStages((current) => {
      const next = { ...current, [stageId]: !current[stageId] };
      localStorage.setItem("epp-admin-stage-open", JSON.stringify(next));
      return next;
    });
  }

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
    const body = (await response.json().catch(() => null)) as
      | { config?: FuelJudgeConfig; error?: string }
      | null;
    setBusy(false);
    if (!response.ok || !body?.config) {
      setError(body?.error ?? "The configuration was not saved.");
      return;
    }
    setConfig(body.config);
    setMessage("Judge dashboard configuration saved.");
  }

  if (!loaded) {
    return <p className="quiet">Loading judge dashboard configuration…</p>;
  }

  return (
    <form className="fuel-config" onSubmit={save}>
      <div className="fuel-config-head">
        <h2>Fuel desk</h2>
        <p>Every approved judge sees the same queue. There is no per-judge assignment. Choose the active stage, then set its title, statuses, pipelines, columns, and form.</p>
      </div>

      <fieldset className="choice-set">
        <legend>Active stage</legend>
        <div className="stage-switch">
          {config.stages.map((stage) => (
            <label key={stage.id} className={config.activeStageId === stage.id ? "on" : undefined}>
              <input
                type="radio"
                name="activeStage"
                checked={config.activeStageId === stage.id}
                onChange={() => setConfig({ ...config, activeStageId: stage.id })}
              />
              <strong>{stage.name}</strong>
              <span>{stage.form === "written" ? "Written review form" : "Pitch funding form"}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {config.stages.map((stage) => {
        const open = Boolean(openStages[stage.id]);
        return (
        <section key={stage.id} className="fuel-stage-card">
          <button
            className="stage-toggle"
            type="button"
            aria-expanded={open}
            aria-controls={`stage-panel-${stage.id}`}
            onClick={() => toggleStage(stage.id)}
          >
            <span>{stage.id === "written" ? "Stage 1" : "Stage 2"}</span>
            <strong>{stage.name}</strong>
            <em>{open ? "Hide" : "Edit"}</em>
          </button>
          {open ? <div id={`stage-panel-${stage.id}`} className="stage-panel">
          <label>
            Title shown to judges
            <input
              value={stage.name}
              onChange={(event) => updateStage(stage.id, { name: event.target.value })}
              required
            />
          </label>
          <label>
            Form
            <select
              value={stage.form}
              onChange={(event) =>
                updateStage(stage.id, { form: event.target.value === "pitch" ? "pitch" : "written" })
              }
            >
              <option value="written">Written application review</option>
              <option value="pitch">Pitch and funding feedback</option>
            </select>
          </label>

          <fieldset className="check-grid">
            <legend>Statuses on this desk</legend>
            {FUEL_STATUSES.map((status) => (
              <label key={status}>
                <input
                  type="checkbox"
                  checked={stage.statuses.includes(status)}
                  onChange={(event) =>
                    updateStage(stage.id, {
                      statuses: toggleListValue(stage.statuses, status, event.target.checked),
                    })
                  }
                />
                {status}
              </label>
            ))}
          </fieldset>

          <fieldset className="check-grid">
            <legend>Pipelines</legend>
            {FUEL_PIPELINES.map((pipeline) => (
              <label key={pipeline}>
                <input
                  type="checkbox"
                  checked={stage.pipelines.includes(pipeline)}
                  onChange={(event) =>
                    updateStage(stage.id, {
                      pipelines: toggleListValue(stage.pipelines, pipeline, event.target.checked),
                    })
                  }
                />
                {pipeline}
              </label>
            ))}
          </fieldset>

          <fieldset className="check-grid">
            <legend>Visible columns</legend>
            {COLUMN_ORDER.map((column) => (
              <label key={column}>
                <input
                  type="checkbox"
                  checked={stage.columns.includes(column)}
                  onChange={(event) => toggleColumns(stage.id, column, event.target.checked)}
                />
                {COLUMN_LABELS[column]}
              </label>
            ))}
          </fieldset>
          </div> : null}
        </section>
        );
      })}

      <button className="btn-maize-border" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save judge dashboard"}
      </button>
      {error ? (
        <p className="form-note" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="form-note success" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
