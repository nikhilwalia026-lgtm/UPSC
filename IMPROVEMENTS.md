# UPSC-React — End-to-End Improvement Report

> Analyzed: 2026-04-25  
> Scope: Full codebase review — architecture, bugs, UX, performance, accessibility, security

---

## Project Overview

**UPSC AIR 1** is a spaced-repetition flashcard app for Indian Civil Services exam prep. It uses the SM2 algorithm, localStorage persistence, and a dark glassmorphism UI built with React + Tailwind + Framer Motion.

The codebase is a solid offline MVP but has several correctness bugs, missing accessibility, and security gaps to address before broader use.

---

## Critical Bugs

### 1. Streak Calculation (App.jsx ~line 55)

`Math.ceil()` on the millisecond difference between dates produces `0` when comparing the same calendar day, and can round up incorrectly across day boundaries.

**Fix:** Replace `Math.ceil` with `Math.floor`:
```js
// Before
const diffDays = Math.ceil(Math.abs(curr - last) / (1000 * 60 * 60 * 24));

// After
const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
```

---

### 2. Timezone Date Bug (DatePicker.jsx ~line 31)

The timezone offset subtraction is backwards, causing users in UTC+ timezones to get the wrong date.

**Fix:**
```js
// Before
const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

// After
const iso = [
  d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0'),
].join('-');
```

---

### 3. SM2 Difficult Card Detection (data.js ~lines 87–94)

The current logic only marks a card `difficult` when `interval === 1 && repetitions === 0`. Cards already in circulation that get low ratings are silently skipped.

**Fix:** Remove the `interval/repetitions` guard — base it purely on low rating:
```js
// Before
if (st.lastRating && st.lastRating <= 2 && st.status !== 'difficult') {
  if (st.interval === 1 && st.repetitions === 0 && st.lastReview) {
    st.status = 'difficult';
  }
}

// After
if (st.lastRating <= 2) {
  st.status = 'difficult';
}
```

---

### 4. localStorage Quota Exceeded (data.js ~line 33)

`localStorage.setItem()` throws a `QuotaExceededError` DOMException when storage is full. There is no try-catch, so large libraries silently fail to save.

**Fix:**
```js
static save(key, val) {
  try {
    localStorage.setItem(Data.prefix + key, JSON.stringify(val));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded — data not saved');
      // optionally show a toast to the user
    }
  }
}
```

---

### 5. FileReader Event Handler Order (SettingsModal.jsx ~lines 22–40)

`reader.readAsText(file)` is called before `reader.onload` is assigned. In some environments the load can complete synchronously before the handler is registered.

**Fix:** Always assign the handler before calling `readAsText`:
```js
const reader = new FileReader();
reader.onload = (ev) => { /* handle */ };
reader.readAsText(file);  // call last
```

---

## Architecture Improvements

### 6. Prop Drilling → Context or Zustand

All state lives in `App.jsx` and is drilled 3–4 levels deep. Add a `StudyContext` or use a small library like Zustand to eliminate passing `subjects`, `topics`, `subTopics`, `settings`, `history`, and `streak` through every component.

```jsx
// src/context/StudyContext.jsx
const StudyContext = React.createContext(null);
export const useStudy = () => React.useContext(StudyContext);
```

---

### 7. Add React Router for URL-Based Navigation

Currently a tab variable drives "routing". Users cannot bookmark a page, use the browser back button, or share a deep link.

```bash
npm install react-router-dom
```

Map views to paths: `/` (dashboard), `/review`, `/add`, `/browse`, `/stats`.

---

### 8. Remove Dead Code (remoteData.js)

`/src/lib/remoteData.js` defines a full API client that is never called anywhere. Either wire it up or delete it. Dead code misleads future contributors.

---

### 9. Add an Error Boundary

Any unhandled render error crashes the entire app. Add a top-level error boundary:

```jsx
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    return this.state.error
      ? <div>Something went wrong. <button onClick={() => this.setState({ error: null })}>Retry</button></div>
      : this.props.children;
  }
}
```

Wrap `<App />` in `main.jsx`.

---

## Performance Improvements

### 10. Memoize Components

None of the components use `React.memo`, `useMemo`, or `useCallback`. Every parent state change re-renders the entire tree, causing noticeable lag with 100+ cards.

