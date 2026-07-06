import { C, sans } from "../theme/tokens";

export type NavScreen = "next-up" | "programme";

interface BottomNavProps {
  active: NavScreen;
  onNavigate: (screen: NavScreen) => void;
}

const ITEMS: { id: NavScreen; label: string }[] = [
  { id: "next-up", label: "Next Up" },
  { id: "programme", label: "Programme" }
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        display: "flex",
        borderTop: `1px solid ${C.line}`,
        background: C.white,
        fontFamily: sans
      }}
    >
      {ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            flex: 1,
            padding: "12px 0",
            border: "none",
            background: "none",
            color: active === item.id ? C.slate : C.textMuted,
            fontWeight: active === item.id ? 700 : 500,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
