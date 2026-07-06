import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState, type CSSProperties } from "react";
import { db } from "../db/schema";
import { downloadJSON, readJSONFile } from "../components/fileTransfer";
import { evaluateBlockTransition } from "../engine/blockTransition";
import { computeNextUp } from "../engine/queues";
import { exportFullState, importFullState, importSessionPackage } from "../db/transferIO";
import { FULL_STATE_CONFIRMATION_PHRASE, type FullStateExport } from "../transfer/fullState";
import type { SessionPackage } from "../transfer/sessionPackage";
import { C, sans } from "../theme/tokens";
import type { DeviceRole } from "../db/types";

export default function SettingsScreen() {
  const programme = useLiveQuery(() => db.programme.toCollection().first(), []);
  const block = useLiveQuery(() => (programme ? db.block.get(programme.currentBlockId) : undefined), [programme?.currentBlockId]);
  const blockTemplates =
    useLiveQuery(() => (block ? db.sessionTemplate.where("blockId").equals(block.id).toArray() : []), [block?.id]) ?? [];
  const sessionLogs = useLiveQuery(() => db.sessionLog.toArray(), []) ?? [];

  return (
    <div style={{ fontFamily: sans, padding: 20, paddingBottom: 90 }}>
      <h1 style={{ color: C.slate, fontSize: 20, marginBottom: 16 }}>Settings / Data</h1>

      {programme && block && blockTemplates.length > 0 && (
        <BlockStatusSection
          deviceRole={programme.deviceRole}
          onToggleRole={async () => {
            const next: DeviceRole = programme.deviceRole === "master" ? "satellite" : "master";
            await db.programme.update(programme.id, { deviceRole: next });
          }}
          statusText={(() => {
            const nextUp = computeNextUp(blockTemplates, sessionLogs, programme.currentBlockStartDate, new Date().toISOString());
            const status = evaluateBlockTransition(nextUp, block.transitionRules);
            const parts = [
              `Block ${block.sequence}: ${block.name}`,
              `${nextUp.totalSessionsCompleted}/${block.transitionRules.minSessions} sessions, week ${nextUp.weeksElapsed}`,
              status.shouldTransition ? `Ready to transition (${status.reason}).` : "Not yet due to transition."
            ];
            if (status.gymSessionsBehindPace > 0) parts.push(`${status.gymSessionsBehindPace} gym sessions behind pace.`);
            if (status.homeSessionsBehindPace > 0) parts.push(`${status.homeSessionsBehindPace} home sessions behind pace.`);
            return parts.join(" ");
          })()}
        />
      )}

      <SessionPackageSection />
      <FullStateSection />
      <CsvExportStub />

      <Section title="Units">
        <div style={{ fontSize: 13, color: C.textMuted }}>Load: kg &middot; Swing speed: mph &middot; ROM reach: cm</div>
      </Section>

      <Section title="Safety">
        <div style={{ fontSize: 13, color: C.text }}>
          Pain (as distinct from effort) at any point means stop the movement and seek professional
          assessment. This programme carries no rehabilitation logic.
        </div>
      </Section>
    </div>
  );
}

function BlockStatusSection({
  statusText,
  deviceRole,
  onToggleRole
}: {
  statusText: string;
  deviceRole: DeviceRole;
  onToggleRole: () => void;
}) {
  return (
    <Section title="Block transition status">
      <div style={{ fontSize: 13, color: C.text, marginBottom: 12 }}>{statusText}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: C.textMuted }}>Device role:</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.slate, textTransform: "capitalize" }}>{deviceRole}</span>
        <button onClick={onToggleRole} style={smallBtn}>
          Switch to {deviceRole === "master" ? "satellite" : "master"}
        </button>
      </div>
    </Section>
  );
}

function SessionPackageSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const pkg = await readJSONFile<SessionPackage>(file);
      const result = await importSessionPackage(pkg);
      setNotice(
        result.alreadyImported
          ? "This session package was already imported — no changes made."
          : `Imported: ${result.setLogsAdded} set logs, ${result.metricLogsAdded} metric logs.`
      );
    } catch (err) {
      setNotice(`Import failed: ${(err as Error).message}`);
    }
  }

  return (
    <Section title="Session-package import">
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
        Import a session package shared from the Pixel. Append-merges by id — never overwrites
        anything already on this device — and recomputes progression from the full history.
      </div>
      {notice && <div style={{ fontSize: 13, color: C.ok, marginBottom: 10 }}>{notice}</div>}
      <input ref={inputRef} type="file" accept="application/json" onChange={handleFile} style={{ fontSize: 13 }} />
    </Section>
  );
}

function FullStateSection() {
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const data = await exportFullState();
    downloadJSON(`swing-gains-full-state-${new Date().toISOString().slice(0, 10)}.json`, data);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await readJSONFile<FullStateExport>(file);
      const result = await importFullState(data, confirmation);
      setNotice(result.allowed ? "Full-state import complete. This device's data has been replaced." : (result.reason ?? "Import blocked."));
      if (result.allowed) setConfirmation("");
    } catch (err) {
      setNotice(`Import failed: ${(err as Error).message}`);
    }
  }

  return (
    <Section title="Full-state backup">
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
        Full backup/restore for this device's programme and logs. Importing onto a device that
        already has data replaces it entirely — type{" "}
        <strong style={{ color: C.copper }}>{FULL_STATE_CONFIRMATION_PHRASE}</strong> below to confirm.
      </div>
      <button onClick={handleExport} style={{ ...smallBtn, marginBottom: 12 }}>
        Export full backup
      </button>
      {notice && <div style={{ fontSize: 13, color: C.ok, marginBottom: 10 }}>{notice}</div>}
      <input
        placeholder={FULL_STATE_CONFIRMATION_PHRASE}
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        style={{ ...inputStyle, marginBottom: 8, width: "100%", boxSizing: "border-box" }}
      />
      <input ref={inputRef} type="file" accept="application/json" onChange={handleFile} style={{ fontSize: 13 }} />
    </Section>
  );
}

function CsvExportStub() {
  return (
    <Section title="CSV export">
      <button disabled title="CSV export lands in P3" style={{ ...smallBtn, background: C.warmGrey, color: C.textMuted, cursor: "not-allowed" }}>
        Export CSV (P3)
      </button>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  fontSize: 14
};

const smallBtn: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: C.slate,
  color: C.white,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer"
};
