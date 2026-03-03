/**
 * Instructions / rules screen explaining the N-back task.
 */
export default function RulesScreen({ onBack, onContinue }) {
  const handleBack = () => typeof onBack === "function" && onBack();
  const handleContinue = () => typeof onContinue === "function" && onContinue();

  return (
    <section className="card screen rules-screen">
      <h2 style={{ textAlign: "center"}}>
        How the N-Back Test Works
      </h2>

      <p className="subtitle">
        Please read these instructions carefully before starting the test.
      </p>

      <div className="rules-body">
        <h3>Core Idea</h3>
        <p>
          You will see a <b>sequence of items </b> (letters, numbers, or positions on a grid),
          shown one at a time. Your task is to decide if the current item is the
          same as the one shown <b>N steps earlier in the sequence</b>.
        </p>

        <h3>During the Test</h3>
        <ol className="rules-list">
          <li>
            Only one stimulus is displayed at a time, for a fixed duration.
            A progress bar shows how much time remains to respond.
          </li>
          <li>
            When the current item matches the one from{" "}
            <b>N trials ago</b>, it is called a{" "}
            <strong>target</strong>.
          </li>
          <li>
            If you think the current item is a target, press the{" "}
            <b>Match</b> button or the <b>Space</b> key.
          </li>
          <li>
            If you think the current item is not a target, press{" "}
            <b>No Match</b> or the <b>Enter</b> key.
          </li>
          <li>
            Try to respond as quickly and accurately as possible before
            the progress bar reaches the end.
          </li>
        </ol>

        <h3>Distractions</h3>
        <p>
          At random times, a popup distraction may appear asking you to close it.
          When a distraction is visible, the N-back stimulus is temporarily paused.
          Close the popup (or press <strong>Escape</strong>) and then continue
          focusing on the main task.
        </p>

        <h3>Feedback and Results</h3>
        <p>
          After each response, you will see brief feedback indicating whether your
          answer was correct. At the end of the session, a results screen will
          summarize your:
        </p>

        <ul className="rules-list">
          <li>Overall accuracy</li>
          <li>Hits (correct matches)</li>
          <li>Misses (missed targets)</li>
          <li>False alarms (incorrect matches)</li>
          <li>Reaction times</li>
        </ul>
      </div>

      <div className="actions" style={{ width: "100%", display: "flex", gap: "1vw", justifyContent: "space-between" }}>
        <button type="button" onClick={handleBack} style={{ flex: 1 }}>
          Back
        </button>
        <button
          type="button"
          className="primary"
          onClick={handleContinue}
          style={{ flex: 1 }}
        >
          Continue
        </button>
      </div>
    </section>
  );
}

