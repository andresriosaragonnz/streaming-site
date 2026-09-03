// public/js/carousel.ts

export interface CarouselOptions {
  listId?: string;
  leftBtnId?: string;
  rightBtnId?: string;
  scrollOffset?: number;
}

export function initCarouselScroll(options: CarouselOptions = {}): () => void {
  const {
    listId = "sidebar-scroll-list",
    leftBtnId = "carousel-nav-left",
    rightBtnId = "carousel-nav-right",
    scrollOffset = 300,
  } = options;

  const scrollList = document.getElementById(listId);
  const navLeft = document.getElementById(leftBtnId);
  const navRight = document.getElementById(rightBtnId);

  if (!scrollList || !navLeft || !navRight) {
    // Return dummy cleanup if elements are not present on the current page
    return () => {};
  }

  // Check scroll boundary state to toggle visibility of nav arrows
  const checkScroll = () => {
    const maxScroll = scrollList.scrollWidth - scrollList.clientWidth;

    // Show left arrow if scrolled past start
    navLeft.style.display = scrollList.scrollLeft > 5 ? "block" : "none";

    // Show right arrow if not reached the end
    navRight.style.display =
      scrollList.scrollLeft < maxScroll - 5 ? "block" : "none";
  };

  // Scroll handlers
  const onLeftClick = () => {
    scrollList.scrollBy({ left: -scrollOffset, behavior: "smooth" });
  };

  const onRightClick = () => {
    scrollList.scrollBy({ left: scrollOffset, behavior: "smooth" });
  };

  // Passive listener for native scrolling performance
  scrollList.addEventListener("scroll", checkScroll, { passive: true });
  window.addEventListener("resize", checkScroll, { passive: true });
  navLeft.addEventListener("click", onLeftClick);
  navRight.addEventListener("click", onRightClick);

  // Initial visibility check
  checkScroll();

  // Return cleanup function for teardown/SPA view swaps if needed
  return () => {
    scrollList.removeEventListener("scroll", checkScroll);
    window.removeEventListener("resize", checkScroll);
    navLeft.removeEventListener("click", onLeftClick);
    navRight.removeEventListener("click", onRightClick);
  };
}
