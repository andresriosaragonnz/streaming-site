# CSS Architecture & Best Practices

This document describes how the stylesheet system is organized, why the current
structure exists, and the rules to follow when adding or refactoring CSS.

The short version: **author in `src/css/`, build into `public/css/`, and keep
every class owned by exactly one layer.**

---

## For agents: read this before changing styles

1. Open `src/css/settings/_variables.css` first if the change involves colour,
   borders, surfaces, or shadows.
2. Decide the owner layer (section 7): tokens → reset → grids → components →
   utilities. If an existing class already owns the responsibility, extend it.
3. Hard rules live in section 4; anti-patterns with codebase examples live in
   section 8. The most common failures:
   - editing `public/css/*.css` instead of `src/css/*.css`
   - redefining a selector in a second file instead of adding a modifier
   - inline `style="…"` for layout instead of `u-*` or a component class
   - adding `.hidden` or another hide mechanism instead of `.is-hidden`
   - raw hex/rgba colours instead of tokens
   - a new `!important` without a written reason
4. After editing, run and fix:
   ```bash
   bun run pages:build
   bun run css:check
   bunx tsc --noEmit
   ```
5. Do not commit unless the user has reviewed the diff and approved.

Section 9 is the review checklist; use it as the definition of done.

---

## 1. Build pipeline

```
src/css/*.css
    │  flattened by src/css/css.ts (resolves @import recursively)
    │  minified by lightningcss
    ▼
public/css/app.css
public/css/main.css
public/css/review-studio.css
public/css/status.css
```

- Run `bun run pages:build` after any CSS or template change.
  It also recompiles the client JS bundles.
- **Never edit `public/css/*.css` directly.** Those are generated artifacts.
- `public/css/archflow.css` is the one intentional exception: the `/tech`
  visualization is a separate, hand-authored sub-application with its own
  palette. It does not participate in this layer system.
- Run `bun run css:check` to compare classes used in templates against classes
  defined in the compiled CSS.

---

## 2. Layers

Imports must flow in one direction:

```
settings/_variables.css     design tokens (custom properties)
        ↓
base/_reset.css             element defaults + document shell
        ↓
layout/_grids.css           page scaffolding and grids
        ↓
components/*.css            menus, cards, player, dialogs, controls…
        ↓
utilities/*.css             .is-hidden, .u-* helpers
```

A lower layer must never import or style an upper-layer concern:

- Tokens may be referenced anywhere.
- A component may use tokens and layout primitives.
- A utility must be generic and single-purpose; it must not style a component.
- Utilities are imported last so they can win when used as intentional overrides.

### Why layers matter

The layer order makes the cascade predictable. When a rule does not apply, you
know where to look: either the selector does not match, or a later layer owns
that property. You should never need to search for “the last definition of this
class” because there is only one.

---

## 3. Entry points

Every page loads `app.css` plus at most one page layer. Pages that need the
interactive player/studio stack load `review-studio.css` as well.

| Entry | Responsibility | Typical pages |
|---|---|---|
| `app.css` | tokens, reset, grids, hero, typography, cards, menu, toast, utilities | every page |
| `main.css` | public graph drawer | public portfolio, claim, pending, dashboard, playlist portfolio |
| `review-studio.css` | carousel/sidebar, controls, dialog, player, delete button | private performance, playlist, public performance |
| `status.css` | standalone status page (imports the token file) | `/status` |
| `archflow.css` | separate `/tech` visualization | `/tech` |

Templates link them as:

```html
<link rel="stylesheet" href="/css/app.css?v=2" />
<link rel="stylesheet" href="/css/main.css?v=2" />
```

Keep `?v=2` (or bump it) so browsers do not reuse stale CSS across deploys.
If cached HTML can outlive a deploy, purge the edge cache before relying on the
new entry split.

### Why not two full bundles?

The previous setup compiled the same ten partials into both `main.css` and
`review-studio.css`. Pages that loaded both downloaded the shared rules twice,
and the cascade evaluated the same selectors twice. Extracting the shared base
removed that duplication:

- before: both-bundle page ≈ 49 KB
- after: `app.css` + both page layers ≈ 29.6 KB (−40%)
- main-only page: ≈ 21.5 KB → 14.2 KB
- duplicate selectors: 16 → 0

---

## 4. Core rules

### 4.1 One owner per class

