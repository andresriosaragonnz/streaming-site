// =============================================================================
// Lightweight, Generic UI Binder Engine
// =============================================================================

export type ActionHandler = (trigger: HTMLElement, event: Event) => void;

/**
 * High-performance, zero-dependency DOM binder and event delegation engine.
 * Handles single-pass state synchronization and global action routing.
 */
export class UI {
  private static handlers = new Map<string, ActionHandler>();
  private static registeredEvents = new Set<string>();
  private static stores = new Map<string, string>(); // storeName -> windowKey
  private static evalCache = new Map<string, Function>();
  private static isScheduled = false;

  /**
   * Registers a callback handler for a specific `data-action` key.
   */
  static registerAction(actionName: string, handler: ActionHandler): void {
    UI.handlers.set(actionName, handler);
  }

  /**
   * Registers custom window events to trigger reactive DOM re-syncs.
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
   * Registers global store namespaces mapped to `window` object keys.
   */
  static registerStore(name: string, windowKey: string): void {
    UI.stores.set(name, windowKey);
  }

  /**
   * Evaluates expressions against registered store contexts using cached Function instances.
   */
  private static evalExpr(expr: string, context: Record<string, any>): any {
    try {
      const keys = Object.keys(context);
      const cacheKey = `${keys.join(",")}:${expr}`;
      let fn = UI.evalCache.get(cacheKey);

      if (!fn) {
        fn = new Function(...keys, `return ${expr};`);
        UI.evalCache.set(cacheKey, fn);
      }

      const values = Object.values(context);
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
   * Pure reactive sync pass: Updates DOM text, inputs, attributes, visibility, and CSS classes.
   */
  static sync(): void {
    const ctx: Record<string, any> = {};
    UI.stores.forEach((windowKey, storeName) => {
      ctx[storeName] = (window as any)[windowKey] ?? {};
    });

    const selector = [
      "[data-bind-text]",
      "[data-bind-value]",
      "[data-bind-checked]",
      "[data-bind-class]",
      "[data-bind-show]",
      "[data-bind-href]",
      "[data-bind-aria-checked]",
      "[data-bind-src]",
      "[data-bind-poster]",
    ].join(", ");

    const elements = document.querySelectorAll<HTMLElement>(selector);

    elements.forEach((el) => {
      const ds = el.dataset;

      // 1. Text Content
      if (ds.bindText) {
        const val = UI.evalExpr(ds.bindText, ctx);
        if (val !== undefined && el.textContent !== String(val)) {
          el.textContent = String(val);
        }
      }

      // 2. Form Inputs (Preserves typing focus & cursor position)
      if (ds.bindValue && document.activeElement !== el) {
        const val = UI.evalExpr(ds.bindValue, ctx);
        if (
          val !== undefined &&
          (el as HTMLInputElement).value !== String(val)
        ) {
          (el as HTMLInputElement).value = String(val);
        }
      }

      // 3. Checkbox / Radio Checked State (Guarded against uninitialized stores)
      if (ds.bindChecked) {
        const val = UI.evalExpr(ds.bindChecked, ctx);
        if (val !== undefined) {
          const isChecked = Boolean(val);
          const inputEl = el as HTMLInputElement;
          if (inputEl.checked !== isChecked) {
            inputEl.checked = isChecked;
          }
        }
      }

      // 4. Conditional CSS Classes (Supports Object Map & String)
      if (ds.bindClass) {
        const clsMap = UI.evalExpr(ds.bindClass, ctx);
        if (typeof clsMap === "string") {
          if (el.className !== clsMap) el.className = clsMap;
        } else if (typeof clsMap === "object" && clsMap !== null) {
          Object.entries(clsMap).forEach(([className, active]) => {
            el.classList.toggle(className, Boolean(active));
          });
        }
      }

      // 5. Conditional Visibility Toggle
      if (ds.bindShow) {
        const val = UI.evalExpr(ds.bindShow, ctx);
        if (val !== undefined) {
          el.classList.toggle("is-hidden", !Boolean(val));
        }
      }

      // 6. Anchor Href Attribute
      if (ds.bindHref) {
        const val = UI.evalExpr(ds.bindHref, ctx);
        if (val !== undefined) {
          const targetHref = String(val || "#");
          if (el.getAttribute("href") !== targetHref) {
            el.setAttribute("href", targetHref);
          }
        }
      }

      // 7. ARIA Switch & Checkbox State
      if (ds.bindAriaChecked) {
        const val = UI.evalExpr(ds.bindAriaChecked, ctx);
        if (val !== undefined) {
          const targetVal = String(Boolean(val));
          if (el.getAttribute("aria-checked") !== targetVal) {
            el.setAttribute("aria-checked", targetVal);
          }
        }
      }

      // 8. Media & Image Source Binding
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

      // 9. Video Poster Image Binding
      if (ds.bindPoster) {
        const val = UI.evalExpr(ds.bindPoster, ctx);
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
   * Dispatches delegated events directly to registered action handlers.
   */
  private static dispatchAction(event: Event): void {
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
    // Register global event delegation listeners
    document.removeEventListener("click", UI.dispatchAction);
    document.addEventListener("click", UI.dispatchAction);

    document.removeEventListener("change", UI.dispatchAction);
    document.addEventListener("change", UI.dispatchAction);

    document.removeEventListener("input", UI.dispatchAction);
    document.addEventListener("input", UI.dispatchAction);

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
