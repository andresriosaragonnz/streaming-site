/* ==========================================================================
   ARCHFLOW ENGINE (PURE RUNTIME)
   Stateless 2D architecture animation engine driven by JSON specs.
   ========================================================================== */

class ArchFlowEngine {
  constructor(stageId = "stage", svgId = "svgLayer") {
    this.stage = document.getElementById(stageId);
    this.svg = document.getElementById(svgId);
    this.nodes = new Map();
    this.connections = [];
    this.steps = [];
    this.currentStepIndex = 0;
    this.isExecuting = false;

    if (!this.stage || !this.svg) {
      console.warn("ArchFlowEngine: Stage or SVG container missing.");
      return;
    }

    window.addEventListener("resize", () => this.updateConnections());
    this.scanDOMNodes();
  }

  scanDOMNodes() {
    const existingNodes = this.stage.querySelectorAll(".arch-node");
    existingNodes.forEach((el) => {
      const id = el.id.replace("node-", "");
      this.nodes.set(id, { id, el });
    });
  }

  clear() {
    if (!this.stage || !this.svg) return;
    this.stage.querySelectorAll(".arch-node").forEach((el) => el.remove());
    this.stage
      .querySelectorAll(".packet-particle")
      .forEach((el) => el.remove());
    this.svg.innerHTML = "";
    this.nodes.clear();
    this.connections = [];
    this.steps = [];
    this.currentStepIndex = 0;
    this.isExecuting = false;
  }

  loadSceneConfig(config) {
    this.clear();

    if (!config) return;

    if (config.nodes) {
      config.nodes.forEach((node) => this.addNode(node));
    }

    if (config.connections) {
      config.connections.forEach((conn) =>
        this.connect(conn.from, conn.to, conn.class || ""),
      );
    }

    if (config.steps) {
      this.steps = config.steps;
    }

    this.updateUI();
  }

  addNode(node) {
    let el = document.getElementById(`node-${node.id}`);

    if (!el) {
      el = document.createElement("div");
      el.className = "arch-node";
      el.id = `node-${node.id}`;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;

      el.innerHTML = `
        <div class="arch-node-header">
          <span class="arch-node-title">${node.title}</span>
          ${node.badge ? `<span class="arch-node-badge">${node.badge}</span>` : ""}
        </div>
        ${node.subtitle ? `<div class="arch-node-subtitle">${node.subtitle}</div>` : ""}
        ${node.html ? `<div class="node-content-box">${node.html}</div>` : ""}
      `;

      this.stage.appendChild(el);
    }

    this.nodes.set(node.id, { id: node.id, config: node, el });
    return this;
  }

  connect(fromId, toId, colorClass = "") {
    const id = `conn-${fromId}-${toId}`;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", id);
    path.setAttribute("class", `connector-line ${colorClass}`);
    this.svg.appendChild(path);

    this.connections.push({ id, fromId, toId, path, colorClass });
    this.updateConnections();
    return this;
  }

  updateConnections() {
    if (!this.stage) return;
    const stageRect = this.stage.getBoundingClientRect();

    this.connections.forEach((conn) => {
      const fromNode = this.nodes.get(conn.fromId);
      const toNode = this.nodes.get(conn.toId);
      if (!fromNode || !toNode) return;

      const r1 = fromNode.el.getBoundingClientRect();
      const r2 = toNode.el.getBoundingClientRect();

      const x1 = r1.left + r1.width / 2 - stageRect.left;
      const y1 = r1.top + r1.height / 2 - stageRect.top;
      const x2 = r2.left + r2.width / 2 - stageRect.left;
      const y2 = r2.top + r2.height / 2 - stageRect.top;

      const dx = Math.abs(x2 - x1) * 0.5;
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      conn.path.setAttribute("d", d);
    });
  }

