import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/schema";
import { loadTrendSeries, romTrend, sessionFrequencyStrip, swingSpeedTrend, type MetricPoint } from "../engine/progressViews";
import { C, sans } from "../theme/tokens";

const ROM_TESTS: { type: "rom_thoracic" | "rom_hip" | "rom_reach"; label: string }[] = [
  { type: "rom_thoracic", label: "Thoracic rotation" },
  { type: "rom_hip", label: "90/90 hip switch" },
  { type: "rom_reach", label: "Toe reach" }
];

export default function ProgressScreen() {
  const exercises = useLiveQuery(() => db.exercise.toArray(), []) ?? [];
  const sessionLogs = useLiveQuery(() => db.sessionLog.toArray(), []) ?? [];
  const setLogs = useLiveQuery(() => db.setLog.toArray(), []) ?? [];
  const metricLogs = useLiveQuery(() => db.metricLog.toArray(), []) ?? [];
  const progressionStates = useLiveQuery(() => db.progressionState.toArray(), []) ?? [];

  const loadedLifts = exercises.filter(
    (e) => e.venue === "gym" && e.loadRegion && progressionStates.some((p) => p.exerciseId === e.id && p.currentPrescribedLoadKg != null)
  );

  const speedSeries = swingSpeedTrend(metricLogs);
  const frequency = sessionFrequencyStrip(sessionLogs, 8, new Date().toISOString());

  return (
    <div style={{ fontFamily: sans, padding: 20, paddingBottom: 90 }}>
      <h1 style={{ color: C.slate, fontSize: 20, marginBottom: 16 }}>Progress</h1>

      <Section title="Load trend">
        {loadedLifts.length === 0 && <Empty text="No loaded prescriptions yet." />}
        {loadedLifts.map((ex) => {
          const series = loadTrendSeries(ex.id, sessionLogs, setLogs);
          return (
            <div key={ex.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.text }}>
                <span>{ex.name}</span>
                <span style={{ color: C.copper }}>{series.at(-1)?.loadKg ?? "-"} kg</span>
              </div>
              <Sparkline values={series.map((p) => p.loadKg)} />
            </div>
          );
        })}
      </Section>

      <Section title="Swing speed">
        {speedSeries.length === 0 ? (
          <Empty text="No swing speed logged yet." />
        ) : (
          <>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>
              Latest: <strong>{speedSeries.at(-1)?.value}</strong> {speedSeries.at(-1)?.unit}
              {speedSeries.at(-1)?.device ? ` (${speedSeries.at(-1)?.device})` : ""}
            </div>
            <Sparkline values={speedSeries.map((p) => p.value)} />
          </>
        )}
      </Section>

      <Section title="ROM scores">
        {ROM_TESTS.map(({ type, label }) => {
          const series = romTrend(metricLogs, type);
          return (
            <div key={type} style={{ marginBottom: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: C.text }}>{label}: </span>
              {series.length === 0 ? (
                <span style={{ color: C.textMuted }}>not tested yet</span>
              ) : (
                <RomHistory series={series} />
              )}
            </div>
          );
        })}
      </Section>

      <Section title="Session frequency (last 8 weeks)">
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60 }}>
          {frequency.map((w) => (
            <div key={w.weekStartISO} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: Math.max(4, w.count * 14),
                  background: C.slate,
                  borderRadius: 3
                }}
              />
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{w.count}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function RomHistory({ series }: { series: MetricPoint[] }) {
  const recent = series.slice(-3).reverse();
  return (
    <span style={{ color: C.textMuted }}>
      {recent
        .map((p) => `${p.value}${p.unit === "grade" ? "" : p.unit}${p.side ? ` ${p.side}` : ""}`)
        .join(" ← ")}
    </span>
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

function Empty({ text }: { text: string }) {
  return <div style={{ fontSize: 13, color: C.textMuted }}>{text}</div>;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div style={{ fontSize: 12, color: C.textMuted }}>Not enough data yet.</div>;
  }
  const width = 280;
  const height = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={C.slate} strokeWidth={2} />
    </svg>
  );
}
