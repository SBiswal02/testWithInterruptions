# Product Requirements Document (PRD)

**Calm Technology N-Back** (web-based N-back experiment with optional interruptions)

## Overview
Calm Technology N-Back is a **linear-flow** experiment website where a participant has to give a **N-back task** (letters, numbers, or spatial positions) and **the results** are saved locally via a small Node/Express backend.

The product is designed for **in-lab or supervised sessions** where a facilitator launches the test, a participant completes a single run, and the system stores a **per-run JSON record (source of truth)** and an **append-only CSV summary** for later analysis.

## Problem statement
We need a simple, repeatable way to run N-back sessions with consistent task structure and controlled timing, while collecting outcome metrics (accuracy, response types, reaction times) and optionally introducing **controlled distractions/interruptions** to form the baseline of how interruptive tasks occur.

## Goals
- **Consistent execution**: Fixed, timed trials with clear controls and feedback.
- **Configurable task**: Allow selecting N level, trial count, stimulus type, and stimulus duration.
- **Optional interruptions**: Enable distraction popups with configurable probability and measurable count.
- **Local-first data collection**: Save each run locally to JSON + CSV without requiring internet or cloud accounts.
- **Immediate visibility**: Show results immediately on-screen at the end of a session.


## Target users & personas
- **Participant**: Completes a single N-back session quickly with clear instructions and accessible controls.
- **Facilitator**: Sets session parameters, ensures participant understands the rules, monitors completion, and confirms results were saved.
- **Researcher / Analyst**: Consumes the generated JSON/CSV files for statistical analysis and reporting.

## Assumptions
- Sessions run on a **local machine** (laptop/desktop) in a controlled environment.
- A local backend server is available to persist data to disk.
- Participants can use a keyboard (preferred) or the on-screen buttons.

## User experience: primary flow
The website is intentionally **linear** and guides a participant through these phases:

1. **Intro**: Collect participant identifiers (name required, ID number optional).
2. **Rules**: Explain N-back concept, controls, distractions, and feedback.
3. **Test Settings**: Configure N-back parameters and distraction settings.
4. **Countdown**: 3…2…1 start sequence.
5. **Test Task**: Timed trials, response collection, progress bar, delayed feedback, interruption handling.
6. **Results**: Display session summary metrics and saving status, with actions to start over or run another session.

## Functional requirements

### FR1 - Intro (participant identification)
- Collect **Name** (required) and **ID number** (optional, digits only).
- Block continue if name is blank; show an error.

### FR2 - Rules/instructions
- Explain N-back, what a target is, and how to respond.
- Include controls: **Match = Space**, **No Match = Enter**, close distraction = **Esc**.
- Allow Back to Intro and Continue to Settings.

### FR3 - Test settings
- Configure:
  - **N** (1–4), **trials** (20/30/40/50)
  - **stimulus** (letters/numbers/positions), **duration** (1000–4000 ms)
  - **distractions** on/off + **probability** (10–100%) when enabled
- Start uses selected settings; probability is hidden when distractions are off.

### FR4 - Countdown
- Show a ~3 second countdown and then start the test automatically.

### FR5 - Active test task

1. **Stimulus rendering**: Show one stimulus per trial (letter, digit, or 3×3 position highlight).
2. **Responses and controls** :
    1. Responses: **Match (Space)** and **No Match (Enter)**, via buttons or keyboard. 
    2. Disable responses until trial index \(\ge N\).
    3. Provide **End Test**.
3. Trial timing and progress
    1. Each trial runs for the configured duration and shows a progress bar.
    2. If no response before time ends, record **No Match** with reaction time = duration.
4. Feedback behavior (delayed) : Show brief correctness feedback, displayed on the next trial (short gap).
5. Distraction/interruptions
    1. When enabled, show a random distraction popup based on probability.
    2. While visible: pause timing, disable responses; close via UI or **Esc**; auto-close after a short timeout.
    3. Track **distraction popup count**.

### FR6 - Results screen
- Show participant name, summary metrics (accuracy, counts, reaction time, distractions), and save status (saving/saved/failed).
- Actions: **New Participant** and **Run Another Session**.

## Data

### Data objects
Each run record must contain:
- **timestamp** (ISO string)
- **participant**
  - name
  - rollNumber (optional)
- **settings**
  - nValue
  - numTrials
  - stimulusType
  - stimulusDuration
  - distraction enabled + probability (recommended to store for analysis; if not in CSV, include in JSON)
- **results**
  - accuracy
  - hits, misses, falseAlarms, correctRejections
  - avgReactionTime
  - avgCorrectHitOrRejectionReactionTime
  - completedTrials and totalTrials (or equivalent)
  - distractionPopupCount

### Saving format
- **Per-run JSON**: stored under `data/runs/` and treated as the **source of truth**.
- **Summary CSV**: append-only file `data/results.csv` with one row per run.

### Backend API
- Endpoint: `POST /api/results`
- Contract:
  - Accepts run record payload (timestamp + participant + settings + results).
  - Persists JSON first; appends CSV row after JSON creation.
  - Returns success JSON including relative JSON file path.


## Metrics & scoring definitions (experiment semantics)
- **Scoring start**: begin scoring only when N-back comparisons are valid (trial index \(\ge N\)).
- **Response categories**
  - **Hit**: target + Match response.
  - **Miss**: target + No Match response (or timeout).
  - **False alarm**: non-target + Match response.
  - **Correct rejection**: non-target + No Match response (or timeout).
- **Accuracy**: \(\frac{hits + correctRejections}{hits + misses + falseAlarms + correctRejections} \times 100\), rounded to a whole percent.
- **Reaction time**
  - Overall: average reaction time across scored trials (including timeouts as full duration).
  - Correct-only: average reaction time for hits and correct rejections.