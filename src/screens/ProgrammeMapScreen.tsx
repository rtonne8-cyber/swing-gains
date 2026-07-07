import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "../db/schema";
import { C, sans } from "../theme/tokens";

interface ProgrammeMapScreenProps {
  onSelectExercise: (exerciseId: string) => void;
}

export default function ProgrammeMapScreen({ onSelectExercise }: ProgrammeMapScreenProps) {
  const programme = useLiveQuery(() => db.programme.toCollection().first(), []);
  const blocks = useLiveQuery(() => db.block.orderBy("sequence").toArray(), []) ?? [];
  const exercises = useLiveQuery(() => db.exercise.toArray(), []) ?? [];
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const templates =
    useLiveQuery(
      () => (selectedBlock ? db.sessionTemplate.where("blockId").equals(selectedBlock.id).toArray() : []),
      [selectedBlock?.id]
    ) ?? [];

  if (selectedBlock) {
    return (
      <div style={{ fontFamily: sans, padding: 20, paddingBottom: 90 }}>
        <button
          onClick={() => setSelectedBlockId(null)}
          style={{ background: "none", border: "none", color: C.textMuted, marginBottom: 8, cursor: "pointer", padding: 0 }}
        >
          &larr; Back to map
        </button>
        <h1 style={{ color: C.slate, fontSize: 20 }}>
          Block {selectedBlock.sequence}: {selectedBlock.name}
        </h1>
        <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>{selectedBlock.emphasis}</p>

        {[...templates]
          .sort((a, b) => a.type.localeCompare(b.type))
          .map((t) => (
            <div
              key={t.id}
              style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 12 }}
            >
              <div style={{ fontSize: 12, color: C.copper, fontWeight: 700, textTransform: "uppercase" }}>
                {t.type} &middot; {t.venue}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
              {[...t.exercisePrescriptions]
                .sort((a, b) => a.order - b.order)
                .map((p) => {
                  const ex = exercises.find((e) => e.id === p.exerciseId);
                  return (
                    <button
                      key={p.order}
                      onClick={() => ex && onSelectExercise(ex.id)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        padding: "3px 0",
                        fontSize: 13,
                        color: C.text,
                        cursor: ex ? "pointer" : "default"
                      }}
                    >
                      <span style={{ textDecoration: ex ? "underline" : "none", textDecorationColor: C.line }}>
                        {ex?.name ?? p.exerciseId}
                      </span>{" "}
                      &mdash; {p.sets} x {p.repsDisplay}
                    </button>
                  );
                })}
              {t.notes && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{t.notes}</div>}
            </div>
          ))}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: sans, padding: 20, paddingBottom: 90 }}>
      <h1 style={{ color: C.slate, fontSize: 20, marginBottom: 16 }}>Programme</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {blocks.map((b) => {
          const isCurrent = b.id === programme?.currentBlockId;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBlockId(b.id)}
              style={{
                textAlign: "left",
                padding: 14,
                borderRadius: 12,
                border: `1px solid ${isCurrent ? C.copper : C.line}`,
                background: isCurrent ? C.slate : C.white,
                color: isCurrent ? C.white : C.text,
                cursor: "pointer"
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.8 }}>Block {b.sequence}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{b.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
