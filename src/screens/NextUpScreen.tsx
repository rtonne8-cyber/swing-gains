import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "../db/schema";
import { evaluateBlockTransition } from "../engine/blockTransition";
import { computeNextUp } from "../engine/queues";
import { C, sans } from "../theme/tokens";
import type { Venue } from "../db/types";

interface NextUpScreenProps {
  onStartSession: (templateId: string) => void;
}

export default function NextUpScreen({ onStartSession }: NextUpScreenProps) {
  const [venue, setVenue] = useState<Venue>("gym");

  const programme = useLiveQuery(() => db.programme.toCollection().first(), []);
  const block = useLiveQuery(
    () => (programme ? db.block.get(programme.currentBlockId) : undefined),
    [programme?.currentBlockId]
  );
  const blockTemplates =
    useLiveQuery(
      () => (block ? db.sessionTemplate.where("blockId").equals(block.id).toArray() : []),
      [block?.id]
    ) ?? [];
  const sessionLogs = useLiveQuery(() => db.sessionLog.toArray(), []) ?? [];

  if (!programme || !block || blockTemplates.length === 0) {
    return <div style={{ padding: 24, fontFamily: sans, color: C.textMuted }}>Loading programme...</div>;
  }

  const nextUp = computeNextUp(
    blockTemplates,
    sessionLogs,
    programme.currentBlockStartDate,
    new Date().toISOString()
  );
  const transitionStatus = evaluateBlockTransition(nextUp, block.transitionRules);
  const activeTemplateId = venue === "gym" ? nextUp.nextGymTemplateId : nextUp.nextHomeTemplateId;
  const activeTemplate = blockTemplates.find((t) => t.id === activeTemplateId);

  return (
    <div style={{ fontFamily: sans, padding: 20, paddingBottom: 90 }}>
      <h1 style={{ color: C.slate, fontSize: 22, marginBottom: 4 }}>Swing Gains</h1>
      <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
        Block {block.sequence}: {block.name}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["gym", "home"] as Venue[]).map((v) => (
          <button
            key={v}
            onClick={() => setVenue(v)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: `1px solid ${C.line}`,
              background: venue === v ? C.slate : C.white,
              color: venue === v ? C.white : C.text,
              fontWeight: 700,
              textTransform: "capitalize",
              cursor: "pointer"
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {activeTemplate && (
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            padding: 18,
            marginBottom: 16
          }}
        >
          <div style={{ fontSize: 12, color: C.copper, fontWeight: 700, textTransform: "uppercase" }}>
            {activeTemplate.type}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "4px 0 10px" }}>
            {activeTemplate.name}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>
            {activeTemplate.exercisePrescriptions.length} exercises
          </div>
          <button
            onClick={() => onStartSession(activeTemplate.id)}
            style={{
              width: "100%",
              padding: "14px 0",
              background: C.copper,
              color: C.white,
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Start session
          </button>
        </div>
      )}

      <div style={{ background: C.warmGrey, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Block progress</div>
        <ProgressBar
          label={`${nextUp.totalSessionsCompleted} / ${block.transitionRules.minSessions} sessions`}
          value={nextUp.totalSessionsCompleted}
          max={block.transitionRules.minSessions}
        />
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
          Week {nextUp.weeksElapsed} of {block.transitionRules.maxWeeks} max &middot; Gym{" "}
          {nextUp.gymSessionsCompleted}/{block.transitionRules.minGymSessions} &middot; Home{" "}
          {nextUp.homeSessionsCompleted}/{block.transitionRules.minHomeSessions}
        </div>
        {(transitionStatus.gymSessionsBehindPace > 0 || transitionStatus.homeSessionsBehindPace > 0) && (
          <div style={{ fontSize: 12, color: C.copper, marginTop: 6, fontWeight: 700 }}>
            {transitionStatus.gymSessionsBehindPace > 0 && `${transitionStatus.gymSessionsBehindPace} gym sessions behind pace. `}
            {transitionStatus.homeSessionsBehindPace > 0 && `${transitionStatus.homeSessionsBehindPace} home sessions behind pace.`}
          </div>
        )}
        {transitionStatus.shouldTransition && (
          <div style={{ fontSize: 12, color: C.ok, marginTop: 6, fontWeight: 700 }}>
            Block complete — finish your next session to run the ROM tests and move on.
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div style={{ height: 8, borderRadius: 4, background: C.line, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.slate }} />
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{label}</div>
    </div>
  );
}
