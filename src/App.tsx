import { useEffect, useState } from "react";
import BottomNav, { type NavScreen } from "./components/BottomNav";
import UpdateToast from "./components/UpdateToast";
import { seedDatabase } from "./db/seed";
import NextUpScreen from "./screens/NextUpScreen";
import ProgrammeMapScreen from "./screens/ProgrammeMapScreen";
import SessionRunnerScreen from "./screens/SessionRunnerScreen";
import { C, sans } from "./theme/tokens";

type Route = { screen: NavScreen } | { screen: "session"; templateId: string };

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<Route>({ screen: "next-up" });

  useEffect(() => {
    seedDatabase()
      .then(() => setReady(true))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: sans, color: C.danger }}>
        <h1>Failed to load programme data</h1>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{error}</pre>
      </div>
    );
  }

  if (!ready) {
    return <div style={{ padding: 24, fontFamily: sans, color: C.textMuted }}>Loading Swing Gains...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.warmGrey }}>
      <div style={{ flex: 1 }}>
        {route.screen === "next-up" && (
          <NextUpScreen onStartSession={(templateId) => setRoute({ screen: "session", templateId })} />
        )}
        {route.screen === "programme" && <ProgrammeMapScreen />}
        {route.screen === "session" && (
          <SessionRunnerScreen templateId={route.templateId} onDone={() => setRoute({ screen: "next-up" })} />
        )}
      </div>
      {route.screen !== "session" && (
        <BottomNav active={route.screen} onNavigate={(screen) => setRoute({ screen })} />
      )}
      <UpdateToast />
    </div>
  );
}