  emitPacket(fromId, toId, color = "cyan", duration = 800) {
    return new Promise((resolve) => {
      const fromNode = this.nodes.get(fromId);
      const toNode = this.nodes.get(toId);
      if (!fromNode || !toNode) return resolve();

      const stageRect = this.stage.getBoundingClientRect();
      const r1 = fromNode.el.getBoundingClientRect();
      const r2 = toNode.el.getBoundingClientRect();

      const startX = r1.left + r1.width / 2 - stageRect.left;
      const startY = r1.top + r1.height / 2 - stageRect.top;
      const endX = r2.left + r2.width / 2 - stageRect.left;
      const endY = r2.top + r2.height / 2 - stageRect.top;

      const particle = document.createElement("div");
      particle.className = `packet-particle ${color}`;
      this.stage.appendChild(particle);

      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (endX - startX) * ease;
        const currentY = startY + (endY - startY) * ease;

        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  setNodeState(id, state) {
    const node = this.nodes.get(id);
    if (!node) return;
    node.el.classList.remove(
      "state-active",
      "state-processing",
      "state-success",
      "state-dimmed",
    );
    if (state) node.el.classList.add(`state-${state}`);
  }

  /* ==========================================================================
     ACTION HANDLERS REGISTRY MAP
     ========================================================================== */
  actionHandlers = {
    emit: async (engine, action) => {
      if (action.state) engine.setNodeState(action.from, action.state);
      await engine.emitPacket(action.from, action.to, action.color || "cyan");
      if (action.targetState)
        engine.setNodeState(action.to, action.targetState);
    },

    emitParallel: async (engine, action) => {
      await Promise.all(
        action.packets.map((p) =>
          engine.emitPacket(p.from, p.to, p.color || "cyan"),
        ),
      );
      if (action.targetStates) {
        action.targetStates.forEach((s) => engine.setNodeState(s.id, s.state));
      }
    },

    fragmentGrid: async (engine, action) => {
      const card = document.getElementById(action.cardId);
      if (card) card.classList.add("fragmenting");

      for (let i = 0; i < action.count; i++) {
        await new Promise((r) => setTimeout(r, 80));
        const cell = document.getElementById(`${action.cellPrefix}-${i}`);
        if (cell) cell.classList.add("visible", "active");
        engine.emitPacket(action.from, action.to, "amber", 300);
      }
      if (action.targetState)
        engine.setNodeState(action.to, action.targetState);
    },

    approvalGrid: async (engine, action) => {
      if (action.state) engine.setNodeState(action.from, action.state);

      const indexes = Array.from({ length: action.count }, (_, i) => i);
      for (let i = indexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
      }
      const approvedIndexes = indexes.slice(0, action.approvedCount || 4);

      for (const idx of approvedIndexes) {
        await new Promise((r) => setTimeout(r, action.delay || 250));
        const item = document.getElementById(`${action.itemPrefix}-${idx}`);
        if (item) {
          item.classList.remove("status-red");
          item.classList.add("status-green");
          const trackSpan = item.querySelector("span:first-child");
          const trackTitle = trackSpan
            ? trackSpan.innerText
            : `Track #${idx + 1}`;
          item.innerHTML = `<span>${trackTitle}</span> <span>PUBLIC</span>`;
        }
        await engine.emitPacket(action.from, action.to, "green", 250);
      }

      if (action.targetState)
        engine.setNodeState(action.to, action.targetState);
    },

    generateGrid: async (engine, action) => {
      if (action.state) engine.setNodeState(action.from, action.state);

      const color = action.color || "cyan";
      const container = document.getElementById(action.containerId);

      for (let i = 0; i < action.count; i++) {
        await new Promise((r) => setTimeout(r, action.delay || 150));

        let item = document.getElementById(`${action.itemPrefix}-${i}`);
        if (!item && container) {
          item = document.createElement("div");
          item.id = `${action.itemPrefix}-${i}`;
          item.className = `generated-pill visible color-${color}`;
          item.innerText = `${action.labelPrefix || "Item"} #${i + 1}`;
          container.appendChild(item);
        } else if (item) {
          item.classList.add("visible", `color-${color}`);
        }

        if (action.from && action.to) {
          engine.emitPacket(action.from, action.to, color, 250);
        }
      }

      if (action.targetState)
        engine.setNodeState(action.to, action.targetState);
    },
  };

  async executeAction(action) {
    if (!action || !action.type) return;

    const handler = this.actionHandlers[action.type];
    if (handler) {
      await handler(this, action);
    } else {
      console.warn(
        `ArchFlowEngine: No registered handler for action type "${action.type}"`,
      );
    }
  }

  async runNextStep() {
    if (this.steps.length === 0 || this.isExecuting) return;

    if (this.currentStepIndex >= this.steps.length) {
      this.updateUI();
      return;
    }

    this.isExecuting = true;
    this.updateUI();

    const step = this.steps[this.currentStepIndex];
    this.updateInspector(
      step.title,
      step.description,
      JSON.stringify(step.action, null, 2),
    );

    await this.executeAction(step.action);

    this.currentStepIndex++;
    this.isExecuting = false;
    this.updateUI();

    if (step.autoAdvance && this.currentStepIndex < this.steps.length) {
      await new Promise((r) => setTimeout(r, 200));
      this.runNextStep();
    }
  }

  updateInspector(title, description, code) {
    const t = document.getElementById("stepTitle");
    const d = document.getElementById("stepDescription");
    const c = document.getElementById("codeDisplay");
    if (t) t.innerText = title || "";
    if (d) d.innerText = description || "";
    if (c) c.innerText = code || "";
  }

  updateCounter() {
    const counter = document.getElementById("stepCounter");
    if (counter) {
      counter.innerText = `Step: ${this.currentStepIndex} / ${this.steps.length}`;
    }
  }

  updateUI() {
    this.updateCounter();

    const playBtn = document.querySelector(".control-btn.primary");
    if (playBtn) {
      const isFinished = this.currentStepIndex >= this.steps.length;

      playBtn.disabled = this.isExecuting || isFinished;

      if (isFinished) {
        playBtn.innerHTML = "<span>Sequence Complete</span> ✓";
        playBtn.style.opacity = "0.5";
        playBtn.style.cursor = "not-allowed";
      } else if (this.isExecuting) {
        playBtn.innerHTML = "<span>Running...</span> ⏳";
        playBtn.style.opacity = "0.7";
      } else {
        playBtn.innerHTML = "<span>Play Next Step</span> ►";
        playBtn.style.opacity = "1";
        playBtn.style.cursor = "pointer";
      }
    }

    if (this.steps[this.currentStepIndex]) {
      const step = this.steps[this.currentStepIndex];
      this.updateInspector(
        step.title,
        step.description,
        JSON.stringify(step.action, null, 2),
      );
    }
  }
}

/* ==========================================================================
   GLOBAL RUNTIME BOOTSTRAP
   ========================================================================== */

window.archEngine = null;

window.runNextStep = function () {
  if (window.archEngine) {
    window.archEngine.runNextStep();
  }
};

window.resetCurrentScene = function () {
  if (
    window.archEngine &&
    window.CURRENT_SCENE_KEY &&
    typeof window.loadScene === "function"
  ) {
    window.loadScene(window.CURRENT_SCENE_KEY);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.archEngine = new ArchFlowEngine("stage", "svgLayer");

  requestAnimationFrame(() => {
    const initialScene =
      window.PENDING_SCENE || window.CURRENT_SCENE_KEY || "fragmentation";
    if (typeof window.loadScene === "function") {
      window.loadScene(initialScene);
    }
  });
});
