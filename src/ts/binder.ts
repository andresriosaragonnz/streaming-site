// =============================================================================
// 1. Types & Declarations
// =============================================================================

declare global {
  interface Window {
    playerStore?: {
      selectSegment?: (index: number) => void;
      toggleMode?: () => void;
      currentArtistName?: string;
      currentArtistLink?: string;
      isAudioMode?: boolean;
      active?: any;
      state?: {
        currentIndex: number;
        mode: boolean;
        segments: any[];
      };
    };
    playlistStore?: {
      getShareUrl?: (playlistName: string) => string;
      generateShareLink?: (playlistName: string) => void;
      [key: string]: any;
    };
    graphStore?: {
      resetGraph?: () => void;
      closeDrawer?: () => void;
    };
    reviewStore?: {
      toggleStatus?: (currentIndex: number) => void;
      syncStore?: (currentIndex: number, value: string) => void;
      submitCommit?: () => Promise<void>;
      publicCount?: number;
      privateCount?: number;
      hasUncommittedChanges?: boolean;
      state?: {
        tracks: Array<{
          id: string;
          title: string;
          isPublic: boolean;
          status: string;
        }>;
        activeNodeLink?: string;
        isGraphDrawerOpen?: boolean;
        isCommitModalOpen?: boolean;
        isSubmitting?: boolean;
      };
    };
    renderGraph?: (data: any) => void;
    setupMediaPlayback?: (segment: any, mode: boolean, paused: boolean) => void;
    __GRAPH_DATA__?: any;
  }
}

// =============================================================================
// 2. Declarative UI Binder Engine (Single Event Architecture)
// =============================================================================

export class UI {
  private static isScheduled = false;

  private static evalExpr(expr: string, context: any): any {
    try {
      const fn = new Function("ctx", `with(ctx) { return ${expr}; }`);
      return fn(context);
    } catch {
      return undefined;
    }
  }