**Priority targets:**
- `Browse.jsx` — filters and maps every card list on each render
- `Stats.jsx` — 90-day heatmap recalculated every render
- `Dashboard.jsx` — computes due cards inline every render

```jsx
const Browse = React.memo(({ ... }) => { ... });
```

---

### 11. Index Subjects/Topics by ID (Browse.jsx ~lines 212–213)

Inside a `.map()`, `.find()` is called on `subjects` and `topics` arrays for each card — O(n²) overall.

**Fix:** Build lookup maps once:
```js
const subjectMap = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s])), [subjects]);
const topicMap   = useMemo(() => Object.fromEntries(topics.map(t => [t.id, t])), [topics]);
```

---

### 12. Debounce Search Input (Browse.jsx)

The search filter runs synchronously on every keystroke. With 500+ cards this causes jank.

```js
import { useDeferredValue } from 'react';

const deferredSearch = useDeferredValue(searchTerm);
const filtered = useMemo(() => cards.filter(...), [cards, deferredSearch]);
```

---

### 13. Virtualize Long Card Lists

For libraries with 500+ cards, render only visible rows with `react-window` or `react-virtual`:

```bash
npm install react-window
```

---

## UX Improvements

### 14. Replace `confirm()` and `alert()` with Custom Modals

Native browser dialogs (used in AddContent.jsx and Browse.jsx) block the thread, look inconsistent, and break the custom dark theme.

Build a reusable `<ConfirmModal>` that matches the glassmorphism design and shows inline within the app.

---

### 15. Keyboard Shortcuts Help Overlay

Keyboard shortcuts exist (1–4 to rate, Space to flip card) but are completely undocumented. Add a `?` button or `Shift+?` shortcut that opens a help modal listing all shortcuts.

---

### 16. Toast Notifications

After operations like importing data, deleting subjects, or merging cards, there is no feedback. Add a lightweight toast system (e.g. `react-hot-toast`) instead of relying on browser `alert()`.

```bash
npm install react-hot-toast
```

---

### 17. Dark/Light Mode Toggle

The app is permanently dark. Add a system-preference-aware theme toggle using Tailwind's `darkMode: 'class'` and a `<html class="dark">` toggle.

---

### 18. PWA Support (Offline-First)

Add a `manifest.json` and a Vite PWA plugin so users can install the app and use it offline:

```bash
npm install -D vite-plugin-pwa
```

This also enables push notifications for review reminders.

---

### 19. Study Reminders / Notifications

There is no way to remind users to review due cards. Use the Notifications API + service worker to send a browser notification when due cards exist.

---

## Accessibility Improvements

### 20. Add ARIA Labels to All Interactive Elements

None of the icon-only buttons have `aria-label`. Screen readers will announce them as empty.

```jsx
// Before
<button onClick={toggle}><ChevronDown /></button>

// After
<button onClick={toggle} aria-label="Expand section"><ChevronDown /></button>
```

---

### 21. Use Semantic HTML

Many clickable elements use `<div onClick>` instead of `<button>`. This breaks keyboard navigation (Tab + Enter) and screen reader announcements. Replace `<div onClick>` with `<button type="button">`.

---

### 22. Trap Focus in Modals

When a modal is open, focus must stay inside it. Use `focus-trap-react` or implement a manual trap with `Tab`/`Shift+Tab` key handlers:

```bash
npm install focus-trap-react
```

---

### 23. Escape Key for All Overlays

`DatePicker.jsx` handles click-outside but not keyboard `Escape`. All modals and dropdowns should close on `Escape`:

```js
useEffect(() => {
  const handler = (e) => { if (e.key === 'Escape') onClose(); };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [onClose]);
```

---

### 24. Non-Color Indicators for Status Badges

Difficult/Learning/Mastered badges use color only. Add icons or text labels so colorblind users can distinguish them:

```jsx
// Before
<span className="badge-difficult">Difficult</span>

// After
<span className="badge-difficult"><AlertTriangle size={12} /> Difficult</span>
```

---

## Security Improvements

### 25. Validate JSON Imports (SettingsModal.jsx ~line 29)

Imported backup files are parsed and applied without any structure or size validation. A malicious file can inject arbitrary data into state.

**Fix:**
```js
const validate = (data) => {
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid format');
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (JSON.stringify(data).length > MAX_SIZE) throw new Error('File too large');
  // validate required keys exist and have expected types
  if (!Array.isArray(data.subjects)) throw new Error('Missing subjects');
};
```