A class must be defined in exactly one component file, exactly once per media
context. If a screen needs a variation, add a modifier or a state class — do not
redefine the same block later in another file.

`src/css/components/_player.css` owns `.performance-heading` and
`.performance-heading-container`; `src/css/components/_dialog.css` owns
`.status-tag`. A larger title is `.performance-heading-big`; a coloured status is
`.status-tag-public` or `.status-tag-private` — never a second
`.performance-heading` or `.status-tag` block.

```css
/* good — _player.css owns the block and its modifier */
.performance-heading { … }
.performance-heading-big { … }

/* bad — two files define .status-tag; the winner depends on import order */
.status-tag { padding: 2px 8px; }        /* _PrivatePlayerControls.css */
.status-tag { padding: .25rem .6rem; }   /* _dialog.css */
```

When merging legacy duplicate blocks, use the **effective per-property winner**.
CSS resolves property by property, not block by block. The real `.status-tag`
merge in `_dialog.css`:

```css
/* before: both partials defined .status-tag */
/* _PrivatePlayerControls.css */ .status-tag { padding: 2px 8px; font-family: monospace; }
/* _dialog.css               */ .status-tag { padding: .25rem .6rem; letter-spacing: .05em; }

/* after: one owner keeps both files' non-conflicting properties and the
   later declaration for the properties they shared */
.status-tag {
  font-family: monospace;
  padding: .25rem .6rem;
  letter-spacing: .05em;
}
```

### 4.2 Variants, states, and utilities are different tools

| Kind | Purpose | Convention | Example |
|---|---|---|---|
| Base | shared skeleton | plain class | `.btn` |
| Variant | permanent alternative | modifier class | `.btn-public`, `.btn-modal-cancel` |
| State | changes at runtime | `is-*` / `has-*` | `.is-hidden`, `.is-loading` |
| Utility | tiny global helper | `u-*` | `.u-row`, `.u-gap-sm` |

Do not encode state in a component-specific class when a single state class
will do. In practice: `.btn` + `.btn-status` + `.btn-public-green` is a base
plus modifiers (`PrivatePlayerControls.tsx`); `.is-hidden` is toggled by
`binder.ts` and `actions.ts`; `u-flex u-row u-gap-sm` lays out the playlist
header in `PlaylistViewPlayer.tsx`.

### 4.3 Buttons share a base

All real buttons compose `.btn` with a modifier:

```html
<button class="btn btn-status btn-public-green">Public</button>
<button class="btn btn-modal btn-modal-confirm">Confirm</button>
```

The first comes from `src/server/servePrivatePerformance/PrivatePlayerControls.tsx`,
the second from `CommitModal.tsx`. `.btn` owns `cursor`, `border-radius`, font
inheritance, text decoration, and the shared transition. Modifiers only add what
makes them different: colour, padding, width, typography.

`.back-link` is a navigation link, not a button — do not give it `.btn`. It is
used by `ClaimHero.tsx` and `PrivateDashboardHero.tsx`.

### 4.4 One visibility primitive

Use `.is-hidden` for runtime hiding:

```html
<div class="custom-playlist-group is-hidden">…</div>
```

`src/ts/actions.ts` adds/removes that class on `.custom-playlist-group`; the
server renders it through `data-bind-class` on the commit button in
`PrivatePlayerControls.tsx`:

```html
<button
  class="btn btn-status btn-public-green"
  data-bind-class="{ 'is-hidden': !review.hasUncommittedChanges }"
>
  Commit
</button>
```

Do not add a second `.hidden` class, and do not target inline styles with
selectors such as `[style*="display: none"]`. Prefer `data-bind-show`, which
toggles `.is-hidden` through `binder.ts`.

### 4.5 Use tokens, not raw colours

All palette values live in `settings/_variables.css`. Components reference
tokens:

```css
/* good — _dialog.css */
color: var(--text-muted);
background: var(--surface-translucent);

/* avoid */
color: #cacaca;
background: rgba(255, 255, 255, 0.05);
```

`#cacaca` and `rgba(255, 255, 255, 0.05)` are exactly what
`--text-muted` and `--surface-translucent` hold in `_variables.css`. Buttons use
`--accent-brand`; dialogs use `--bg-surface` and `--overlay-dark`; destructive
actions use `--bg-danger` (`_delete-button.css`).

If a value is genuinely new and reused, add a token. If it is a one-off
composition (for example a gradient), keep it local and document why.

