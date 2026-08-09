export interface CarouselComponent {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  draggedIndex: number | null;
  init(this: CarouselComponent & AlpineComponentContext): void;
  checkScroll(this: CarouselComponent & AlpineComponentContext): void;
  scroll(
    this: CarouselComponent & AlpineComponentContext,
    direction: "left" | "right",
  ): void;
  // Drag and Drop handlers
  handleDragStart(
    this: CarouselComponent & AlpineComponentContext,
    idx: number,
    evt: DragEvent,
  ): void;
  handleDragOver(evt: DragEvent): void;
  handleDrop(
    this: CarouselComponent & AlpineComponentContext,
    targetIdx: number,
    evt: DragEvent,
  ): void;
  handleDragEnd(this: CarouselComponent & AlpineComponentContext): void;
}

interface AlpineComponentContext {
  $nextTick(callback: () => void): void;
  $refs: {
    scrollList?: HTMLElement;
  };
  $store: {
    review: {
      segments: Array<any>;
      currentIndex: number;
    };
  };
}

export function registerCarousel(Alpine: any): void {
  Alpine.data(
    "carousel",
    (): CarouselComponent => ({
      canScrollLeft: false,
      canScrollRight: false,
      draggedIndex: null,

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
        // Necessary to allow dropping
        evt.preventDefault();
        if (evt.dataTransfer) {
          evt.dataTransfer.dropEffect = "move";
        }
      },

      handleDrop(targetIdx: number, evt: DragEvent) {
        evt.preventDefault();
        if (this.draggedIndex === null || this.draggedIndex === targetIdx)
          return;

        // Reorder segments in store
        const segments = [...this.$store.review.segments];
        const [movedItem] = segments.splice(this.draggedIndex, 1);
        segments.splice(targetIdx, 0, movedItem);

        this.$store.review.segments = segments;

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
