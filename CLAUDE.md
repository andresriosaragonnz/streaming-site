Project Context & Architecture Guidelines (CLAUDE.md)

1. Project Objective & Core Architectural Vision

This project is a high-performance, lightweight video streaming and portfolio platform built with a strict zero-bloat / minimal dependency philosophy.

Core Tech Stack Constraints

HTML/JSX Rendering: @kitajs/html (Kita.js) for type-safe, ultra-fast JSX-to-HTML template rendering.

Minimal Dependencies: WE DO NOT LIKE DEPENDENCIES. Avoid introducing third-party packages, dynamic npm libraries, or runtime abstractions unless strictly necessary. Rely on native Web APIs, clean TypeScript, and modern standard DOM primitives.

State & DOM Delegation: Custom lightweight DOM binding and event delegation engine (binder.ts).

2. Infrastructure & Video Streaming Flow

Storage & Distribution: Video assets are hosted on Cloudflare R2 located across a separate Cloudflare account.

Streaming Architecture: Direct delivery from R2 buckets via custom domain / proxy routing to handle secure, low-latency streaming without unnecessary server-side processing overhead.

3. Segment Lifecycle, Visibility & Public Filtering

Segment Statuses & Manual Workflow

Manual Status Control: Artists and admins explicitly manage segment visibility statuses (e.g., draft, private, public, or unlisted state) per video segment/track.

Public Filtering Rule: Playlists, public artist portfolio pages, and public API feeds MUST ONLY render segments marked with public visibility status.

Internal / Preview Overrides: Non-public segments are strictly filtered out at the query and store levels prior to DOM serialization, except in authenticated management drawers.

4. UI Architecture & Reactive Event Delegation (binder.ts)

Zero-Framework Reactivity Pattern

We do not use React, Vue, or heavy reactive framework runtimes. Instead, state binding and action handling are controlled centrally through binder.ts:

Single Pass DOM Sync: Reactive DOM updates occur in a batched requestAnimationFrame loop via UI.sync().

Data Binding Attributes (data-bind-\*):

data-bind-text

data-bind-value

data-bind-checked

data-bind-class

data-bind-show

data-bind-href

data-bind-src

data-bind-poster

Global Action Delegation (data-action): Elements use data-action="action-name" and are caught by single top-level event delegation listeners on the document (click, change, input).

Custom Event Triggers: Store changes dispatch native custom events (e.g., player-track-changed, graph-state-changed) which trigger UI.requestSync().

5. Audit Tasks for OpenCode / Claude CLI

When running static analysis, code audit, or refactoring passes on this codebase, prioritize the following goals:

Dead & Duplicated Code Detection:

Scan for duplicate event handlers between binder.ts action handlers and inline script event listeners (e.g., document.addEventListener("click", ...)).

Locate orphaned UI actions or store methods that are defined but never bound via data-action or custom window events.

Highlight redundant video playback or network graph calculations that can be unified.

Dependency Audit:

Identify any installed or imported packages that can be replaced with standard Web APIs or Kita.js templates.

Segment Visibility Enforcement Audit:

Verify that every public route and playlist builder strictly guards data fetching/rendering against non-public segment statuses.

DOM & Memory Performance:

Ensure custom events are properly cleaned up and DOM manipulation never causes layout thrashing outside UI.sync().

eof

### Summary of Added File

- Created `CLAUDE.md` tailored specifically for OpenCode / Claude CLI audits.
- Outlined your video hosting pipeline (Cloudflare R2 cross-account setup), manual segment status workflow, and strict public segment filtering logic.
- Documented your zero-dependency architecture using **Kita.js** and **`binder.ts`** event delegation.
- Defined clear execution tasks for OpenCode to identify duplicate listeners, dead code, and unnecessary packages.
