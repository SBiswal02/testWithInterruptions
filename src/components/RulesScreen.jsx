/**
 * Instructions / rules screen explaining the N-back task.
 */
export default function RulesScreen({ onBack, onContinue }) {
  return (
    <section className="card screen rules-screen">
      <h2 style={{ textAlign: "center" }}>How the N-Back Test Works </h2>
      <p className="subtitle">
        Please read these instructions carefully before you start the test.
      </p>

      <div className="rules-body">
        <h3>Core idea</h3>
        <p>
          You will see a sequence of items (letters, numbers, or positions on a grid). Your job is to decide
          whether the current item is the same as the one shown{" "}
          <strong>N steps earlier in the sequence</strong>.
        </p>

        <h3>During the test</h3>
        <ol className="rules-list">
          <li>
            One stimulus is shown at a time, for a fixed duration. A progress bar shows how much time is left
            for that stimulus.
          </li>
          <li>
            When the current item matches the one from <strong>N trials ago</strong>, this is called a{" "}
            <strong>target</strong>.
          </li>
          <li>
            If you think the current item is a target, press the <strong>Match</strong> button or tap the{" "}
            <strong>Space</strong> key.
          </li>
          <li>
            If you think it is <strong>not</strong> a target, press <strong>No Match</strong> or tap the{" "}
            <strong>Enter</strong> key.
          </li>
          <li>
            Try to respond as quickly and accurately as you can before the progress bar reaches the end.
          </li>
        </ol>

        <h3>Distractions</h3>
        <p>
          At random times, a popup distraction may appear asking you to close it. When a distraction is
          visible, the N-back stimulus is temporarily paused. Close the popup (or press <strong>Escape</strong>)
          and then continue focusing on the main task.
        </p>

        <h3>Feedback and results</h3>
        <p>
          After each response you will see brief feedback (for example, whether your last response was correct).
          At the end of the session, a results screen will summarize your accuracy, hits, misses, false alarms,
          and reaction times.
        </p>
      </div>

      <div className="actions" style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        <button type="button" onClick={onBack} style={{ flex: 1 }}>
          Back
        </button>
        <button
          type="button"
          className="primary"
          onClick={onContinue}
          style={{ flex: 1, marginLeft: "1rem" }}
        >
          Continue
        </button>
      </div>
    </section>
  );
}

