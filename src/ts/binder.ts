// =============================================================================
// Lightweight, Generic UI Binder Engine (No 'with' statement)
// =============================================================================

export type ActionHandler = (trigger: HTMLElement, event: MouseEvent) => void;

export class UI {
  private static handlers = new Map<string, ActionHandler>();
  private static registeredEvents = new Set<string>();
  private static stores = new Map<string, string>(); // storeName -> windowKey
  private static isScheduled = false;

  /**
   * Register custom action handlers modularly.
   */
  static registerAction(actionName: string, handler: ActionHandler): void {
    UI.handlers.set(actionName, handler);
  }

  /**
   * Register state update events dynamically without modifying the binder core.
   */
  static listenToEvents(...events: string[]): void {
    for (const event of events) {
      if (!UI.registeredEvents.has(event)) {
        UI.registeredEvents.add(event);
        window.addEventListener(event, UI.requestSync);
      }
    }
  }

  /**
   * Register global store namespaces dynamically for binder evaluation.
   */
  static registerStore(name: string, windowKey: string): void {
    UI.stores.set(name, windowKey);
  }

  /**
   * Evaluates expressions against registered store contexts strictly without 'with'.
   */
  private static evalExpr(expr: string, context: Record<string, any>): any {
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return ${expr};`);
      return fn(...values);
    } catch {
      return undefined;
    }
  }

  /**
   * Batches UI updates on the next animation frame to eliminate layout thrashing.
   */
  static requestSync(): void {
    if (UI.isScheduled) return;
    UI.isScheduled = true;
    requestAnimationFrame(() => {
      UI.sync();
      UI.isScheduled = false;
    });
  }

  /**
   * Pure reactive sync pass: Updates DOM text, inputs, attributes, and CSS classes.
   */
  static sync(): void {
    const ctx: Record<string, any> = {};
    UI.stores.forEach((windowKey, storeName) => {
      ctx[storeName] = (window as any)[windowKey] ?? {};
    });

    const elements = document.querySelectorAll<HTMLElement>(
      "[data-bind-text], [data-bind-value], [data-bind-class], [data-bind-href], [data-bind-aria-checked], [data-bind-src], [data-bind-poster]",
    );

    elements.forEach((el) => {
      const ds = el.dataset;

      // 1. Text Content
      if (ds.bindText) {
        const val = UI.evalExpr(ds.bindText, ctx);
        if (val !== undefined && el.textContent !== String(val)) {
          el.textContent = String(val);
        }
      }

      // 2. Form Inputs (Skip active inputs to preserve typing focus)
      if (ds.bindValue && document.activeElement !== el) {
        const val = UI.evalExpr(ds.bindValue, ctx);
        if (
          val !== undefined &&
          (el as HTMLInputElement).value !== String(val)
        ) {
          (el as HTMLInputElement).value = String(val);
        }
      }

      // 3. Conditional CSS Classes
      if (ds.bindClass) {
        const clsMap = UI.evalExpr(ds.bindClass, ctx);
        if (typeof clsMap === "string") {
          el.className = clsMap;
        } else if (typeof clsMap === "object" && clsMap !== null) {
          Object.entries(clsMap).forEach(([className, active]) => {
            el.classList.toggle(className, Boolean(active));
          });
        }
      }

      // 4. Anchor Href Attribute
      if (ds.bindHref) {
        const val = UI.evalExpr(ds.bindHref, ctx);
        if (val !== undefined) {
          const targetHref = String(val || "#");
          if (el.getAttribute("href") !== targetHref) {
            el.setAttribute("href", targetHref);
          }
        }
      }

      // 5. ARIA Switch & Checkbox State
      if (ds.bindAriaChecked) {
        const isChecked = Boolean(UI.evalExpr(ds.bindAriaChecked, ctx));
        const targetVal = String(isChecked);
        if (el.getAttribute("aria-checked") !== targetVal) {
          el.setAttribute("aria-checked", targetVal);
        }
      }

      // 6. Media & Image Source Binding
      if (ds.bindSrc) {
        const val = UI.evalExpr(ds.bindSrc, ctx);
        if (val !== undefined) {
          const targetSrc = String(val || "");
          const mediaEl = el as HTMLMediaElement | HTMLImageElement;
          if (mediaEl.src !== targetSrc && targetSrc !== "") {
            mediaEl.src = targetSrc;
            if (el instanceof HTMLMediaElement) {
              el.load();
            }
          }
        }
      }

      // 7. Video Poster Image Binding
      if (ds.bindposter) {
        const val = UI.evalExpr(ds.bindposter, ctx);
        if (val !== undefined) {
          const targetPoster = String(val || "");
          const videoEl = el as HTMLVideoElement;
          if (videoEl.poster !== targetPoster) {
            videoEl.setAttribute("poster", targetPoster);
            videoEl.poster = targetPoster;
          }
        }
      }
    });
  }

  /**
   * Delegated Global Click Listener -> Routes to Registered Action Handlers
   */
  private static handleGlobalClick(event: MouseEvent): void {
    const targetElement = event.target as Element | null;
    if (!targetElement) return;

    const trigger = targetElement.closest<HTMLElement>("[data-action]");
    if (!trigger) return;

    const action = trigger.dataset.action;
    if (!action) return;

    const handler = UI.handlers.get(action);
    if (handler) {
      handler(trigger, event);
    }
  }

  static init(): void {
    document.removeEventListener("click", UI.handleGlobalClick);
    document.addEventListener("click", UI.handleGlobalClick);

    // Register base stores
    UI.registerStore("player", "playerStore");
    UI.registerStore("review", "reviewStore");
    UI.registerStore("playlist", "playlistStore");
    UI.registerStore("toast", "toastStore");
    UI.registerStore("portfolio", "portfolioStore");

    // Listen for state change events dispatched by store singletons
    UI.listenToEvents(
      "player-track-changed",
      "review-state-changed",
      "playlist-state-changed",
      "toast-state-changed",
      "portfolio-state-changed",
    );

    UI.requestSync();
    console.log("⚡ [UI Binder] Dynamic, strict-mode binder initialized.");
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => UI.init());
  } else {
    UI.init();
  }
}
