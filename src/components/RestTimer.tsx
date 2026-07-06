import { useEffect, useRef, useState, type CSSProperties } from "react";
import { C, sans } from "../theme/tokens";

// Spec section 6 screen 2: rest timer with audible/vibration cues where the platform
// permits, and a visual fallback (iOS Safari in silent mode / no vibration API on iPadOS
// both fall back to the flashing visual state below).
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // audio unavailable - visual fallback carries the cue
  }
}

function vibrate() {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([250, 100, 250]);
    } catch {
      // vibration unavailable - visual fallback carries the cue
    }
  }
}

interface RestTimerProps {
  defaultSeconds: number;
  label: string;
}

export default function RestTimer({ defaultSeconds, label }: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          playBeep();
          vibrate();
          setFlash(true);
          setTimeout(() => setFlash(false), 1500);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function reset(seconds: number) {
    setRunning(false);
    setTotalSeconds(seconds);
    setRemaining(seconds);
  }

  function adjust(delta: number) {
    setTotalSeconds((t) => Math.max(15, t + delta));
    setRemaining((r) => Math.max(0, r + delta));
  }

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div
      style={{
        fontFamily: sans,
        background: flash ? C.copper : C.white,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 16,
        transition: "background 0.3s"
      }}
    >
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 700, color: flash ? C.white : C.text, fontVariantNumeric: "tabular-nums" }}>
        {mm}:{ss.toString().padStart(2, "0")}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button onClick={() => setRunning((r) => !r)} style={btnStyle(C.slate)}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={() => reset(totalSeconds)} style={btnStyle(C.warmGrey, C.text)}>
          Reset
        </button>
        <button onClick={() => adjust(-15)} style={btnStyle(C.warmGrey, C.text)}>
          -15s
        </button>
        <button onClick={() => adjust(15)} style={btnStyle(C.warmGrey, C.text)}>
          +15s
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg: string, color = "#fff"): CSSProperties {
  return {
    background: bg,
    color,
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  };
}