---

### 26. Add File Size and Type Limits (SettingsModal.jsx)

```js
const file = e.target.files[0];
if (!file) return;
if (file.size > 5 * 1024 * 1024) { alert('File exceeds 5 MB limit'); return; }
if (!file.name.endsWith('.json')) { alert('Only .json files accepted'); return; }
```

---

### 27. Add Authentication to Backend API (api/userData.js)

The GET and POST endpoints accept any `userId` from query params/body with no verification. Anyone who knows or guesses a userId can read or overwrite that user's data.

**Fix:** At minimum, use a secret token or session cookie. For production: integrate a proper auth provider (Clerk, Supabase Auth, Firebase Auth).

---

### 28. Sanitize Data Received from API

If the `remoteData.js` API is ever wired up, ensure responses are sanitized before being written to state. Never render raw API strings as HTML (use `innerText` / JSX text nodes, not `dangerouslySetInnerHTML`).

---

## Missing Features Worth Adding

| Feature | Priority | Notes |
|---------|----------|-------|
| Multi-device sync (RemoteData) | High | API skeleton exists in `remoteData.js`; needs wiring |
| User authentication | High | Required for sync; use Clerk or Supabase |
| Push review reminders | Medium | Use PWA Notifications API |
| Anki deck export | Medium | Useful for portability |
| Image/audio cards | Medium | For map-based and audio UPSC questions |
| Export stats to PDF/CSV | Low | Analytics sharing |
| Undo/Redo for card edits | Low | Accidental deletion recovery |
| Collaborative study groups | Low | Share decks between users |
| Study goals / targets | Low | Daily new card targets, weekly hours |
| Multiple review algorithms | Low | Offer FSRS alongside SM2 |

---

## File-Level Summary

| File | Issue Count | Top Issues |
|------|-------------|-----------|
| `App.jsx` | 2 | Streak bug, prop drilling |
| `src/lib/data.js` | 3 | SM2 flaw, quota error, no validation |
| `src/lib/remoteData.js` | 1 | Entirely dead code |
| `src/components/DatePicker.jsx` | 2 | Timezone bug, missing Escape key |
| `src/components/SettingsModal.jsx` | 3 | FileReader order, no import validation, no size limit |
| `src/components/Browse.jsx` | 3 | O(n²) lookup, no debounce, native confirm() |
| `src/components/AddContent.jsx` | 1 | native confirm()/alert() |
| `src/components/Review.jsx` | 1 | Undocumented keyboard shortcuts |
| `src/components/Stats.jsx` | 2 | No memoization, color-only badges |
| `api/userData.js` | 2 | No auth, no input validation |
| All components | 4 | No ARIA labels, no error boundary, no semantic HTML, no focus trap |

---

## Prioritized Action Plan

### Sprint 1 — Correctness (fix bugs, don't break users)
- [ ] Fix streak `Math.ceil` → `Math.floor` (App.jsx)
- [ ] Fix DatePicker timezone calculation
- [ ] Fix SM2 difficult card detection (data.js)
- [ ] Wrap `localStorage.setItem` in try-catch
- [ ] Fix FileReader handler order (SettingsModal.jsx)

### Sprint 2 — Safety & Quality
- [ ] Add Error Boundary in main.jsx
- [ ] Add JSON import validation + file size/type limit
- [ ] Replace `confirm()`/`alert()` with custom modal
- [ ] Add Escape key handler to all overlays
- [ ] Remove or integrate remoteData.js dead code

### Sprint 3 — Performance
- [ ] Wrap Browse, Stats, Dashboard in `React.memo`
- [ ] Add `useMemo` for subject/topic lookup maps
- [ ] Debounce search input in Browse with `useDeferredValue`
- [ ] Lazy-load SettingsModal and Stats component

### Sprint 4 — Accessibility
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Replace `<div onClick>` with `<button type="button">`
- [ ] Add focus trap to modals
- [ ] Add non-color indicators to status badges
- [ ] Add skip-to-main link

### Sprint 5 — Features
- [ ] Add React Router for URL navigation
- [ ] Wire up RemoteData API + add authentication
- [ ] Add PWA manifest + service worker
- [ ] Add review reminder notifications
- [ ] Add keyboard shortcuts help overlay
