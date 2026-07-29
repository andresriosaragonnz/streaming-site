// public/js/carousel.js
export function registerCarousel(Alpine) {
  Alpine.data("carousel", () => ({
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
      this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 5;
    },

    scroll(direction) {
      const el = this.$refs.scrollList;
      if (!el) return;
      const scrollAmount = 252;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    },
  }));
}
