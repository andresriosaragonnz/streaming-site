import { Sidebar } from "../../components/Sidebar";

export interface PrivateViewSidebarProps {
  cards: JSX.Element[];
}

export const PrivateViewSidebar = ({ cards }: PrivateViewSidebarProps) => (
  <aside class="playlist-sidebar">
    <Sidebar cards={cards} />
  </aside>
);
