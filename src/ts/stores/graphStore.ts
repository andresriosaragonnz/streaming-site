// =============================================================================
// Graph Store Architecture
// =============================================================================

export interface GraphState {
  isGraphDrawerOpen: boolean;
  activeNodeLink: string;
}

export class GraphStore {
  public state: GraphState = {
    isGraphDrawerOpen: false,
    activeNodeLink: "",
  };

  /**
   * Emits custom event to notify binder.ts and network.js of reactive state updates.
   */
  private notify(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("graph-state-changed"));
    }
  }

  // ---------------------------------------------------------------------------
  // Getters for Binder & UI Expressions
  // ---------------------------------------------------------------------------

  get isDrawerOpen(): boolean {
    return this.state.isGraphDrawerOpen;
  }

  get activeNodeLink(): string {
    return this.state.activeNodeLink;
  }

  get activeNodeHref(): string {
    return this.state.activeNodeLink ? `/${this.state.activeNodeLink}` : "#";
  }

  // ---------------------------------------------------------------------------
  // Store Actions
  // ---------------------------------------------------------------------------

  public openDrawer(): void {
    this.state.isGraphDrawerOpen = true;
    this.notify();
  }

  public closeDrawer(): void {
    this.state.isGraphDrawerOpen = false;
    this.notify();
  }

  public toggleDrawer(): void {
    this.state.isGraphDrawerOpen = !this.state.isGraphDrawerOpen;
    this.notify();
  }

  public setActiveNode(link: string): void {
    this.state.activeNodeLink = link;
    this.notify();
  }
}

// ---------------------------------------------------------------------------
// Global Singleton Interface
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    graphStore?: GraphStore;
  }
}

export function initGraphStore(): GraphStore {
  const store = new GraphStore();
  if (typeof window !== "undefined") {
    window.graphStore = store;
  }
  return store;
}
