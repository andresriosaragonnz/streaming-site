import { Sidebar } from "../../../components/Sidebar";

export interface PublicViewSidebarProps {
  artistLink: string;
  artistName: string;
  cards: JSX.Element[];
}

export const PublicViewSidebar = ({
  artistLink,
  artistName,
  cards,
}: PublicViewSidebarProps) => (
  <aside class="playlist-sidebar">
    <div id="sidebar-artist" class="sidebar-artist-container">
      <a
        class="sidebar-artist-button"
        id="sidebar-artist-button"
        href={`/${artistLink}`}
      >
        {artistName}
      </a>

      <button
        type="button"
        class="sidebar-artist-button"
        x-on:click="$store.follows.toggleFollow()"
        x-text="$store.follows.isFollowing() ? 'Unfollow':'Follow'"
      >
        Follow
      </button>
    </div>
    <Sidebar cards={cards} />
  </aside>
);
