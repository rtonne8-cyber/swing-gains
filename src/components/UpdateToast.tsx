import { useRegisterSW } from "virtual:pwa-register/react";
import { C, sans } from "../theme/tokens";

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 70,
        transform: "translateX(-50%)",
        zIndex: 100,
        background: C.text,
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        fontFamily: sans
      }}
    >
      <span style={{ color: C.white, fontSize: 13.5 }}>Update available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: C.copper,
          color: C.white,
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        Refresh
      </button>
    </div>
  );
}