  /**
   * Schedules a sync pass on the next animation frame to batch DOM updates.
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
   * Consolidated DOM sync pass across all data-bind directives.
   */
  static sync(): void {
    const player = window.playerStore;
    const currentIndex = player?.state?.currentIndex ?? 0;
    const currentSegment = player?.state?.segments?.[currentIndex];
    const review = window.reviewStore;
    const activeTrack = review?.state?.tracks?.[currentIndex];

    // Build context object using store getters and defensive fallbacks
    const ctx = {
      playlist: window.playlistStore ?? {},
      review: review
        ? {
            ...review,
            active: activeTrack,
            isCurrentPublic: activeTrack?.isPublic ?? true,
            publicCount: review.publicCount ?? 0,
            privateCount: review.privateCount ?? 0,
            hasUncommittedChanges: review.hasUncommittedChanges ?? false,
            tracks: review.state?.tracks ?? [],
            activeNodeLink: review.state?.activeNodeLink ?? "",
            state: review.state ?? {},
          }
        : {},
      player: {
        currentIndex,
        isAudioMode: player?.isAudioMode ?? !player?.state?.mode,
        active: player?.active ?? currentSegment ?? {},
        currentSegment,
        currentPoster: currentSegment?.cardImage
          ? `${currentSegment.cardImage}.jpg`
          : "",
        currentArtistName: player?.currentArtistName ?? "",
        currentArtistLink: player?.currentArtistLink ?? "#",
      },
    };

    // Single DOM traversal for bound elements
    const elements = document.querySelectorAll<HTMLElement>(
      "[data-bind-text], [data-bind-value], [data-bind-show], [data-bind-href], [data-bind-class], [data-bind-active-class], [data-bind-checked], [data-bind-aria-checked], [data-bind-src], [data-bind-poster]",
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

      // 2. Input Values
      if (ds.bindValue && document.activeElement !== el) {
        const val = UI.evalExpr(ds.bindValue, ctx);
        if (
          val !== undefined &&
          (el as HTMLInputElement).value !== String(val)
        ) {
          (el as HTMLInputElement).value = String(val);
        }
      }

      // 3. Display Toggle (Container visibility)
      if (ds.bindShow) {
        const shouldShow = Boolean(UI.evalExpr(ds.bindShow, ctx));
        const targetDisplay = shouldShow ? "block" : "none";
        if (el.style.display !== targetDisplay) {
          el.style.display = targetDisplay;
        }
      }

      // 4. Anchor Href
      if (ds.bindHref) {
        const val = UI.evalExpr(ds.bindHref, ctx);
        if (val !== undefined) {
          const targetHref = String(val || "#");
          if (el.getAttribute("href") !== targetHref) {
            el.setAttribute("href", targetHref);
          }
        }
      }

      // 5. Conditional Classes
      if (ds.bindClass) {
        const clsName = String(UI.evalExpr(ds.bindClass, ctx) || "");
        el.classList.toggle("is-active", clsName.includes("is-active"));
        el.classList.toggle("btn-public-green", clsName === "btn-public-green");
        el.classList.toggle("btn-private-red", clsName === "btn-private-red");
      }

      // 6. Active Item Highlight
      if (ds.bindActiveClass) {
        const activeCls = String(UI.evalExpr(ds.bindActiveClass, ctx) || "");
        el.classList.toggle("item-active-highlight", Boolean(activeCls));
      }

      // 7. Native Checkboxes
      if (ds.bindChecked && document.activeElement !== el) {
        const isChecked = Boolean(UI.evalExpr(ds.bindChecked, ctx));
        const checkbox = el as HTMLInputElement;
        if (checkbox.checked !== isChecked) {
          checkbox.checked = isChecked;
        }
      }

      // 8. ARIA Switch Checked State
      if (ds.bindAriaChecked) {
        const isChecked = Boolean(UI.evalExpr(ds.bindAriaChecked, ctx));
        const targetVal = String(isChecked);
        if (el.getAttribute("aria-checked") !== targetVal) {
          el.setAttribute("aria-checked", targetVal);
        }
      }

      // 9. Media Src Binding (Safeguarded against seek buffer interrupts)
      if (ds.bindSrc) {
        const srcVal = String(UI.evalExpr(ds.bindSrc, ctx) || "");
        if (srcVal) {
          const mediaEl = el as HTMLMediaElement;
          const currentSrc = mediaEl.src;
          const resolvedTarget = new URL(srcVal, window.location.href).href;

          if (currentSrc !== resolvedTarget && !mediaEl.seeking) {
            el.setAttribute("src", srcVal);
          }
        }
      }

      // 10. Video Poster Binding
      if (ds.bindPoster) {
        const posterVal = String(UI.evalExpr(ds.bindPoster, ctx) || "");
        if (posterVal && el.getAttribute("poster") !== posterVal) {
          el.setAttribute("poster", posterVal);
        }
      }
    });
  }

  /**
   * Toggles modal or drawer visibility and updates display and pointer event layer state.
   */
  static handleModalToggle(containerId: string, isOpen: boolean): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const overlay = container.querySelector(".graph-drawer-overlay");
    const panel = container.querySelector(".graph-drawer-panel") || container;

    container.style.display = isOpen ? "flex" : "none";
    container.style.pointerEvents = isOpen ? "auto" : "none";

    overlay?.classList.toggle("is-open", isOpen);
    panel.classList.toggle("is-open", isOpen);
    container.classList.toggle("is-open", isOpen);

    container.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("modal-open", isOpen);

    if (isOpen) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent("modal-ready"));
      });
    }
  }

  /**
   * Single global click handler mapping data-action directly to stores.
   */
  private static async handleGlobalClick(event: MouseEvent): Promise<void> {
    const targetElement = event.target as Element | null;
    if (!targetElement) return;

    const trigger = targetElement.closest<HTMLElement>("[data-action]");
    if (!trigger) return;

    const action = trigger.dataset.action;
    if (!action) return;

    switch (action) {
      case "toggle-audio-mode":
        window.playerStore?.toggleMode?.();
        break;

      case "toggle-audio-play": {
        const audioEl = document.getElementById(
          "r2-audio-player",
        ) as HTMLAudioElement | null;
        if (!audioEl) break;

        if (audioEl.paused) {
          audioEl
            .play()
            .catch((err) => console.error("Audio play error:", err));
        } else {
          audioEl.pause();
        }
        break;
      }

      case "select-segment": {
        const rawIndex =
          trigger.dataset.index ??
          trigger.closest("[data-index]")?.getAttribute("data-index");
        if (rawIndex !== null && rawIndex !== undefined) {
          window.playerStore?.selectSegment?.(Number(rawIndex));
        }
        break;
      }

      case "toggle-class": {
        const targetSelector = trigger.dataset.target;
        if (targetSelector) {
          document
            .querySelector(targetSelector)
            ?.classList.toggle(trigger.dataset.class || "active");
        }
        break;
      }

      case "open-modal": {
        const modalId = trigger.dataset.modalId;
        if (modalId) {
          UI.handleModalToggle(modalId, true);
          if (
            modalId === "commit-modal-container" &&
            window.reviewStore?.state
          ) {
            window.reviewStore.state.isCommitModalOpen = true;
            window.dispatchEvent(new CustomEvent("review-state-changed"));
          } else if (
            modalId === "graph-drawer-container" &&
            window.reviewStore?.state
          ) {
            window.reviewStore.state.isGraphDrawerOpen = true;
          }
        }
        break;
      }

      case "close-modal": {
        const modalId = trigger.dataset.modalId;
        if (modalId) {
          UI.handleModalToggle(modalId, false);
          if (
            modalId === "commit-modal-container" &&
            window.reviewStore?.state
          ) {
            window.reviewStore.state.isCommitModalOpen = false;
            window.dispatchEvent(new CustomEvent("review-state-changed"));
          } else if (
            modalId === "graph-drawer-container" &&
            window.reviewStore?.state
          ) {
            window.reviewStore.state.isGraphDrawerOpen = false;
            window.dispatchEvent(new CustomEvent("review-state-changed"));
          }
        }
        break;
      }

      case "toggle-drawer": {
        const drawerId = trigger.dataset.drawerId || trigger.dataset.modalId;
        if (drawerId) {
          const drawer = document.getElementById(drawerId);
          const isOpen = !(drawer?.classList.contains("is-open") ?? false);
          UI.handleModalToggle(drawerId, isOpen);

          if (
            drawerId === "graph-drawer-container" &&
            window.reviewStore?.state
          ) {
            window.reviewStore.state.isGraphDrawerOpen = isOpen;
          }
        }
        break;
      }

      case "reset-graph":
        window.history.pushState({}, "", window.location.pathname);
        window.dispatchEvent(
          new CustomEvent("node-selected", { detail: { link: "" } }),
        );
        window.renderGraph?.(null);
        break;

      case "toggle-track-status": {
        const currentIndex = window.playerStore?.state?.currentIndex ?? 0;
        window.reviewStore?.toggleStatus?.(currentIndex);
        break;
      }

      case "submit-commit": {
        const confirmBtn = trigger as HTMLButtonElement;
        if (confirmBtn.disabled) return;
        await window.reviewStore?.submitCommit?.();
        break;
      }
    }
  }

  static init(): void {
    // Single delegated click listener
    document.removeEventListener("click", UI.handleGlobalClick);
    document.addEventListener("click", UI.handleGlobalClick);

    // Global store change listeners
    window.removeEventListener("review-state-changed", UI.requestSync);
    window.addEventListener("review-state-changed", UI.requestSync);

    window.removeEventListener("player-track-changed", UI.requestSync);
    window.addEventListener("player-track-changed", UI.requestSync);

    window.removeEventListener("playlist-state-changed", UI.requestSync);
    window.addEventListener("playlist-state-changed", UI.requestSync);

    UI.requestSync();
    console.log(
      "⚡ [UI Binder] Single click delegate & reactive listeners ready.",
    );
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => UI.init());
  } else {
    UI.init();
  }
}
