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

        // 3. Re-index card ids and drag handler indices
        Array.from(listContainer.children).forEach((child, newIdx) => {
          child.setAttribute("id", `playlist-segment-card-${newIdx}`);
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
        });
      }
    }

    // 4. Persist reordered segments (active track is ID-based, so it stays selected)
    player.state.segments = segments;

    // 5. Sync reordered IDs to the active playlist in localStorage
    window.playlistStore?.setTrackOrder(
      segments.map((seg: any) => seg.id).filter(Boolean),
    );

    this.handleDragEnd();
  }

  handleDragEnd(): void {
    document.querySelectorAll(".is-being-dragged").forEach((el) => {
      el.classList.remove("is-being-dragged");
    });
    this.draggedIndex = null;
  }
}
