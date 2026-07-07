import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, type CSSProperties } from "react";
import { db } from "../db/schema";
import { C, sans } from "../theme/tokens";

interface ExerciseDetailScreenProps {
  exerciseId: string;
  onBack: () => void;
}

// Spec §6 screen 6: cues, ladder position, video URL (editable). For a ladder-anchored
// exercise, the exercise's OWN videoUrl is always null (P1.1) — what actually plays in the
// Session runner is the CURRENT rung's video (VariationLadder.rungs[n].videoUrl), so editing
// is scoped to that rung rather than a field the session runner would never read.
export default function ExerciseDetailScreen({ exerciseId, onBack }: ExerciseDetailScreenProps) {
  const exercise = useLiveQuery(() => db.exercise.get(exerciseId), [exerciseId]);
  const ladder = useLiveQuery(
    () => (exercise?.ladderId ? db.variationLadder.get(exercise.ladderId) : undefined),
    [exercise?.ladderId]
  );
  const progression = useLiveQuery(() => db.progressionState.get(exerciseId), [exerciseId]);

  const currentRungIndex = progression?.currentLadderRung ?? 0;
  const currentRung = ladder?.rungs[currentRungIndex];
  const editableVideoUrl = ladder ? (currentRung?.videoUrl ?? null) : (exercise?.videoUrl ?? null);

  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setVideoUrlInput(editableVideoUrl ?? "");
  }, [editableVideoUrl]);

  if (!exercise) {
    return <div style={{ padding: 24, fontFamily: sans, color: C.textMuted }}>Loading exercise...</div>;
  }

  async function saveVideoUrl() {
    const value = videoUrlInput.trim() || null;
    if (ladder && currentRung) {
      const updatedRungs = ladder.rungs.map((r, i) => (i === currentRungIndex ? { ...r, videoUrl: value } : r));
      await db.variationLadder.update(ladder.id, { rungs: updatedRungs });
    } else {
      await db.exercise.update(exerciseId, { videoUrl: value });
    }
    setNotice("Video URL saved.");
  }

  return (
    <div style={{ fontFamily: sans, padding: 20, paddingBottom: 90 }}>
      <button onClick={onBack} style={linkBtn}>
        &larr; Back
      </button>
      <h1 style={{ color: C.slate, fontSize: 20, marginBottom: 4 }}>{exercise.name}</h1>
      <div style={{ fontSize: 12, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>
        {exercise.pattern} &middot; {exercise.venue}
      </div>

      <Section title="Description">
        <div style={{ fontSize: 13, color: C.text }}>{exercise.description}</div>
      </Section>

      {exercise.cues && (
        <Section title="Cues">
          <div style={{ fontSize: 13, color: C.text }}>{exercise.cues}</div>
        </Section>
      )}

      {exercise.substitution && (
        <Section title="Busy-gym substitution">
          <div style={{ fontSize: 13, color: C.text }}>{exercise.substitution}</div>
        </Section>
      )}

      {ladder && (
        <Section title="Ladder position">
          <div style={{ fontSize: 13, color: C.text }}>
            Rung {currentRungIndex + 1} of {ladder.rungs.length}: <strong>{currentRung?.name ?? "-"}</strong>
          </div>
        </Section>
      )}

      <Section title="Video URL">
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
          {ladder
            ? "Edits the current rung's video — the one shown in the Session runner. A broken or missing link never blocks a session; cues remain the primary instruction."
            : "A broken or missing link never blocks a session; cues remain the primary instruction."}
        </div>
        <input
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          style={{ ...inputStyle, width: "100%", boxSizing: "border-box", marginBottom: 10 }}
        />
        <button onClick={saveVideoUrl} style={smallBtn}>
          Save
        </button>
        {notice && <div style={{ fontSize: 13, color: C.ok, marginTop: 10 }}>{notice}</div>}
        {editableVideoUrl && (
          <div style={{ marginTop: 10 }}>
            <a href={editableVideoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.slate }}>
              Open current link &rarr;
            </a>
          </div>
        )}
      </Section>
    </div>
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

const linkBtn: CSSProperties = {
  background: "none",
  border: "none",
  color: C.textMuted,
  marginBottom: 8,
  cursor: "pointer",
  padding: 0,
  fontSize: 14
};
