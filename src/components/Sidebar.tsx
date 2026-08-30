export interface SidebarProps {
  cards: JSX.Element[];
  header?: JSX.Element;
  carouselId?: string;
  listId?: string;
  listRef?: string;
  onScroll?: string;
}

export const Sidebar = ({
  cards,
  header,
  carouselId = "sidebar-carousel",
  listId = "sidebar-scroll-list",
  listRef = "scrollList",
}: SidebarProps) => (
  <div class="carousel-wrapper" id={carouselId} x-data="carousel">
    <button
      type="button"
      class="carousel-nav-btn nav-left"
      id="carousel-nav-left"
      x-show="canScrollLeft"
      x-on:click="scroll('left')"
      x-transition
      x-cloak
    >
      ‹
    </button>

    <div class="sidebar-scroll-list" id={listId} x-ref={listRef}>
      {cards}
    </div>

    <button
      type="button"
      class="carousel-nav-btn nav-right"
      id="carousel-nav-right"
      x-show="canScrollRight"
      x-on:click="scroll('right')"
      x-transition
      x-cloak
    >
      ›
    </button>
  </div>
);