### 4.6 Keep IDs for behaviour

IDs are JavaScript hooks. Style by class:

```css
/* good — _PrivatePlayerControls.css */
.btn-add-to-playlist { width: 100%; }

/* avoid */
#btn-add-to-playlist { width: 100%; }
```

IDs out-specify everything and are painful to override. A few ID selectors
remain where the ID is a genuine structural hook rather than a style target:
the menu's checkbox toggles (`#drawer-toggle:checked ~ .drawer-panel` in
`_menu.css`) and the graph drawer (`#graph-drawer-container.is-open` in
`_graph.css`). Do not add new styling IDs.

### 4.7 Prefer layout utilities over inline styles

Inline styles escape the cascade: they cannot be overridden by media queries
without `!important`, and they hide intent. Use the small utility set:

- `.u-flex`, `.u-col`, `.u-row`
- `.u-center`, `.u-start`
- `.u-full`, `.u-w-70`
- `.u-gap-sm` (8px), `.u-gap-md` (12px)
- `.u-link-reset`, `.u-cover`, `.u-bare`, `.u-pointer`

Example from `PlaylistViewPlayer.tsx`:

```html
<div class="u-flex u-row u-gap-sm">
  <a class="sidebar-artist-button">…</a>
  <div class="performance-heading break-hyphens">…</div>
  <button class="share-btn u-bare u-pointer">…</button>
</div>
```

The utilities are defined in `src/css/utilities/_layout.css`. Keep this set
small. If a pattern is genuinely a component, create a component class instead
of piling on utilities.

### 4.8 Avoid `!important`

The only acceptable uses are:

- state primitives that must win (`.is-hidden { display: none !important; }` in
  `_states.css`)
- a deliberate override (the `:hover` colours on `.btn-delete-icon` in
  `_delete-button.css`)
- mode toggles that must beat a component default
  (`.video-player-mock.is-audio-mode .audio-player-container` in `_player.css`)

If a new `!important` is needed, first check whether the real problem is layer
order or an over-specific selector.

### 4.9 Comments explain “why”

Use section banners and comments for intent, not for restating the code:

```css
/* Reserve the 16:9 box before metadata loads (CLS prevention) */
.video-player-mock {
  aspect-ratio: 16 / 9;
}
```

That comment heads `_player.css` and explains a real layout decision: the box
keeps its size before the poster or video metadata arrives.

---

## 5. Naming conventions

- Component blocks: `kebab-case` (`commit-segment-list`, `performance-heading`).
- Modifiers: suffix with a hyphenated qualifier (`download-button--stacked`).
- Elements: `__` when a sub-part is only meaningful inside a block
  (`download-button__label`).
- States: `is-*` (`is-hidden`, `is-loading`).
- Utilities: `u-*` (`u-cover`).
- Avoid class names that describe appearance instead of role
  (`big-red-box` → `error-panel`).
- Avoid abbreviations that are not already established
  (`perf-heading` → `performance-heading`).

Renamed for clarity during the restructure:

| Old | New |
|---|---|
| `.h3` | `.heading-3` |
| `.performance-title` | `.performance-heading` |
| `.performance-title-big` | `.performance-heading-big` |
| `.btn-back` | `.back-link` |

---

## 6. File responsibilities

```
src/css/
  app.css                    shared base entry
  main.css                   public page layer entry
  review-studio.css          interactive page layer entry
  status.css                 standalone status page entry
  css.ts                     flattener + minifier

  settings/_variables.css    tokens only

  base/_reset.css            reset, document shell, scrollbars

  layout/_grids.css          studio/player/performance grid scaffolding

  components/
    _hero.css                hero banners, back link
    _typography.css          headings, capitalization helper
    _cards.css               cards, card metadata, empty state, share button
    _menu.css                drawer, search, menu triggers
    _toast.css               toast notifications
    _graph.css               graph drawer (public layer)
    _carousel-sidebar.css    playlist sidebar / drag carousel (review layer)
    _controls.css            buttons, selects, download buttons (review layer)
    _PrivatePlayerControls.css  private inputs/status controls (review layer)
    _dialog.css              native <dialog> modals, APRA agreement
    _player.css              video/audio player, titles, playback overlay
    _delete-button.css       destructive button (review layer)

  utilities/
    _states.css              .is-hidden, .is-loading
    _layout.css              u-* helpers
```

---

## 7. Adding new CSS: step by step

