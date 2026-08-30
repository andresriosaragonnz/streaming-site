import { Sidebar } from "../../components/Sidebar";

export interface PlaylistViewSidebarProps {
  artistLink: string;
  artistName: string;
  cards: JSX.Element[];
}

export const PlaylistViewSidebar = ({
  artistLink,
  artistName,
  cards,
}: PlaylistViewSidebarProps) => (
  <aside class="playlist-sidebar">
    <div id="sidebar-artist" class="sidebar-artist-container">
      <a
        class="sidebar-artist-button"
        id="sidebar-artist-button"
        href={`/${artistLink}`}
        x-bind:href="'/' + $store.player.segments[$store.player.currentIndex].artistName"
        x-text="$store.player.segments[$store.player.currentIndex].formattedArtist"
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
