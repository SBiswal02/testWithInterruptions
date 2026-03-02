/**
 * Main application container controlling the full N-back flow:
 * intro -> rules -> settings -> countdown -> test -> results.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountdownScreen from "./components/CountdownScreen";
import IntroScreen from "./components/IntroScreen";
import ResultsScreen from "./components/ResultsScreen";
import SettingsScreen from "./components/SettingsScreen";
import TestScreen from "./components/TestScreen";
import RulesScreen from "./components/RulesScreen";
import { calculateResults, generateSequence } from "./utils/nback";

const PHASES = {
  INTRO: "intro",
  RULES: "rules",
  SETTINGS: "settings",
  COUNTDOWN: "countdown",
  TEST: "test",
  RESULTS: "results",
};

const RESPONSE_ADVANCE_MS = 450;
const FEEDBACK_GAP_MS = 140;
const DISTRACTION_MESSAGES = [
  "Please close this popup and continue.",
  "Distraction check: close and refocus.",
  "Random reminder: return to the task.",
  "Ignore this prompt and keep tracking.",
];

const DEFAULT_PARTICIPANT = {
  name: "",
  rollNumber: "",
};

const DEFAULT_SETTINGS = {
  nValue: 2,
  numTrials: 30,
  stimulusType: "letters",
  stimulusDuration: 2000,
  enableDistractions: true,
  distractionProbability: 30,
};

export default function App() {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [previousPhase, setPreviousPhase] = useState(PHASES.INTRO);

  const [participant, setParticipant] = useState(DEFAULT_PARTICIPANT);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [sequence, setSequence] = useState([]);
  const [targetFlags, setTargetFlags] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState({ text: "", kind: "" });
  const [results, setResults] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [trialProgress, setTrialProgress] = useState(0);
  const [progressTransitionMs, setProgressTransitionMs] = useState(0);
  const [introError, setIntroError] = useState("");
  const [countdownValue, setCountdownValue] = useState(3);
  const [distraction, setDistraction] = useState({ visible: true, text: "" });
  const trialStartTimeRef = useRef(0);
  const trialLockedRef = useRef(false);
  const responseTimerRef = useRef(null);
  const nextTrialTimerRef = useRef(null);
  const progressRafRef = useRef(null);
  const pendingFeedbackRef = useRef({ text: "", kind: "" });
  const feedbackDelayTimerRef = useRef(null);
  const distractionTimerRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const trialPausedRef = useRef(false);
  const remainingResponseMsRef = useRef(0);

  const currentStimulus = sequence[currentTrial];
  const isResponseEnabled = phase === PHASES.TEST && currentTrial >= settings.nValue && !distraction.visible;

  const clearTimers = useCallback(() => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    if (nextTrialTimerRef.current) {
      clearTimeout(nextTrialTimerRef.current);
      nextTrialTimerRef.current = null;
    }
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
    if (feedbackDelayTimerRef.current) {
      clearTimeout(feedbackDelayTimerRef.current);
      feedbackDelayTimerRef.current = null;
    }
    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }
  }, []);

  const startProgressFor = useCallback(() => {
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }

    setProgressTransitionMs(0);

    // If this is the first run in a trial, reset the bar.
    if (elapsedBeforePauseRef.current === 0) {
      setTrialProgress(0);
    }

    const tick = () => {
      if (trialPausedRef.current || phase !== PHASES.TEST) {
        progressRafRef.current = null;
        return;
      }

      const now = performance.now();
      const elapsed = elapsedBeforePauseRef.current + (now - trialStartTimeRef.current);
      const ratio = Math.min(1, elapsed / settings.stimulusDuration);

      setTrialProgress(ratio * 100);

      if (ratio < 1) {
        progressRafRef.current = requestAnimationFrame(tick);
      } else {
        progressRafRef.current = null;
      }
    };

    progressRafRef.current = requestAnimationFrame(tick);
  }, [phase, settings.stimulusDuration]);

  const closeDistraction = useCallback(() => {
    setDistraction((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const pauseTrial = useCallback(() => {
    if (trialPausedRef.current || trialLockedRef.current) {
      return;
    }

    trialPausedRef.current = true;

    const now = performance.now();
    elapsedBeforePauseRef.current += now - trialStartTimeRef.current;

    const remaining = Math.max(0, settings.stimulusDuration - elapsedBeforePauseRef.current);
    remainingResponseMsRef.current = remaining;

    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }, [settings.stimulusDuration]);

  const beginTest = useCallback((nextSettings) => {
    const generated = generateSequence(nextSettings);
    setSettings(nextSettings);
    setSequence(generated.sequence);
    setTargetFlags(generated.targetFlags);
    setCurrentTrial(0);
    setResponses([]);
    trialLockedRef.current = false;
    setTrialProgress(0);
    setProgressTransitionMs(0);
    setFeedback({ text: "", kind: "" });
    pendingFeedbackRef.current = { text: "", kind: "" };
    setResults(null);
    setSaveStatus("idle");
    setCountdownValue(3);
    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }
    setDistraction({ visible: false, text: "" });
    setPhase(PHASES.COUNTDOWN);
  }, []);

  useEffect(() => {
    if (phase !== PHASES.COUNTDOWN) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setPhase(PHASES.TEST);
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [phase]);

  const submitResults = useCallback(
    async (finalResults) => {
      setSaveStatus("saving");
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          participant,
          settings,
          results: finalResults,
        };

        const response = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [participant, settings]
  );

  const finishTest = useCallback(
    (allResponses) => {
      clearTimers();
      const baseResults = calculateResults(allResponses, settings.nValue);
      const enrichedResults = {
        ...baseResults,
        completedTrials: allResponses.length,
        totalTrials: settings.numTrials,
      };
      setResults(enrichedResults);
      setPhase(PHASES.RESULTS);
      submitResults(enrichedResults);
    },
    [clearTimers, settings.nValue, settings.numTrials, submitResults]
  );

  const handleResponse = useCallback(
    (userResponded, autoAdvance = false) => {
      if (phase !== PHASES.TEST || trialLockedRef.current || currentTrial >= settings.numTrials) {
        return;
      }

      if (trialPausedRef.current) {
        return;
      }

      if (!autoAdvance && currentTrial < settings.nValue) {
        return;
      }

      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
      trialLockedRef.current = true;

      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      setProgressTransitionMs(0);
      setTrialProgress(100);

      if (distractionTimerRef.current) {
        clearTimeout(distractionTimerRef.current);
        distractionTimerRef.current = null;
      }
      closeDistraction();

      const isTarget = targetFlags[currentTrial];
      const reactionTime = autoAdvance
        ? settings.stimulusDuration
        : Math.round(performance.now() - trialStartTimeRef.current + elapsedBeforePauseRef.current);

      let text = "";
      let kind = "";
      if (isTarget && userResponded) {
        text = "Correct hit";
        kind = "correct";
      } else if (!isTarget && !userResponded) {
        text = "Correct rejection";
        kind = "correct";
      } else if (isTarget && !userResponded) {
        text = "Miss";
        kind = "incorrect";
      } else {
        text = "False alarm";
        kind = "incorrect";
      }

      // Delay status display: show this trial's status at start of next trial.
      pendingFeedbackRef.current = { text, kind };

      const response = {
        trial: currentTrial,
        isTarget,
        userResponded,
        reactionTime,
      };

      setResponses((prev) => {
        const next = [...prev, response];

        nextTrialTimerRef.current = setTimeout(() => {
          if (currentTrial + 1 >= settings.numTrials) {
            finishTest(next);
          } else {
            setCurrentTrial((value) => Math.min(value + 1, settings.numTrials - 1));
          }
        }, RESPONSE_ADVANCE_MS);

        return next;
      });
    },
    [closeDistraction, currentTrial, finishTest, phase, settings.nValue, settings.numTrials, settings.stimulusDuration, targetFlags]
  );

  const scheduleAutoResponse = useCallback(
    (delayMs) => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }

      responseTimerRef.current = setTimeout(() => {
        handleResponse(false, true);
      }, delayMs);
    },
    [handleResponse]
  );

  const resumeTrial = useCallback(() => {
    if (!trialPausedRef.current || trialLockedRef.current) {
      return;
    }

    trialPausedRef.current = false;
    trialStartTimeRef.current = performance.now();

    startProgressFor();

    const remaining = remainingResponseMsRef.current;
    if (remaining > 0) {
      scheduleAutoResponse(remaining);
    } else {
      scheduleAutoResponse(0);
    }
  }, [scheduleAutoResponse, startProgressFor]);

  const handleDistractionClose = useCallback(() => {
    const wasVisible = distraction.visible;
    closeDistraction();

    if (wasVisible && trialPausedRef.current && phase === PHASES.TEST && currentTrial < settings.numTrials) {
      resumeTrial();
    }
  }, [closeDistraction, currentTrial, distraction.visible, phase, resumeTrial, settings.numTrials]);

  useEffect(() => {
    if (phase !== PHASES.TEST) {
      return undefined;
    }

    if (currentTrial >= settings.numTrials) {
      return undefined;
    }

    trialLockedRef.current = false;
    trialPausedRef.current = false;
    elapsedBeforePauseRef.current = 0;
    remainingResponseMsRef.current = settings.stimulusDuration;
    const nextFeedback = pendingFeedbackRef.current.text ? { ...pendingFeedbackRef.current } : null;
    pendingFeedbackRef.current = { text: "", kind: "" };
    setFeedback({ text: "", kind: "" });

    if (feedbackDelayTimerRef.current) {
      clearTimeout(feedbackDelayTimerRef.current);
      feedbackDelayTimerRef.current = null;
    }
    if (nextFeedback) {
      feedbackDelayTimerRef.current = setTimeout(() => {
        setFeedback(nextFeedback);
        feedbackDelayTimerRef.current = null;
      }, FEEDBACK_GAP_MS);
    }

    trialStartTimeRef.current = performance.now();
    startProgressFor();

    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }
    closeDistraction();

    const distractionProbability = Math.max(0, Math.min(100, Number(settings.distractionProbability ?? 30)));

    if (settings.enableDistractions && Math.random() < distractionProbability / 100) {
      const minDelay = 220;
      const maxDelay = Math.max(minDelay, settings.stimulusDuration - 220);
      const showDelay =
        maxDelay <= minDelay
          ? minDelay
          : Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      distractionTimerRef.current = setTimeout(() => {
        if (trialLockedRef.current) {
          distractionTimerRef.current = null;
          return;
        }

        const text = DISTRACTION_MESSAGES[Math.floor(Math.random() * DISTRACTION_MESSAGES.length)];
        setDistraction({
          visible: true,
          text,
        });

        pauseTrial();
        distractionTimerRef.current = null;
      }, showDelay);
    }

    scheduleAutoResponse(settings.stimulusDuration);

    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      if (feedbackDelayTimerRef.current) {
        clearTimeout(feedbackDelayTimerRef.current);
        feedbackDelayTimerRef.current = null;
      }
      if (distractionTimerRef.current) {
        clearTimeout(distractionTimerRef.current);
        distractionTimerRef.current = null;
      }
      trialPausedRef.current = false;
      elapsedBeforePauseRef.current = 0;
      remainingResponseMsRef.current = 0;
    };
  }, [
    closeDistraction,
    currentTrial,
    handleResponse,
    phase,
    settings.enableDistractions,
    settings.distractionProbability,
    settings.numTrials,
    settings.stimulusDuration,
    scheduleAutoResponse,
    startProgressFor,
    pauseTrial,
  ]);

  useEffect(() => {
    if (phase !== PHASES.TEST) {
      return undefined;
    }

      const onKeyDown = (event) => {
        if (event.code === "Escape" && distraction.visible) {
          event.preventDefault();
          handleDistractionClose();
          return;
        }

        if (distraction.visible) {
          return;
        }

        if (currentTrial < settings.nValue) {
          return;
        }

        if (event.code === "Space") {
          event.preventDefault();
          handleResponse(true);
        } else if (event.code === "Enter") {
          event.preventDefault();
          handleResponse(false);
        }
      };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentTrial, distraction.visible, handleDistractionClose, handleResponse, phase, settings.nValue]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const trialCounterLabel = useMemo(
    () => `Trial ${Math.min(currentTrial + 1, settings.numTrials)} / ${settings.numTrials}`,
    [currentTrial, settings.numTrials]
  );

  const handleIntroContinue = (event) => {
    event.preventDefault();
    if (!participant.name.trim()) {
      setIntroError("Name is required.");
      return;
    }
    setIntroError("");
    setPhase(PHASES.RULES);
  };

  return (
    <main className="app-shell">
      {phase === PHASES.INTRO && (
        <IntroScreen
          participant={participant}
          introError={introError}
          onParticipantChange={(field, value) =>
            setParticipant((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onContinue={handleIntroContinue}
        />
      )}

      {phase === PHASES.RULES && (
        <RulesScreen
          onBack={() => setPhase(PHASES.INTRO)}
          onContinue={() => {
            setPreviousPhase(PHASES.RULES);
            setPhase(PHASES.SETTINGS);
          }}
        />
      )}

      {phase === PHASES.SETTINGS && (
        <SettingsScreen
          settings={settings}
          onSettingsChange={(field, value) =>
            setSettings((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onBack={() => setPhase(previousPhase)}
          onStart={() => beginTest(settings)}
        />
      )}

      {phase === PHASES.COUNTDOWN && <CountdownScreen countdownValue={countdownValue} />}

      {phase === PHASES.TEST && (
        <TestScreen
          trialCounterLabel={trialCounterLabel}
          nValue={settings.nValue}
          trialProgress={trialProgress}
          progressTransitionMs={progressTransitionMs}
          stimulusType={settings.stimulusType}
          currentStimulus={currentStimulus}
          isResponseEnabled={isResponseEnabled}
          onMatch={() => handleResponse(true)}
          onNoMatch={() => handleResponse(false)}
          onEndTest={() => finishTest(responses)}
          feedback={feedback}
          distraction={distraction}
          onCloseDistraction={handleDistractionClose}
        />
      )}

      {phase === PHASES.RESULTS && (
        <ResultsScreen
          participantName={participant.name}
          results={results}
          saveStatus={saveStatus}
          onNewParticipant={() => {
            setParticipant(DEFAULT_PARTICIPANT);
            setSettings(DEFAULT_SETTINGS);
            setResults(null);
            setPhase(PHASES.INTRO);
          }}
          onRunAnother={() => {
            setResults(null);
            setPreviousPhase(PHASES.RESULTS);
            setPhase(PHASES.SETTINGS);
          }}
        />
      )}
    </main>
  );
}

























