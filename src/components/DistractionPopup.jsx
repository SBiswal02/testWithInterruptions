export default function DistractionPopup({ visible, text, onClose }) {
  if (!visible) {
    return null;
  }

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