1. Decide which layer owns the rule:
   - token → `settings/_variables.css`
   - element default → `base/_reset.css`
   - page scaffold → `layout/_grids.css`
   - reusable UI → `components/_*.css`
   - tiny global helper → `utilities/_*.css`
2. Check whether an existing class already owns that responsibility.
3. Prefer a modifier or state class over a new standalone class.
4. Use tokens for colours, borders, surfaces, and shadows.
5. If the class is only needed on review/player pages, add it to
   `review-studio.css` (or one of its partials). If every page needs it, add it
   to `app.css`.
6. Update the template if you add a new base/modifier composition
   (for example adding `btn` to a button).
7. Run:
   ```bash
   bun run pages:build
   bun run css:check
   bunx tsc --noEmit
   ```
8. If the change affects cached HTML, bump the stylesheet query version or
   purge the cache at deploy time.

---

## 8. Anti-patterns

| Anti-pattern | Why it hurts | Example in this codebase |
|---|---|---|
| Redefining a selector in a later file | Winner depends on import order | `.status-tag` was defined in both `_dialog.css` and `_PrivatePlayerControls.css`; it is now owned by `_dialog.css`, with `.status-tag-public` / `.status-tag-private` as modifiers |
| Styling by ID | Beats every class; hard to override | `.btn-add-to-playlist` sizes the control; the `id` remains only a JS hook. Structural hooks such as `#drawer-toggle:checked ~ .drawer-panel` are the exception, not the pattern |
| Inline `style="…"` for layout | Cannot respond to media queries; invisible to audits | `PlaylistViewPlayer.tsx` uses `u-flex u-row u-gap-sm`; `PrivateViewPlayer.tsx` uses `.performance-heading-container` instead of inline flex |
| Adding `.hidden` alongside `.is-hidden` | Two mechanisms for one state | `actions.ts` toggles `.is-hidden` on `.custom-playlist-group`; no `.hidden` rule exists in the compiled CSS |
| Per-button `cursor`/`border-radius` copies | Drift and inconsistency | `.btn-status`, `.btn-public-green`, `.btn-modal` only add colour, size, and padding; `.btn` owns the skeleton |
| Raw hex colours in components | Palette drift | `var(--text-muted)` replaced `#cacaca`; `var(--surface-translucent)` replaced `rgba(255, 255, 255, 0.05)` |
| `!important` to win a conflict | Masks layer/order problems | Acceptable in `_states.css` (`.is-hidden`) and the `.btn-delete-icon:hover` override; a new one needs a written reason |
| Importing shared partials into both entries | Double download and double cascade | Only `app.css` pulls `_variables`/`_reset`/`_grids`; page layers import their own components |
| Leaving unstyled template classes | UI looks broken or half-built | `scripts/css-check.ts` fails on a class such as a renamed `.heading-3` with no rule |

The inline-layout case, side by side:

```html
<!-- bad: layout escaped into the markup -->
<div style="display: flex; flex-direction: row; gap: 8px">

<!-- good: PlaylistViewPlayer.tsx -->
<div class="u-flex u-row u-gap-sm">
```

---

## 9. Review checklist

- [ ] Rule lives in the correct layer.
- [ ] Class has exactly one owner.
- [ ] No duplicate selector under the same media context.
- [ ] Colours use tokens.
- [ ] Visibility uses `.is-hidden`.
- [ ] Buttons compose `.btn`.
- [ ] No new inline layout styles.
- [ ] No new `!important` without a written reason.
- [ ] `bun run pages:build` succeeds.
- [ ] `bun run css:check` exits 0.
- [ ] `bunx tsc --noEmit` succeeds.
- [ ] Stylesheet query version bumped or cache purge planned when needed.

---

## 10. Safe migration order (for future passes)

If more consolidation is needed, use this order:

1. Measure and freeze the class-vs-markup baseline.
2. Merge duplicate selectors, preserving the effective winning declarations.
3. Extract or adjust the shared base.
4. Normalize buttons onto `.btn`.
5. Collapse visibility mechanisms into `.is-hidden` and add utilities.
6. Adopt tokens.
7. Sweep dead/missing classes and update the drift check.
8. Rename last — it touches both templates and CSS.

Deduplicating changes the cascade. When merging, keep the later/winning
declaration so rendering stays identical, then verify with the cascade check
and a visual pass on pages that load multiple layers.
