import { handleMyPlaylistsRedirect } from "./utils/playlistUtils";
// Call on initial DOM load or page script execution
document.addEventListener("DOMContentLoaded", () => {
  handleMyPlaylistsRedirect();
});
