/**
 * Intro screen that collects participant details.
 */
export default function IntroScreen({ participant, introError, onParticipantChange, onContinue }) {
  return (
    <section className="card screen intro-screen">
      <h1 style={{ textAlign: "center" }}>N-Back Test</h1>
      <form className="form-grid" onSubmit={onContinue}>
        <label>
          Name
          <input
            required
            value={participant.name}
            placeholder="Please Enter Your Name"
            onChange={(event) => onParticipantChange("name", event.target.value)}
          />
        </label>
        <label>
          ID Number
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={participant.rollNumber}
            placeholder="Please enter ID: Only numbers are allowed"
            onChange={(event) => onParticipantChange("rollNumber", event.target.value.replace(/\D/g, ""))}
          />
        </label>
        {introError ? <p className="form-error">{introError}</p> : null}
        <button type="submit" className="primary" style={{ fontSize: "1.1vw" }}>
          Let's Start
        </button>
      </form>
    </section>
  );
}



