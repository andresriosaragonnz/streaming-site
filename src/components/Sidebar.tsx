export interface SidebarProps {
  cards: JSX.Element[];
  header?: JSX.Element;
  carouselId?: string;
  listId?: string;
  playlistName?: string;
}

export const Sidebar = ({
  cards,
  header,
  carouselId = "sidebar-carousel",
  listId = "sidebar-scroll-list",
  playlistName,
}: SidebarProps) => (
  <div
    class="carousel-wrapper"
    id={carouselId}
    data-playlist-name={playlistName}
  >
    {header}

    {/* Left scroll arrow (initially hidden until scrolled) */}
    <button
      type="button"
      class="carousel-nav-btn nav-left"
      id="carousel-nav-left"
      aria-label="Scroll left"
      style="display: none;"
    >
      ‹
    </button>

    {/* Scroll container */}
    <div class="sidebar-scroll-list" id={listId}>
      {cards}
    </div>

    {/* Right scroll arrow */}
    <button
      type="button"
      class="carousel-nav-btn nav-right"
      id="carousel-nav-right"
      aria-label="Scroll right"
      style="display: none;"
    >
      ›
    </button>
  </div>
);
