// Inside createGraphStore() in public/js/stores/graphStore.ts

export function createGraphStore() {
  const rawState = {
    isGraphDrawerOpen: false,
    activeNodeLink: "",
  };

  const state = new Proxy(rawState, {
    set(target, prop, value) {
      (target as any)[prop] = value;
      window.dispatchEvent(
        new CustomEvent("graph-state-changed", { detail: store }),
      );
      return true;
    },
  });

  const store = {
    state,

    get activeNodeHref(): string {
      return state.activeNodeLink ? `/${state.activeNodeLink}` : "#";
    },

    openDrawer(): void {
      state.isGraphDrawerOpen = true;
    },

    closeDrawer(): void {
      state.isGraphDrawerOpen = false;
    },

    setActiveNode(link: string): void {
      state.activeNodeLink = link;
    },
  };

  return store;
}
