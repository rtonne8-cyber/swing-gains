import { useState, type CSSProperties } from "react";
import { db } from "../db/schema";
import { C, sans } from "../theme/tokens";
import type { MetricType, Side } from "../db/types";

interface MetricsScreenProps {
  // When set, this screen is being shown as the block-transition ROM prompt (spec §3.5);
  // onDone lets the caller resume the transition flow once the wizard is dismissed.
  romPromptOnly?: boolean;
  onDone?: () => void;
}

async function logMetric(type: MetricType, value: number, unit: string, side?: Side, device?: string) {
  await db.metricLog.add({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    type,
    value,
    unit,
    side,
    device,
    sourceTag: "manual"
  });
}

export default function MetricsScreen({ romPromptOnly = false, onDone }: MetricsScreenProps) {
  return (
    <div style={{ fontFamily: sans, padding: 20, paddingBottom: 90 }}>
      {romPromptOnly && (
        <div style={{ background: C.warmGrey, borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 16 }}>
          Block transition: run the ROM self-tests before continuing (spec §3.5). You can skip
          and do these later from Metrics at any time.
        </div>
      )}
      <h1 style={{ color: C.slate, fontSize: 20, marginBottom: 16 }}>Metrics</h1>

      <RomWizard />

      {!romPromptOnly && (
        <>
          <SwingSpeedEntry />
          <BodyweightEntry />
        </>
      )}

      {romPromptOnly && (
        <button onClick={onDone} style={primaryBtn}>
          Continue
        </button>
      )}
    </div>
  );
}

function RomWizard() {
  const [thoracicL, setThoracicL] = useState("");
  const [thoracicR, setThoracicR] = useState("");
  const [hipL, setHipL] = useState<0 | 1 | 2 | null>(null);
  const [hipR, setHipR] = useState<0 | 1 | 2 | null>(null);
  const [reach, setReach] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  async function saveThoracic() {
    if (thoracicL) await logMetric("rom_thoracic", Number(thoracicL), "deg", "L");
    if (thoracicR) await logMetric("rom_thoracic", Number(thoracicR), "deg", "R");
    setSaved("Thoracic rotation saved.");
  }

  async function saveHip() {
    if (hipL != null) await logMetric("rom_hip", hipL, "grade", "L");
    if (hipR != null) await logMetric("rom_hip", hipR, "grade", "R");
    setSaved("Hip switch saved.");
  }

  async function saveReach() {
    if (reach) await logMetric("rom_reach", Number(reach), "cm");
    setSaved("Toe reach saved.");
  }

  return (
    <Section title="ROM self-tests">
      {saved && <div style={{ fontSize: 12, color: C.ok, marginBottom: 10 }}>{saved}</div>}

      <Field label="Seated wall thoracic rotation (degrees, clock-face estimate)">
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="L" type="number" inputMode="numeric" value={thoracicL} onChange={(e) => setThoracicL(e.target.value)} style={inputStyle} />
          <input placeholder="R" type="number" inputMode="numeric" value={thoracicR} onChange={(e) => setThoracicR(e.target.value)} style={inputStyle} />
          <button onClick={saveThoracic} style={smallBtn}>
            Save
          </button>
        </div>
      </Field>

      <Field label="90/90 hip switch hold">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <GradePicker label="Left" value={hipL} onChange={setHipL} />
          <GradePicker label="Right" value={hipR} onChange={setHipR} />
          <button onClick={saveHip} style={{ ...smallBtn, alignSelf: "flex-start" }}>
            Save
          </button>
        </div>
      </Field>

      <Field label="Standing toe reach (distance to floor, cm)">
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" inputMode="decimal" value={reach} onChange={(e) => setReach(e.target.value)} style={inputStyle} />
          <button onClick={saveReach} style={smallBtn}>
            Save
          </button>
        </div>
      </Field>
    </Section>
  );
}

function GradePicker({ label, value, onChange }: { label: string; value: 0 | 1 | 2 | null; onChange: (v: 0 | 1 | 2) => void }) {
  const options: { v: 0 | 1 | 2; label: string }[] = [
    { v: 0, label: "Not yet" },
    { v: 1, label: "With support" },
    { v: 2, label: "Achievable" }
  ];
  return (
    <div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: `1px solid ${C.line}`,
              background: value === o.v ? C.slate : C.white,
              color: value === o.v ? C.white : C.text,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwingSpeedEntry() {
  const [value, setValue] = useState("");
  const [device, setDevice] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!value) return;
    await logMetric("swing_speed", Number(value), "mph", undefined, device || undefined);
    setValue("");
    setSaved(true);
  }

  return (
    <Section title="Swing speed quick-add">
      {saved && <div style={{ fontSize: 12, color: C.ok, marginBottom: 10 }}>Logged.</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="mph" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle} />
        <input placeholder="Device (e.g. R10)" value={device} onChange={(e) => setDevice(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
        <button onClick={save} style={smallBtn}>
          Log
        </button>
      </div>
    </Section>
  );
}

function BodyweightEntry() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!value) return;
    await logMetric("bodyweight", Number(value), "kg");
    setValue("");
    setSaved(true);
  }

  return (
    <Section title="Bodyweight">
      {saved && <div style={{ fontSize: 12, color: C.ok, marginBottom: 10 }}>Logged.</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="kg" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle} />
        <button onClick={save} style={smallBtn}>
          Log
        </button>
      </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  fontSize: 14,
  minWidth: 0
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

const primaryBtn: CSSProperties = {
  width: "100%",
  padding: "14px 0",
  background: C.copper,
  color: C.white,
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer"
};
