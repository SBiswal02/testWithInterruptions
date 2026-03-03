/**
 * Results screen that summarizes the participant performance.
 */
import MetricCard from "./MetricCard";

export default function ResultsScreen({ participantName, results, saveStatus, onNewParticipant, onRunAnother }) {
  const saveLabel =
    saveStatus === "saving"
      ? "Saving results…"
      : saveStatus === "saved"
        ? "Results saved."
        : saveStatus === "error"
          ? "Save failed — check server."
          : "";

  return (
    <section className="card screen results-screen">
      <h2>Results</h2>
      <p className="subtitle">Session summary for participant {participantName}.</p>
      {saveLabel ? <p className={`subtitle ${saveStatus}`}>{saveLabel}</p> : null}

      <div className="results-grid">
        <MetricCard label="Accuracy" value={`${results?.accuracy ?? 0}%`} />
        <MetricCard
          label="Trials Completed"
          value={
            results?.totalTrials
              ? `${results.completedTrials ?? 0} / ${results.totalTrials}`
              : `${results?.completedTrials ?? 0}`
          }
        />
        <MetricCard label="Hits" value={results?.hits ?? 0} />
        <MetricCard label="Misses" value={results?.misses ?? 0} />
        <MetricCard label="False Alarms" value={results?.falseAlarms ?? 0} />
        <MetricCard label="Correct Rejections" value={results?.correctRejections ?? 0} />
        <MetricCard label="Reaction Time" value={results?.avgReactionTime ? `${results.avgReactionTime} ms` : "N/A"} />
        <MetricCard label="Distraction Popups" value={results?.distractionPopupCount ?? 0} />
      </div>

      <div className="actions">
        <button onClick={onNewParticipant}>New Participant</button>
        <button className="primary" onClick={onRunAnother}>
          Run Another Session
        </button>
      </div>
    </section>
  );
}




