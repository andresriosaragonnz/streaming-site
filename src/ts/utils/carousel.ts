export interface CarouselComponent {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  init(this: CarouselComponent & AlpineComponentContext): void;
  checkScroll(this: CarouselComponent & AlpineComponentContext): void;
  scroll(
    this: CarouselComponent & AlpineComponentContext,
    direction: "left" | "right",
  ): void;
}

// Helper interface for Alpine runtime magic properties on `this`
interface AlpineComponentContext {
  $nextTick(callback: () => void): void;
  $refs: {
    scrollList?: HTMLElement;
  };
}

export function registerCarousel(Alpine: any): void {
  Alpine.data(
    "carousel",
    (): CarouselComponent => ({
      canScrollLeft: false,
      canScrollRight: false,

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
    }),
  );
}
