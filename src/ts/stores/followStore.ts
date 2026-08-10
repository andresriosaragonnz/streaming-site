export function initFollowStore(Alpine: any): void {
  const SUBSCRIPTION_STORAGE_KEY = "user_subscriptions";

  Alpine.store("follows", {
    // 1. Initial synchronous state
    stories: [] as any[], // Default empty array until fetch resolves
    artists: [] as string[],

    // 2. Alpine automatically calls init() when registering the store
    async init() {
      // Load saved artists from localStorage
      try {
        const saved = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
        this.artists = saved ? JSON.parse(saved) : [];
      } catch (err) {
        console.error(
          "Failed to load followed artists from localStorage:",
          err,
        );
        this.artists = [];
      }

      // Fetch latest items/stories if user follows any artists
      if (this.artists.length > 0) {
        await this.fetchLatestStories();
      }
    },

    getFeed() {
      console.log(this.stories);
      return this.stories;
    },
    // 3. Separate async method to fetch latest artist updates
    async fetchLatestStories(): Promise<void> {
      if (this.artists.length === 0) {
        this.stories = [];
        return;
      }

      try {
        // Pass followed artist IDs to your backend feed endpoint
        const response = await fetch("/api/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistIds: this.artists }),
        });

        if (!response.ok) throw new Error("Failed to fetch stories feed");

        const data = (await response.json()) as any;
        this.stories = data.updates || [];
      } catch (err) {
        console.error("Error fetching followed stories:", err);
      }
    },

    // Helper check
    isFollowing(): boolean {
      const { segments, currentIndex } = Alpine.store("player");
      const currentArtist = segments?.[currentIndex]?.artistId;
      return this.artists.includes(currentArtist);
    },

    // Toggle follow state
    toggleFollow(): void {
      const { segments, currentIndex } = Alpine.store("player");

      const currentArtist = segments?.[currentIndex]?.artistId;
      if (!currentArtist) return;

      if (this.artists.includes(currentArtist)) {
        this.artists = this.artists.filter((id: any) => id !== currentArtist);
        Alpine.store("toast")?.trigger?.(`Unfollowed ${currentArtist}`, "info");
      } else {
        this.artists.push(currentArtist);
        Alpine.store("toast")?.trigger?.(
          `Following ${currentArtist}!`,
          "success",
        );
      }

      this.saveToLocalStorage();

      // Refresh the stories feed asynchronously whenever follow status changes
      this.fetchLatestStories();
    },

    // Save state to localStorage
    saveToLocalStorage(): void {
      try {
        localStorage.setItem(
          SUBSCRIPTION_STORAGE_KEY,
          JSON.stringify(this.artists),
        );
      } catch (err) {
        console.error("Failed to save followed artists to localStorage:", err);
      }
    },
  });
}
