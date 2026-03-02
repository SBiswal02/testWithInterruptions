/**
 * Active test UI showing stimulus, controls, feedback, and distraction popup.
 */
import DistractionPopup from "./DistractionPopup";

export default function TestScreen({
  trialCounterLabel,
  nValue,
  trialProgress,
  progressTransitionMs,
  stimulusType,
  currentStimulus,
  isResponseEnabled,
  onMatch,
  onNoMatch,
  onEndTest,
  feedback,
  distraction,
  onCloseDistraction,
}) {
  return (
    <section className="card screen test-screen">
      <h2>Actual Test</h2>
      <div className="test-meta">
        <span>{trialCounterLabel}</span>
        <span>N-Back: {nValue}</span>
      </div>
      <div className="trial-progress" aria-label="Time until next trial">
        <div
          className="trial-progress-fill"
          style={{
            width: `${trialProgress}%`,
            transition: `width ${progressTransitionMs}ms linear`,
          }}
        />
      </div>

      <div className="stimulus-panel">
        {stimulusType === "positions" ? (
          <div className="grid-board">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className={`grid-cell ${currentStimulus === index ? "active" : ""}`} />
            ))}
          </div>
        ) : (
          <div className="stimulus-token">{currentStimulus}</div>
        )}

        <DistractionPopup
          visible={distraction?.visible}
          text={distraction?.text}
          onClose={onCloseDistraction}
        />
      </div>

      <div className="actions" style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        <button className="primary" onClick={onMatch} disabled={!isResponseEnabled} style={{ flex: 1 }}>
          Match (Space)
        </button>
        <button onClick={onNoMatch} disabled={!isResponseEnabled} style={{ flex: 1, marginLeft: "1rem" }} >
          No Match (Enter)
        </button>
      </div>

      <div
        className="actions"
        style={{
          width: "100%",
          marginTop: "0.75rem",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button type="button" className="secondary" onClick={onEndTest}>
          End Test &amp; View Results
        </button>
      </div>

      <p className={`feedback ${feedback.kind}`}>{feedback.text}</p>
    </section>
  );
}



