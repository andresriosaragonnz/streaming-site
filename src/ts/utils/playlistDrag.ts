// public/js/utils/playlistDrag.ts

export class PlaylistDragEngine {
  private draggedIndex: number | null = null;

  handleDragStart(index: number, event: DragEvent): void {
    this.draggedIndex = index;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    }

    const targetEl = event.currentTarget as HTMLElement | null;
    if (targetEl) {
      targetEl.classList.add("is-being-dragged");
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  handleDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();

    if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
      this.handleDragEnd();
      return;
    }

    const player = window.playerStore;
    if (!player?.state?.segments) {
      this.handleDragEnd();
      return;
    }

    const fromIndex = this.draggedIndex;
    const toIndex = targetIndex;

    // 1. Reorder active player state segments
    const segments = [...player.state.segments];
    const [movedItem] = segments.splice(fromIndex, 1);
    segments.splice(toIndex, 0, movedItem);

    // 2. Perform native DOM element movement
    const listContainer = document.getElementById("sidebar-scroll-list");
    if (listContainer) {
      const cards = Array.from(listContainer.children);
      const movedCard = cards[fromIndex];
      const targetCard = cards[toIndex];

      if (movedCard && targetCard) {
        if (fromIndex < toIndex) {
          listContainer.insertBefore(movedCard, targetCard.nextSibling);
        } else {
          listContainer.insertBefore(movedCard, targetCard);
        }

        // 3. Re-index card element attributes for future interactions
        Array.from(listContainer.children).forEach((child, newIdx) => {
          child.setAttribute("id", `playlist-segment-card-${newIdx}`);
          child.setAttribute(
            "onclick",
            `window.playerStore.selectSegment(${newIdx})`,
          );
          child.setAttribute(
            "ondragstart",
            `window.playlistDragEngine?.handleDragStart(${newIdx}, event)`,
          );
          child.setAttribute(
            "ondragover",
            `event.preventDefault(); window.playlistDragEngine?.handleDragOver(event)`,
          );
          child.setAttribute(
            "ondrop",
            `window.playlistDragEngine?.handleDrop(${newIdx}, event)`,
          );
          child.setAttribute(
            "ondragend",
            `window.playlistDragEngine?.handleDragEnd()`,
          );
          child.setAttribute(
            "data-bind-class-toggle",
            `is-active:player.isSegmentActive_${newIdx}`,
          );
        });
      }
    }

    // 4. Update active playing index to keep the current track playing smoothly
    const currentActiveIdx = player.state.currentIndex;
    if (currentActiveIdx === fromIndex) {
      player.state.currentIndex = toIndex;
    } else if (currentActiveIdx > fromIndex && currentActiveIdx <= toIndex) {
      player.state.currentIndex -= 1;
    } else if (currentActiveIdx < fromIndex && currentActiveIdx >= toIndex) {
      player.state.currentIndex += 1;
    }

    // 5. Save reordered list into playerStore state
    player.state.segments = segments;

    // 6. Sync reordered IDs to playlistsStore (e.g. active/current playlist)
    const activePlaylistName =
      listContainer?.getAttribute("data-playlist-name") || "favorites";
    const playlistsStore = window.playlistStore;

    if (playlistsStore?.state?.playlists) {
      const reorderedIds = segments.map((seg: any) => seg.id).filter(Boolean);
      // Re-assigning state.playlists triggers Proxy set() and saves to localStorage
      playlistsStore.state.playlists = {
        ...playlistsStore.state.playlists,
        [activePlaylistName]: reorderedIds,
      };
    }

    this.handleDragEnd();
  }

  handleDragEnd(): void {
    document.querySelectorAll(".is-being-dragged").forEach((el) => {
      el.classList.remove("is-being-dragged");
    });
    this.draggedIndex = null;
  }
}

// Register global instance
(window as any).playlistDragEngine = new PlaylistDragEngine();
