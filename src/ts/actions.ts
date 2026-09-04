import { UI } from "./binder";
import { stopPlayback } from "./utils/mediaController.js";

// Global handle type definitions
declare global {
  interface Window {
    scheduleGraphRender?: (data?: any) => void;
  }
}

// =============================================================================
// Modal & Drawer Specific Lifecycle Hooks
// =============================================================================

const openModalHooks: Record<string, () => void> = {
  "commit-modal-container": () => {
    if (window.reviewStore?.state) {
      window.reviewStore.state.isCommitModalOpen = true;
      window.dispatchEvent(new CustomEvent("review-state-changed"));
    }
  },
  "graph-drawer-container": () => {
    if (window.graphStore) {
      window.graphStore.openDrawer();
    } else if (window.reviewStore?.state) {
      window.reviewStore.state.isGraphDrawerOpen = true;
    }
    window.dispatchEvent(new CustomEvent("modal-ready"));
  },
};

const closeModalHooks: Record<string, () => void> = {
  "commit-modal-container": () => {
    if (window.reviewStore?.state) {
      window.reviewStore.state.isCommitModalOpen = false;
      window.dispatchEvent(new CustomEvent("review-state-changed"));
    }
  },
  "graph-drawer-container": () => {
    if (window.graphStore) {
      window.graphStore.closeDrawer();
    } else if (window.reviewStore?.state) {
      window.reviewStore.state.isGraphDrawerOpen = false;
      window.dispatchEvent(new CustomEvent("review-state-changed"));
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
    if (id) {
      stopPlayback();
      window.playerStore?.selectSegment(id);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Public Performance Playlist Actions
  // ---------------------------------------------------------------------------

  UI.registerAction("add-current-segment-to-playlist", () => {
    const selectEl = document.getElementById(
      "playlist-select",
    ) as HTMLSelectElement | null;
    const customInputEl = document.getElementById(
      "custom-playlist-name",
    ) as HTMLInputElement | null;

    if (!selectEl) return;

    let targetPlaylist = selectEl.value;

    if (targetPlaylist === "+ New Playlist...") {
      targetPlaylist = customInputEl?.value.trim() || "";
      if (!targetPlaylist) {
        window.toastStore?.trigger?.("Please enter a playlist name", "error");
        return;
      }
    }

    const currentSegment =
      window.playerStore?.state?.currentSegment ||
      window.playerStore?.state?.segments?.find(
        (s: any) => s.id === window.playerStore?.state?.activeId,
      );

    if (!currentSegment) {
      window.toastStore?.trigger?.("No active segment to add", "error");
      return;
    }

    const STORAGE_KEY = "user_playlists";
    let userPlaylists: Record<string, any[]> = {};

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) userPlaylists = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse local user_playlists:", err);
    }

    if (!Array.isArray(userPlaylists[targetPlaylist])) {
      userPlaylists[targetPlaylist] = [];
    }

    const exists = userPlaylists[targetPlaylist].some(
      (item) => item.id === currentSegment.id,
    );

    if (exists) {
      window.toastStore?.trigger?.(`Already in "${targetPlaylist}"`, "info");
      return;
    }

    userPlaylists[targetPlaylist].push(currentSegment.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPlaylists));

    if (customInputEl) customInputEl.value = "";

    window.toastStore?.trigger?.(`Added to "${targetPlaylist}"`, "success");
  });

  UI.registerAction("playlist-select-change", (trigger: HTMLElement) => {
    const select = trigger as HTMLSelectElement;
    const customGroup = document.getElementById("custom-playlist-group");

    if (customGroup) {
      customGroup.style.display =
        select.value === "+ New Playlist..." ? "block" : "none";
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Generic Modal & Drawer Actions (Class-based display)
  // ---------------------------------------------------------------------------

  UI.registerAction("open-modal", (trigger: HTMLElement) => {
    const modalId = trigger.dataset.modalId;
    if (!modalId) return;

    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    openModalHooks[modalId]?.();
  });

  UI.registerAction("close-modal", (trigger: HTMLElement) => {
    const modalId = trigger.dataset.modalId;
    if (!modalId) return;

    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    closeModalHooks[modalId]?.();
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
  // 4. Network Graph Actions (Native UI.registerAction bindings)
  // ---------------------------------------------------------------------------

  UI.registerAction("open-graph-modal", () => {
    if (window.graphStore) {
      console.log("open-graph-modal");
      window.graphStore.openDrawer();
    }
  });

  UI.registerAction("close-graph-modal", () => {
    if (window.graphStore) {
      console.log("closing");
      window.graphStore.closeDrawer();
    }
  });

  UI.registerAction("toggle-graph-modal", () => {
    if (window.graphStore) {
      window.graphStore.toggleDrawer();
    }
  });

  UI.registerAction("reset-graph", () => {
    if (window.graphStore) {
      window.graphStore.setActiveNode("");
    }
    if (typeof window.scheduleGraphRender === "function") {
      window.scheduleGraphRender();
    }
  });

  // ---------------------------------------------------------------------------
  // 5. Review Store Actions
  // ---------------------------------------------------------------------------

  UI.registerAction("toggle-track-status", (trigger: HTMLElement) => {
    const triggerId =
      trigger.dataset.id ??
      trigger.closest("[data-id]")?.getAttribute("data-id");

    const activeId =
      triggerId ||
      window.playerStore?.activeSegmentId ||
      window.playerStore?.state?.activeId;

    if (activeId) {
      window.reviewStore?.toggleStatus?.(activeId);
    }
  });

  UI.registerAction("submit-commit", async (trigger: HTMLElement) => {
    const confirmBtn = trigger as HTMLButtonElement;
    if (confirmBtn.disabled) return;
    await window.reviewStore?.submitCommit?.();
  });

  UI.registerAction("copy-share-url", async (trigger: HTMLElement) => {
    const store = window.playlistStore;
    const shareUrl =
      store?.shareUrl || store?.generateShareUrl() || window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);

      const labelSpan = trigger.querySelector("span");
      const originalText = labelSpan?.textContent || "Share playlist";

      if (labelSpan) {
        labelSpan.textContent = "Copied!";
        trigger.classList.add("is-success");

        setTimeout(() => {
          labelSpan.textContent = originalText;
          trigger.classList.remove("is-success");
        }, 2000);
      }

      window.toastStore?.trigger?.("Copied to clipboard!", "success", 2500);
    } catch (err) {
      console.error("Failed to copy share URL to clipboard:", err);
      window.toastStore?.trigger?.("Failed to copy URL", "error", 3000);
    }
  });

  UI.registerAction("copy-portfolio-share-link", (trigger: HTMLElement) => {
    const playlistName = trigger.dataset.playlistName;
    if (!playlistName) return;

    const portfolioStore = window.portfolioStore;
    if (!portfolioStore) return;

    const shareUrl = portfolioStore.getShareUrl(playlistName);

    if (!shareUrl || shareUrl === "#") {
      window.toastStore?.trigger?.(
        `Playlist "${playlistName}" is empty.`,
        "info",
      );
      return;
    }

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        window.toastStore?.trigger?.(
          `Copied link for "${playlistName}"!`,
          "success",
        );
      })
      .catch(() => {
        window.toastStore?.trigger?.(
          "Failed to copy link to clipboard.",
          "error",
        );
      });
  });

  UI.registerAction("dismiss-toast", () => {
    window.toastStore?.dismiss();
  });

  UI.registerAction(
    "delete-playlist-item",
    (trigger: HTMLElement, event: MouseEvent) => {
      event.stopPropagation();

      const trackId =
        trigger.dataset.id ??
        trigger.closest("[data-id]")?.getAttribute("data-id");

      if (!trackId) return;

      const store = window.playlistStore;
      if (store) {
        store.removeTrackById(trackId);

        if (
          window.playerStore &&
          window.playerStore.state.activeId === trackId
        ) {
          const remainingTracks = store.state.tracks;
          if (remainingTracks.length > 0) {
            window.playerStore.selectSegment(remainingTracks[0].id);
          } else {
            window.playerStore.state.activeId = null;
            window.playerStore.syncMediaElementSource();
          }
        }
      }

      const cardElement = trigger.closest(
        ".sidebar-item-card",
      ) as HTMLElement | null;
      if (cardElement) {
        cardElement.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        cardElement.style.opacity = "0";
        cardElement.style.transform = "scale(0.95)";

        setTimeout(() => {
          cardElement.remove();
          UI.requestSync();
        }, 500);
      }
    },
  );
}

// Auto-initialize when client bundle loads
if (typeof window !== "undefined") {
  initAppActions();
  console.log("⚙️ [App Actions] Registered all data-action handlers.");
}
