import { UI } from "./binder";
import { stopPlayback } from "./utils/mediaController.js";

declare global {
  interface Window {
    scheduleGraphRender?: (data?: any) => void;
  }
}

// =============================================================================
// Modal & Drawer Lifecycle Hooks
// =============================================================================

const openModalHooks: Record<string, () => void> = {
  "commit-modal-dialog": () => window.reviewStore?.toggleCommitModal(true),
  "graph-drawer-container": () => {
    if (window.graphStore) {
      window.graphStore.openDrawer();
    } else {
      window.reviewStore?.toggleGraphDrawer(true);
    }
    window.dispatchEvent(new CustomEvent("modal-ready"));
  },
};

const closeModalHooks: Record<string, () => void> = {
  "commit-modal-dialog": () => window.reviewStore?.toggleCommitModal(false),
  "graph-drawer-container": () => {
    if (window.graphStore) {
      window.graphStore.closeDrawer();
    } else {
      window.reviewStore?.toggleGraphDrawer(false);
    }
  },
};

// =============================================================================
// Action Handler Registrations
// =============================================================================

export function initAppActions(): void {
  // ---------------------------------------------------------------------------
  // 1. Audio & Video Player Actions
  // ---------------------------------------------------------------------------
  UI.registerAction("toggle-audio-mode", () => {
    console.log("toggle-audio-mode");
    window.playerStore?.toggleMode?.();
  });

  UI.registerAction("toggle-media-play", () => {
    const isAudio = window.playerStore?.isAudioMode ?? true;
    const mediaEl = document.getElementById(
      isAudio ? "r2-audio-player" : "r2-video-player",
    ) as HTMLMediaElement | null;

    if (!mediaEl) return;

    if (mediaEl.paused) {
      mediaEl.play().catch((err) => console.error("Media play error:", err));
    } else {
      mediaEl.pause();
    }
  });

  UI.registerAction("select-segment", (trigger: HTMLElement) => {
    const card = trigger.closest("[data-id]") as HTMLElement | null;
    const id = card?.dataset.id ?? trigger.dataset.id;
    console.log("select segment", id);
    if (id && window.playerStore) {
      stopPlayback();
      window.playerStore.selectSegment(id);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Public Performance Playlist Actions
  // ---------------------------------------------------------------------------
  UI.registerAction("add-current-segment-to-playlist", () => {
    const selectEl = document.getElementById(
      "playlist-select",
    ) as HTMLSelectElement | null;
    const customGroup = document.getElementById("custom-playlist-group");
    const customInput = document.getElementById(
      "custom-playlist-name",
    ) as HTMLInputElement | null;
    const toggleBtn = document.getElementById("btn-toggle-new-playlist");

    if (!selectEl) return;

    const isCustomVisible =
      customGroup && !customGroup.classList.contains("hidden");
    const customValue = customInput?.value.trim();

    let targetPlaylistName = selectEl.value;

    // 1. If custom input is visible and filled, use it as target playlist
    if (isCustomVisible && customValue) {
      targetPlaylistName = customValue;

      // Dynamically insert new option if it doesn't exist yet
      let opt = Array.from(selectEl.options).find(
        (o) => o.value === customValue,
      );
      if (!opt) {
        opt = document.createElement("option");
        opt.value = customValue;
        opt.textContent = customValue;
        selectEl.appendChild(opt);
      }
      selectEl.value = customValue;

      // Reset custom input state
      customInput.value = "";
      customGroup.classList.add("hidden");
      toggleBtn?.classList.remove("active");
    }

    if (!targetPlaylistName) return;

    // 2. Persist active segment ID to target playlist
    window.playlistStore?.addCurrentSegmentToPlaylist(targetPlaylistName);
  });

  UI.registerAction("playlist-select-change", (trigger: HTMLElement) => {
    const selectEl = trigger as HTMLSelectElement;
    const isNew = selectEl.value === "+ New Playlist...";

    window.playerStore?.setCustomPlaylistInput(isNew);
  });

  // ---------------------------------------------------------------------------
  // 3. Dialog & Drawer Lifecycle Actions
  // ---------------------------------------------------------------------------
  UI.registerAction("open-commit-dialog", () => {
    const dialogEl = document.getElementById(
      "commit-modal-dialog",
    ) as HTMLDialogElement | null;
    if (dialogEl && typeof dialogEl.showModal === "function") {
      openModalHooks["commit-modal-dialog"]?.();
      dialogEl.showModal();
    }
  });

  UI.registerAction("close-commit-dialog", () => {
    const dialogEl = document.getElementById(
      "commit-modal-dialog",
    ) as HTMLDialogElement | null;
    if (dialogEl && typeof dialogEl.close === "function") {
      closeModalHooks["commit-modal-dialog"]?.();
      dialogEl.close();
    }
  });

  UI.registerAction("toggle-drawer", (trigger: HTMLElement) => {
    const drawerId = trigger.dataset.drawerId || trigger.dataset.modalId;
    if (!drawerId) return;

    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    const isOpen = drawer.classList.toggle("is-open");
    drawer.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("modal-open", isOpen);

    if (isOpen) {
      openModalHooks[drawerId]?.();
    } else {
      closeModalHooks[drawerId]?.();
    }
  });

  // ---------------------------------------------------------------------------
  // 4. Network Graph Actions
  // ---------------------------------------------------------------------------
  // UI.registerAction("open-graph-modal", () => window.graphStore?.openDrawer());

  UI.registerAction("open-graph-modal", (trigger: HTMLElement) => {
    const wrapper = document.getElementById("graph-viewport-wrapper");
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // Read pre-set attributes or derive from window bounds on mobile
    const staticWidth = wrapper?.dataset.viewportWidth
      ? parseInt(wrapper.dataset.viewportWidth, 10)
      : isMobile
        ? window.innerWidth
        : undefined;

    const staticHeight = wrapper?.dataset.viewportHeight
      ? parseInt(wrapper.dataset.viewportHeight, 10)
      : isMobile
        ? window.innerHeight
        : undefined;

    // Initialize or update graph engine
    window.graphStore?.open({
      dimensions:
        staticWidth && staticHeight
          ? { width: staticWidth, height: staticHeight }
          : undefined,
    });
  });

  UI.registerAction("close-graph-modal", () =>
    window.graphStore?.closeDrawer(),
  );
  UI.registerAction("toggle-graph-modal", () =>
    window.graphStore?.toggleDrawer(),
  );

  UI.registerAction("reset-graph", () => {
    window.graphStore?.setActiveNode("");
    if (typeof window.scheduleGraphRender === "function") {
      window.scheduleGraphRender();
    }
  });

  // ---------------------------------------------------------------------------
  // 5. Review Store & Commit Actions
  // ---------------------------------------------------------------------------
  UI.registerAction("toggle-segment-status", () => {
    window.reviewStore?.toggleStatus();
  });

  UI.registerAction("sync-segment-title", (trigger: HTMLElement) => {
    const inputEl = trigger as HTMLInputElement;
    console.log("clidk");
    window.reviewStore?.syncTitle(inputEl.value);
  });

  UI.registerAction("toggle-license-check", (trigger: HTMLElement) => {
    const checkbox = trigger as HTMLInputElement;
    const dialog = checkbox.closest("dialog");
    const confirmBtn = dialog?.querySelector(
      ".btn-modal-confirm",
    ) as HTMLButtonElement | null;

    if (confirmBtn) {
      confirmBtn.disabled = !checkbox.checked;
    }
  });

  UI.registerAction("submit-review-commit", async (trigger: HTMLElement) => {
    const confirmBtn = trigger as HTMLButtonElement;
    if (confirmBtn.disabled) return;
    await window.reviewStore?.submitCommit();

    // Auto-close dialog after successful commit
    const dialogEl = document.getElementById(
      "commit-modal-dialog",
    ) as HTMLDialogElement | null;
    if (dialogEl && typeof dialogEl.close === "function") {
      dialogEl.close();
    }
  });

  UI.registerAction("copy-share-url", async (trigger: HTMLElement) => {
    const store = window.playlistStore;
    const shareUrl =
      store?.shareUrl || store?.generateShareUrl() || window.location.href;
    try {
      // await navigator.clipboard.writeText(shareUrl);
      window.toastStore?.trigger("Copied to clipboard", "success");
    } catch (err) {
      console.error("Failed to copy share URL:", err);
    }
  });

  UI.registerAction("copy-portfolio-share-link", (trigger: HTMLElement) => {
    const playlistName = trigger.dataset.playlistName;
    if (!playlistName || !window.portfolioStore) return;

    const shareUrl = window.portfolioStore.getShareUrl(playlistName);
    if (!shareUrl || shareUrl === "#") return;
    window.toastStore?.trigger("Copied to clipboard", "success");

    navigator.clipboard.writeText(shareUrl).catch((err) => {
      console.error("Failed to copy portfolio link:", err);
    });
  });

  UI.registerAction(
    "delete-playlist-item",
    (trigger: HTMLElement, event: MouseEvent) => {
      event.stopPropagation();
      const trackId =
        trigger.dataset.id ??
        trigger.closest("[data-id]")?.getAttribute("data-id");

      if (!trackId || !window.playlistStore) return;

      window.playlistStore.removeTrackById(trackId);

      if (window.playerStore && window.playerStore.state.activeId === trackId) {
        const remainingTracks = window.playlistStore.state.tracks;
        if (remainingTracks.length > 0) {
          window.playerStore.selectSegment(remainingTracks[0].id);
        } else {
          window.playerStore.state.activeId = null;
          window.playerStore.syncMediaElementSource();
        }
      }

      const cardElement = trigger.closest(
        ".sidebar-item-card",
      ) as HTMLElement | null;
      if (cardElement) {
        cardElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        cardElement.style.opacity = "0";
        cardElement.style.transform = "scale(0.95)";

        setTimeout(() => {
          cardElement.remove();
          UI.requestSync();
        }, 300);
      }
    },
  );
}

// Auto-initialize when client bundle loads
if (typeof window !== "undefined") {
  initAppActions();
  console.log("⚙️ [App Actions] Registered all data-action handlers.");
}
