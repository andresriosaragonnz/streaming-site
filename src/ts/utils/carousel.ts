export function registerCarousel(Alpine: any): void {
  Alpine.data(
    "carousel",
    (): CarouselComponent => ({
      canScrollLeft: false,
      canScrollRight: false,
      draggedIndex: null,

      isBeingDragged(idx: number): boolean {
        return this.draggedIndex === idx;
      },

      init() {
        this.$nextTick(() => {
          this.checkScroll();
        });

        window.addEventListener("resize", () => this.checkScroll());

        this.$nextTick(() => {
          if (window.ResizeObserver && this.$refs.scrollList) {
            const observer = new ResizeObserver(() => this.checkScroll());
            observer.observe(this.$refs.scrollList);
          }
        });
      },

      checkScroll() {
        const el = this.$refs.scrollList;
        if (!el) return;
        this.canScrollLeft = el.scrollLeft > 5;
        this.canScrollRight =
          el.scrollLeft + el.clientWidth < el.scrollWidth - 5;
      },

      scroll(direction: "left" | "right") {
        const el = this.$refs.scrollList;
        if (!el) return;
        const scrollAmount = 252;
        el.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      },

      handleDragStart(idx: number, evt: DragEvent) {
        this.draggedIndex = idx;
        const el = this.$refs.scrollList;
        if (el) {
          el.classList.add("is-dragging");
        }

        if (evt.dataTransfer) {
          evt.dataTransfer.effectAllowed = "move";
          evt.dataTransfer.setData("text/plain", idx.toString());
        }
      },

      handleDragOver(evt: DragEvent) {
        evt.preventDefault();
        if (evt.dataTransfer) {
          evt.dataTransfer.dropEffect = "move";
        }
      },

      handleDrop(targetIdx: number, evt: DragEvent) {
        evt.preventDefault();
        if (this.draggedIndex === null || this.draggedIndex === targetIdx)
          return;

        const segments = [...this.$store.player.segments];
        const [movedItem] = segments.splice(this.draggedIndex, 1);
        segments.splice(targetIdx, 0, movedItem);

        this.$store.player.segments = segments;
        const urlParams = new URLSearchParams(window.location.search);
        const playlistName = urlParams.get("name");

        if (playlistName) {
          try {
            const storageKey = `${playlistName}`;
            console.log({ segments, storageKey });
            const newSegments = segments.map((segment) => segment.id);
            const currentPlaylistjson =
              localStorage.getItem("user_playlists") || "";
            const currentPlaylists = JSON.parse(currentPlaylistjson);
            localStorage.setItem(
              "user_playlists",
              JSON.stringify({
                ...currentPlaylists,
                [storageKey]: newSegments,
              }),
            );
          } catch (e) {
            console.log(e);
          }
        }

        this.$nextTick(() => {
          this.checkScroll();
        });
      },

      handleDragEnd() {
        this.draggedIndex = null;
        const el = this.$refs.scrollList;
        if (el) {
          el.classList.remove("is-dragging");
        }
      },
    }),
  );
}
