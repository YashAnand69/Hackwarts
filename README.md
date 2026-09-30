# Hackwarts ✦ The Magic of Sharing

A Harry Potter inspired skill-sharing and time-banking app. Find complementary tutors, exchange lessons, send an owl, experiment with potions, and practice spells. **One hour of teaching = one Galleon.**

## Run locally

Use Node 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No API keys or Firebase connection are needed to explore the default demo.

## The experience

- **The Great Hall:** instant skill-based matching, optional AI refresh, name/skill/house search, house filters, learning/teaching filters, sorting, and saved tutors.
- **My Lessons:** propose future lessons, accept or decline as the tutor, cancel as the learner, export a calendar event, and review after a lesson ends.
- **Owl Post:** persistent conversations with lesson planning and icebreakers.
- **Potions Lab:** animated brewing and new skill discoveries.
- **Spell Practice:** wand effects, canvas particles, and practice counts saved per wizard.
- **House Cup & My Wizard Profile:** community rankings, editable skill offerings, learning goals, and your Galleon balance.

The visual system uses candlelit navy, parchment, antique gold, restrained house colors, Cinzel headings, and DM Sans body text. Desktop uses a sidebar; mobile uses a collapsible menu. Animated stars, glowing castle windows, mist, tutor cards, navigation, and page transitions respect reduced-motion preferences. Sound is opt-in and persists across sessions. Dialogs support Escape, focus trapping, and returning focus to the trigger.

## Data modes

**Demo (default):** all seven fictional profiles and subsequent changes are stored in this browser's local storage. Persona switching is a demonstration feature, not authentication. Messages do not reach real people. Clearing site data resets the demo. Separate browsers/devices have independent data. The demo store serializes transactions within an app instance and rolls back failed changes; it is not a multi-user database.

**Live (opt-in):** set `VITE_DATA_MODE=live` in your local environment and rebuild. Uses `firebase-applet-config.json` and shared Firestore collections. The app does not automatically seed a shared database. Configure profiles separately.

**Live deployment limitation:** the inherited `firestore.rules` allow unrestricted reads and writes, and persona selection is not authenticated. Do not treat this mode as a secure public service. Before using shared data publicly, implement Firebase Authentication, enforce participant/profile ownership in security rules, and enforce booking reservations and scheduling conflicts on a trusted server. Client-side validation and transactions improve normal use but do not replace authorization. The current pending-booking budget/conflict checks are client queries and do not guarantee cross-client reservations.

## Optional AI

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` on the server only. `GEMINI_MODEL` defaults to `gemini-2.5-flash` and can be changed to a model enabled for your account. Never expose the API key with a `VITE_` prefix.

Matching is immediate and local; AI is requested only when you choose **Refresh matches**, rather than on every profile update. API errors, malformed responses, and timeouts keep useful skill-based results visible. The server uses the same fallback matching algorithm as the browser.

## Lesson rules

- Choose another wizard, an offered subject, a future time, and a supported duration.
- Existing pending/accepted requests count toward available booking credits; overlapping learner requests are rejected.
- Only the tutor accepts/declines a pending request; only the learner cancels pending/accepted requests.
- Completion opens after the scheduled end time. Participant reviews use deterministic IDs.
- Settlement reads fresh profiles and lesson status in one transaction, transfers credits once, records teaching hours, and updates the reviewed participant's weighted rating. The second participant can review without another transfer. Duplicate reviews and negative balances are rejected.

## Validation

```sh
npm run lint
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

The logic suite covers matching, booking restrictions, state transitions, credit conservation, ratings, duplicate reviews, calendar escaping, concurrent demo transactions, and rollback. The browser suite exercises discovery, a full lesson exchange and both reviews, persistent chat, spell navigation, theme persistence, keyboard dialogs, and mobile navigation.

## Stack & deployment

React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Lucide, Express, optional Firebase Firestore, and optional Gemini. Production builds separate Firebase and animation dependencies into chunks. Existing Vercel routing uses `api/index.ts` for Express endpoints and serves the Vite frontend; server secrets belong in the hosting provider's environment settings. A standalone Node host runs `npm run build` then `npm start`.

This is an unofficial fan project and is not affiliated with the Harry Potter rights holders.
