---
name: Create React Frontend Feature
description: "Build a React frontend feature in this Vite app from a feature brief, with concrete file edits and implementation-ready code."
argument-hint: "Feature brief, UX requirements, and constraints"
agent: agent
---
Build a single React frontend feature for this workspace using the user input as the source of truth.

Input provided after running this prompt:
- Feature brief and user flow
- Required UI states (loading, empty, success, error)
- Any constraints (libraries to avoid, styling direction, responsiveness, accessibility)

Project context:
- React + Vite app
- Entry: `frontend/src/main.jsx`
- App shell: `frontend/src/App.jsx`
- Styles: `frontend/src/App.css`, `frontend/src/index.css`

Your task:
1. Translate the feature brief into a concrete UI and interaction plan.
2. Implement the feature directly in the existing frontend structure.
3. Keep code modular and readable (split into components if needed).
4. Include accessible semantics and keyboard-friendly interactions.
5. Ensure responsive behavior for mobile and desktop.
6. Reuse existing project patterns unless the user asks for a redesign.
7. Use an intentional, distinctive visual direction rather than generic default styling.

Output format:
1. `Plan`: 3-6 bullets describing component structure and state flow.
2. `Files to change`: exact file paths to create/update.
3. `Implementation`: complete code edits per file.
4. `Validation`: quick checklist for behavior and edge states.
5. `Run steps`: commands to run locally from `frontend/` (`npm install`, `npm run dev`, `npm run build`).

Rules:
- Do not introduce new dependencies unless explicitly requested.
- Prefer functional components and hooks.
- You may create new files under `frontend/src/components` and `frontend/src/hooks` when it improves structure.
- Avoid placeholder-only code; provide complete working implementation.
- Avoid generic default UI aesthetics (for example, default fonts and flat one-color screens) unless explicitly requested.
- If requirements are ambiguous, make minimal assumptions and state them explicitly before coding.
