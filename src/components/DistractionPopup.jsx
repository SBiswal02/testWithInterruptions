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
    }, 5000);

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
        X
      </button>
      <p>{text}</p>
    </div>
  );
}

