import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, type CSSProperties } from "react";
import { db } from "../db/schema";
import { advanceToNextBlock, checkBlockTransitionStatus } from "../db/blockTransitionIO";
import { exportSessionPackage, recomputeAndPersistProgressionStates } from "../db/transferIO";
import { shareOrDownloadJSON } from "../components/fileTransfer";
import RestTimer from "../components/RestTimer";
import MetricsScreen from "./MetricsScreen";
import { C, sans } from "../theme/tokens";
import type { ExercisePrescription, LadderRung, ProgressionState, SetLog, VariationLadder, Venue } from "../db/types";

// Appends a YouTube start-time param when the rung has a specific in-video timestamp.
function withTimestamp(url: string, timestampSec?: number): string {
  if (timestampSec == null) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${timestampSec}s`;
}

interface SessionRunnerScreenProps {
  templateId: string;
  onDone: () => void;
}

// Rest duration heuristic from library section 1 conventions: main lifts (the first two
// slots in every template, A/B) rest 2-3 min; accessories rest 60-90 s. The library gives
// these as ranges, not exact acceptance-tested numbers, so a fixed representative value
// per band is used here rather than inventing per-exercise precision.
function restSecondsFor(order: number): number {
  return order <= 2 ? 150 : 75;
}

export default function SessionRunnerScreen({ templateId, onDone }: SessionRunnerScreenProps) {
  const template = useLiveQuery(() => db.sessionTemplate.get(templateId), [templateId]);
  const exercises = useLiveQuery(() => db.exercise.toArray(), []) ?? [];
  const ladders = useLiveQuery(() => db.variationLadder.toArray(), []) ?? [];
  const progressionStates = useLiveQuery(() => db.progressionState.toArray(), []) ?? [];

  const [sessionLogId, setSessionLogId] = useState<string | null>(null);
  const [startedAt] = useState(() => new Date());
  const [complete, setComplete] = useState(false);
  const [transitionDue, setTransitionDue] = useState(false);
  const [showRomPrompt, setShowRomPrompt] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = crypto.randomUUID();
      await db.sessionLog.add({
        id,
        templateId,
        date: new Date().toISOString(),
        durationMin: null,
        completed: false,
        notes: "",
        originDevice: "ipad"
      });
      if (!cancelled) setSessionLogId(id);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const setLogs =
    useLiveQuery(
      () => (sessionLogId ? db.setLog.where("sessionLogId").equals(sessionLogId).toArray() : []),
      [sessionLogId]
    ) ?? [];

  if (!template || !sessionLogId) {
    return <div style={{ padding: 24, fontFamily: sans, color: C.textMuted }}>Loading session...</div>;
  }

  async function finishSession() {
    if (!sessionLogId) return;
    const durationMin = Math.round((Date.now() - startedAt.getTime()) / 60000);
    await db.sessionLog.update(sessionLogId, { completed: true, durationMin });
    await recomputeAndPersistProgressionStates();
    const status = await checkBlockTransitionStatus();
    setTransitionDue(status?.shouldTransition ?? false);
    setComplete(true);
  }

  async function exportPackage() {
    if (!sessionLogId) return;
    const pkg = await exportSessionPackage(sessionLogId);
    await shareOrDownloadJSON(`swing-gains-session-${sessionLogId}.json`, pkg);
    setExportNotice("Session package ready — shared or downloaded.");
  }

  async function continueAfterRom() {
    await advanceToNextBlock();
    setShowRomPrompt(false);
    onDone();
  }

  if (complete && showRomPrompt) {
    return <MetricsScreen romPromptOnly onDone={continueAfterRom} />;
  }

  if (complete) {
    return (
      <div style={{ padding: 24, fontFamily: sans }}>
        <h1 style={{ color: C.slate }}>Session complete</h1>
        <p style={{ color: C.textMuted }}>
          {setLogs.length} sets logged across {template.exercisePrescriptions.length} exercises.
        </p>
        {transitionDue && (
          <div style={{ background: C.warmGrey, borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 12 }}>
            This block is due to transition. Run the ROM self-tests to continue.
          </div>
        )}
        {exportNotice && <div style={{ fontSize: 13, color: C.ok, marginBottom: 12 }}>{exportNotice}</div>}
        <button onClick={exportPackage} style={{ ...secondaryBtn, marginBottom: 12 }}>
          Export session package
        </button>
        {transitionDue ? (
          <button onClick={() => setShowRomPrompt(true)} style={{ ...primaryBtn, background: C.copper }}>
            Run ROM tests &amp; start next block
          </button>
        ) : (
          <button onClick={onDone} style={primaryBtn}>
            Back to Next Up
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: sans, padding: 20, paddingBottom: 100 }}>
      <button onClick={onDone} style={linkBtn}>
        Cancel session
      </button>
      <h1 style={{ color: C.slate, fontSize: 20, marginBottom: 16 }}>{template.name}</h1>

      {template.notes && (
        <div
          style={{
            background: C.warmGrey,
            borderRadius: 10,
            padding: 12,
            fontSize: 13,
            color: C.text,
            marginBottom: 16
          }}
        >
          {template.notes}
        </div>
      )}

      {[...template.exercisePrescriptions]
        .sort((a, b) => a.order - b.order)
        .map((prescription) => {
          const exercise = exercises.find((e) => e.id === prescription.exerciseId);
          if (!exercise) return null;
          const ladder = exercise.ladderId ? ladders.find((l) => l.id === exercise.ladderId) : undefined;
          const progression = progressionStates.find((p) => p.exerciseId === exercise.id);
          const rung: LadderRung | undefined =
            ladder && progression?.currentLadderRung != null ? ladder.rungs[progression.currentLadderRung] : undefined;
          // Ladder exercises show the current rung's video (superseding the anchor
          // exercise's own null videoUrl); non-ladder exercises use their own videoUrl.
          const videoUrl = rung ? rung.videoUrl : exercise.videoUrl;
          const exerciseSetLogs = setLogs
            .filter((s) => s.exerciseId === exercise.id)
            .sort((a, b) => a.setNo - b.setNo);

          return (
            <ExerciseCard
              key={`${prescription.exerciseId}-${prescription.order}`}
              sessionLogId={sessionLogId}
              prescription={prescription}
              exerciseName={exercise.name}
              rungName={rung?.name}
              venue={exercise.venue}
              videoUrl={videoUrl}
              videoTimestampSec={rung?.timestampSec}
              existingSetLogs={exerciseSetLogs}
              restSeconds={restSecondsFor(prescription.order)}
              ladder={ladder}
              progression={progression}
            />
          );
        })}

      <button onClick={finishSession} style={{ ...primaryBtn, background: C.copper, marginTop: 8 }}>
        Finish session
      </button>
    </div>
  );
}

interface ExerciseCardProps {
  sessionLogId: string;
  prescription: ExercisePrescription;
  exerciseName: string;
  rungName?: string;
  venue: Venue;
  videoUrl: string | null;
  videoTimestampSec?: number;
  existingSetLogs: SetLog[];
  restSeconds: number;
  ladder?: VariationLadder;
  progression?: ProgressionState;
}

function ExerciseCard({
  sessionLogId,
  prescription,
  exerciseName,
  rungName,
  venue,
  videoUrl,
  videoTimestampSec,
  existingSetLogs,
  restSeconds,
  ladder,
  progression
}: ExerciseCardProps) {
  const [reps, setReps] = useState("");
  const [loadKg, setLoadKg] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [ladderAdvanceConfirmed, setLadderAdvanceConfirmed] = useState(false);

  async function logSet() {
    const setNo = existingSetLogs.length + 1;
    await db.setLog.add({
      id: crypto.randomUUID(),
      sessionLogId,
      exerciseId: prescription.exerciseId,
      setNo,
      reps: reps ? Number(reps) : null,
      loadKg: venue === "gym" && loadKg ? Number(loadKg) : null,
      rpe
    });
    setShowTimer(true);
  }

  // Ladder rung advance offer (spec §3.4 LD-1) — never forced; the streak must already be
  // >=2 (two consecutive prior hits) before this is even shown, and confirming attaches the
  // flag to the last logged set this session so it feeds the recompute-from-logs replay.
  const rungOfferAvailable =
    !!ladder &&
    !!progression &&
    progression.streakCount >= 2 &&
    progression.currentLadderRung != null &&
    progression.currentLadderRung < ladder.rungs.length - 1;
  const nextRungName = ladder && progression?.currentLadderRung != null ? ladder.rungs[progression.currentLadderRung + 1]?.name : undefined;

  async function confirmLadderAdvance() {
    const last = [...existingSetLogs].sort((a, b) => b.setNo - a.setNo)[0];
    if (!last) return;
    await db.setLog.update(last.id, { ladderAdvanceConfirmed: true });
    setLadderAdvanceConfirmed(true);
  }

  const rpeSuffix = prescription.rpeDisplay
    ? ` @ RPE ${prescription.rpeDisplay}`
    : prescription.targetRPE
      ? ` @ RPE ${prescription.targetRPE}`
      : "";

  return (
    <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{exerciseName}</div>
          {rungName && <div style={{ fontSize: 12, color: C.copper, fontWeight: 700 }}>{rungName}</div>}
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            {prescription.sets} x {prescription.repsDisplay}
            {rpeSuffix}
          </div>
          {venue === "gym" && progression?.currentPrescribedLoadKg != null && (
            <div style={{ fontSize: 12, color: C.slate, fontWeight: 700 }}>Prescribed: {progression.currentPrescribedLoadKg} kg</div>
          )}
          {prescription.tempo && <div style={{ fontSize: 12, color: C.textMuted }}>Tempo {prescription.tempo}</div>}
          {prescription.note && (
            <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>{prescription.note}</div>
          )}
        </div>
        <a
          href={videoUrl ? withTimestamp(videoUrl, videoTimestampSec) : undefined}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            if (!videoUrl) e.preventDefault();
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: videoUrl ? C.slate : C.line,
            color: C.white,
            textDecoration: "none",
            fontSize: 14,
            flexShrink: 0
          }}
        >
          {"▶"}
        </a>
      </div>

      {existingSetLogs.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 13, color: C.text }}>
          {existingSetLogs.map((s) => (
            <div key={s.id}>
              Set {s.setNo}: {s.reps ?? "-"} reps{s.loadKg ? ` @ ${s.loadKg}kg` : ""}
              {s.rpe ? `, RPE ${s.rpe}` : ""}
            </div>
          ))}
        </div>
      )}

      {existingSetLogs.length > 0 && rungOfferAvailable && (
        <div style={{ marginTop: 10, background: C.warmGrey, borderRadius: 8, padding: 10 }}>
          {ladderAdvanceConfirmed ? (
            <div style={{ fontSize: 12, color: C.ok }}>Advance confirmed — takes effect next session.</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: C.text, marginBottom: 6 }}>
                Two hits in a row — ready for {nextRungName ?? "the next rung"}?
              </div>
              <button onClick={confirmLadderAdvance} style={{ ...smallBtn, marginRight: 8 }}>
                Advance next session
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          style={inputStyle}
        />
        {venue === "gym" && (
          <input
            type="number"
            inputMode="decimal"
            placeholder="Load kg"
            value={loadKg}
            onChange={(e) => setLoadKg(e.target.value)}
            style={inputStyle}
          />
        )}
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            onClick={() => setRpe(v)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1px solid ${C.line}`,
              background: rpe === v ? C.copper : C.white,
              color: rpe === v ? C.white : C.text,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            {v}
          </button>
        ))}
      </div>

      <button onClick={logSet} style={{ ...primaryBtn, background: C.slate, marginTop: 10, padding: "10px 0" }}>
        Log set
      </button>

      {showTimer && (
        <div style={{ marginTop: 10 }}>
          <RestTimer defaultSeconds={restSeconds} label="Rest" />
        </div>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  fontSize: 14
};

const primaryBtn: CSSProperties = {
  width: "100%",
  padding: "14px 0",
  background: C.slate,
  color: C.white,
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer"
};

const secondaryBtn: CSSProperties = {
  width: "100%",
  padding: "14px 0",
  background: C.white,
  color: C.slate,
  border: `1px solid ${C.slate}`,
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer"
};

const smallBtn: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: C.slate,
  color: C.white,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer"
};

const linkBtn: CSSProperties = {
  background: "none",
  border: "none",
  color: C.textMuted,
  marginBottom: 8,
  cursor: "pointer",
  padding: 0,
  fontSize: 14
};
