"use client";

import { useRef, useState } from "react";
import { FUEL_STATUSES, type FuelApplication } from "@/lib/fuelJudge/types";

export function MassStageMove({
  rows,
  selectedIds,
  writesEnabled,
  busy,
  onChangeSelection,
  onApply,
}: {
  rows: FuelApplication[];
  selectedIds: string[];
  writesEnabled: boolean;
  busy: boolean;
  onChangeSelection: (ids: string[]) => void;
  onApply: (stage: string, ids: string[]) => Promise<void> | void;
}) {
  const [stage, setStage] = useState<string>(FUEL_STATUSES[0]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = rows.filter((row) => selectedIds.includes(row.id));
  const allShown = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  const moving = selected.filter((row) => row.stage !== stage);

  function toggleShown() {
    if (allShown) {
      const shown = new Set(rows.map((row) => row.id));
      onChangeSelection(selectedIds.filter((id) => !shown.has(id)));
      return;
    }
    onChangeSelection([...new Set([...selectedIds, ...rows.map((row) => row.id)])]);
  }

  return (
    <div className={`mass-stage${writesEnabled ? "" : " is-disabled"}`}>
      <label className="mass-check">
        <input
          type="checkbox"
          checked={allShown}
          disabled={!writesEnabled || rows.length === 0 || busy}
          onChange={toggleShown}
        />
        Select all shown
      </label>
      <label>
        Move to stage
        <select value={stage} disabled={!writesEnabled || busy} onChange={(event) => setStage(event.target.value)}>
          {FUEL_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <button
        className="btn"
        type="button"
        disabled={!writesEnabled || busy || moving.length === 0}
        onClick={() => dialogRef.current?.showModal()}
      >
        {busy ? "Moving…" : `Review move (${moving.length})`}
      </button>
      {writesEnabled ? (
        <p className="quiet">{selected.length} selected.</p>
      ) : (
        <p className="form-note">Mass stage updates stay off until FUEL_ADMIN_WRITES is on.</p>
      )}

      <dialog ref={dialogRef} className="confirm-dialog">
        <h3>Confirm stage updates</h3>
        <p className="quiet">
          {moving.length} application{moving.length === 1 ? "" : "s"} will change stage.
          {selected.length - moving.length > 0
            ? ` ${selected.length - moving.length} already at ${stage} will be left as they are.`
            : ""}
        </p>
        <div className="mass-confirm-list">
          <table className="desk-table">
            <thead>
              <tr>
                <th scope="col">Application</th>
                <th scope="col">Current stage</th>
                <th scope="col">New stage</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.projectName}</th>
                  <td>{row.stage}</td>
                  <td>{stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="judge-form-actions">
          <button className="btn-line" type="button" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button
            className="btn"
            type="button"
            disabled={busy || moving.length === 0}
            onClick={() => {
              dialogRef.current?.close();
              void onApply(stage, moving.map((row) => row.id));
            }}
          >
            Confirm
          </button>
        </div>
        <p className="quiet">This writes Stage on each listed deal that is changing. Nothing else on the deal is edited.</p>
      </dialog>
    </div>
  );
}
