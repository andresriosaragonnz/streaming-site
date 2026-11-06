import { Sidebar } from "../../components/Sidebar";

export interface PlaylistViewSidebarProps {
  pageTitle: string;
  cards: JSX.Element[];
}
export const PlaylistViewSidebar = ({
  pageTitle,
  cards,
}: PlaylistViewSidebarProps) => (
  <aside class="playlist-sidebar">
    <Sidebar cards={cards} playlistName={pageTitle} />
  </aside>
);
