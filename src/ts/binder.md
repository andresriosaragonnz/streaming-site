# Binder Architecture Specification

Binder is a zero-dependency, CSP-compliant, event-delegated reactivity layer for SSR applications (Hono, KitaJS TSX). It decouples state logic from DOM operations using HTML attributes, Proxy stores, and batched DOM updates.

---

## 1. Core Principles

- **Strict CSP Compliance:** No inline JS execution strings (`onclick="..."`, `oninput="..."`).
- **Root Event Delegation:** Exactly two global event listeners (`click` and `input`) attached to `document`.
- **Zero Component Overhead:** No Virtual DOM, reconciliation diffing, or component re-renders.
- **Store-DOM Decoupling:** Stores hold no DOM references (`getElementById` or `querySelector`). DOM reactivity is declared in TSX.
- **Batching via `requestAnimationFrame`:** Multiple state mutations in a single frame trigger only one DOM update pass.

---

## 2. Declarative Attribute Directives

### Action Directives (Event Delegation)

Triggers dispatch user intents to stores via `data-action`.

| Directive                           | Purpose                           | Example                                                              |
| :---------------------------------- | :-------------------------------- | :------------------------------------------------------------------- |
| `data-action="select-segment"`      | Dispatches segment selection      | `<div data-action="select-segment" data-index="0">`                  |
| `data-action="toggle-track-status"` | Toggles public/private status     | `<button data-action="toggle-track-status">`                         |
| `data-action="sync-track-title"`    | Captures input events for titling | `<input data-action="sync-track-title">`                             |
| `data-action="open-modal"`          | Opens target modal container      | `<button data-action="open-modal" data-modal-id="commit-modal">`     |
| `data-action="close-modal"`         | Closes target modal container     | `<div data-action="close-modal" data-modal-id="commit-modal">`       |
| `data-action="toggle-drawer"`       | Toggles drawer visibility         | `<button data-action="toggle-drawer" data-drawer-id="graph-drawer">` |
| `data-action="reset-graph"`         | Resets canvas node state          | `<button data-action="reset-graph">`                                 |

---

### Binding Directives (DOM State Synchronization)

Reflect store state to HTML elements during `UI.sync()`.

| Directive                | Target Element Attribute           | Example                                                                                      |
| :----------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------- |
| `data-bind-text`         | `textContent`                      | `<span data-bind-text="review.active.title">`                                                |
| `data-bind-value`        | `value` (Form inputs)              | `<input data-bind-value="review.active.title">`                                              |
| `data-bind-show`         | `style.display` (`flex` vs `none`) | `<div data-bind-show="Boolean(review.activeNodeLink)">`                                      |
| `data-bind-href`         | `href` (Anchor elements)           | `<a data-bind-href="review.activeNodeLink \|\| ''">`                                         |
| `data-bind-class`        | Toggle specific CSS classes        | `<button data-bind-class="review.isCurrentPublic ? 'btn-public-green' : 'btn-private-red'">` |
| `data-bind-active-class` | Toggles `.item-active-highlight`   | `<div data-bind-active-class="player.currentIndex === 0 ? 'active' : ''">`                   |

---

## 3. Data Flow Architecture

1. **User Interaction:** User clicks an element or types into an input field.
2. **Event Delegation:** `UI.handleGlobalClick` or `UI.handleGlobalInput` catches the event at the `document` root level.
3. **Action Parsing:** `UI.parseActionPayload` extracts the dataset parameters (`data-action`, `data-index`, `data-modal-id`).
4. **Store Proxy Mutation:** The action handler updates state properties on the target Proxy store (e.g., `reviewStore.toggleStatus(index)`).
5. **Custom Event Dispatch:** Store mutation triggers `window.dispatchEvent("review-state-changed")`.
6. **Batched Render Loop:** `UI.requestSync` schedules execution via `requestAnimationFrame` to batch rapid consecutive events.
7. **Single-Pass DOM Sync:** `UI.sync` queries all `[data-bind-*]` elements, evaluates state context expressions, and updates changed DOM nodes in place.

---

## 4. Implementation Example

### A. Store Definition (`stores/reviewStore.ts`)

```typescript
export function createReviewStore(initialTracks = []) {
  const rawState = { tracks: initialTracks, activeNodeLink: "" };

  const notify = () =>
    window.dispatchEvent(new CustomEvent("review-state-changed"));

  const state = new Proxy(rawState, {
    set(target, prop, value) {
      (target as any)[prop] = value;
      notify();
      return true;
    },
  });

  return {
    state,
    toggleStatus(index: number) {
      if (!state.tracks[index]) return;
      state.tracks[index].isPublic = !state.tracks[index].isPublic;
      notify();
    },
  };
}
```
