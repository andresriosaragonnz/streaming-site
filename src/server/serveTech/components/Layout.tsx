import type { HeaderProps } from "../types";

export function AppHeader({
  title = "ArchFlow Engine",
  version = "v1.0 KitaJS",
  activeScene = "fragmentation",
}: HeaderProps) {
  return (
    <header class="app-header">
      <div class="brand-title">
        <span>{title}</span>
        <span class="brand-badge">{version}</span>
      </div>

      <nav class="scene-nav">
        <button
          class={`nav-btn ${activeScene === "fragmentation" ? "active" : ""}`}
          onclick="loadScene('fragmentation')"
        >
          1. MP4 Slicing
        </button>
        <button
          class={`nav-btn ${activeScene === "pipeline" ? "active" : ""}`}
          onclick="loadScene('pipeline')"
        >
          2. Full Site Pipeline
        </button>
        <button
          class={`nav-btn ${activeScene === "cacheFlow" ? "active" : ""}`}
          onclick="loadScene('cacheFlow')"
        >
          3. Cache Branching
        </button>
        <button class="nav-btn" onclick="loadScene('artistApproval')">
          4. Artist Approval
        </button>
      </nav>
    </header>
  );
}

export function ControlBar() {
  return (
    <div class="control-bar">
      <div class="control-group">
        <button class="control-btn primary" onclick="runNextStep()">
          <span>Play Next Step</span> ►
        </button>
        <button class="control-btn" onclick="resetCurrentScene()">
          Reset
        </button>
      </div>

      <div class="step-indicator" id="stepCounter">
        Step: 0 / 0
      </div>
    </div>
  );
}

export function SidePanel() {
  return (
    <aside class="side-panel">
      <div class="panel-header">
        <span>Framework Inspector</span>
        <span id="currentSceneName" class="scene-name-highlight">
          MP4 Slicing
        </span>
      </div>

      <div class="panel-body">
        <div class="info-card">
          <div class="info-title" id="stepTitle">
            Ready to animate
          </div>
          <div class="info-desc" id="stepDescription">
            Click "Play Next Step" to trigger the sequence step by step.
          </div>
        </div>

        <div>
          <div class="code-label">EQUAL CODE DEFINITION:</div>
          <div class="code-block" id="codeDisplay">
            // Scene code configuration will appear here
          </div>
        </div>
      </div>
    </aside>
  );
}
