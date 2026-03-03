import { useEffect } from "react";

export default function DistractionPopup({ visible, text, onClose }) {
  if (!visible) {
    return null;
  }

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timeoutId);
  }, [visible, onClose]);

  return (
    <div
      className="distraction-popup"
      role="dialog"
      aria-label="Distraction popup"
      style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      <button
        type="button"
        className="distraction-close"
        onClick={onClose}
        aria-label="Close distraction"
        style={{ position: "absolute", top: "8px", right: "8px" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <p>{text}</p>
    </div>
  );
}

