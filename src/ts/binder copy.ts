// =============================================================================
// 1. Types & Discriminated Actions
// =============================================================================

export type BinderAction =
  | "select-segment"
  | "toggle-class"
  | "open-modal"
  | "close-modal"
  | "toggle-drawer"
  | "reset-graph";

export interface SelectSegmentPayload {
  action: "select-segment";
  index: number;
}

export interface ToggleClassPayload {
  action: "toggle-class";
  targetSelector: string;
  className: string;
}

export interface ModalPayload {
  action: "open-modal" | "close-modal";
  modalId: string;
}

export interface DrawerPayload {
  action: "toggle-drawer";
  drawerId: string;
}

export interface ResetGraphPayload {
  action: "reset-graph";
}

export type ParsedActionPayload =
  | SelectSegmentPayload
  | ToggleClassPayload
  | ModalPayload
  | DrawerPayload
  | ResetGraphPayload;

declare global {
  interface Window {
    playerStore?: {
      selectSegment?: (index: number) => void;
    };
    graphStore?: {
      resetGraph?: () => void;
      closeDrawer?: () => void;
    };
  }
}

// =============================================================================
// 2. Static UI Namespace Class (Preserves JS Entry Points)
// =============================================================================

export class UI {
  /**
   * Toggles or enforces explicit CSS class states.
   */
  static handleClassRefresh(
    target: Element | null,
    classNames: string | string[],
    forceState: boolean | null = null,
  ): void {
    if (!target) return;

    const classes = Array.isArray(classNames)
      ? classNames
      : classNames.split(" ").filter(Boolean);

    classes.forEach((cls) => {
      if (forceState !== null) {
        target.classList.toggle(cls, forceState);
      } else {
        target.classList.toggle(cls);
      }
    });
  }

  /**
   * Safely sets element attributes without triggering re-renders.
   */
  static handleAttributeUpdate(
    target: Element | null,
    attrName: string,
    value: string | number | boolean,
  ): void {
    if (!target) return;
    target.setAttribute(attrName, String(value));
  }

  /**
   * Highlights active items in lists (e.g. sidebar segment lists).
   */
  static handleActiveItemRefresh(
    container: Element | null,
    activeIndex: number | string,
    activeClass: string = "is-active",
  ): void {
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>("[data-index]");

    items.forEach((item) => {
      const itemIdx = item.getAttribute("data-index");
      const isActive = String(itemIdx) === String(activeIndex);

      UI.handleClassRefresh(item, activeClass, isActive);
      UI.handleAttributeUpdate(item, "aria-selected", isActive);
    });
  }

  /**
   * Handles open/close state for modals and panels with scroll lock support.
   */
  static handleModalToggle(containerId: string, isOpen: boolean): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const overlay = container.querySelector(".graph-drawer-overlay");
    const panel = container.querySelector(".graph-drawer-panel") || container;

    UI.handleClassRefresh(overlay, "is-open", isOpen);
    UI.handleClassRefresh(panel, "is-open", isOpen);
    UI.handleClassRefresh(container, "is-open", isOpen);

    UI.handleAttributeUpdate(container, "aria-hidden", !isOpen);
    UI.handleClassRefresh(document.body, "modal-open", isOpen);
  }

  /**
   * Parses DOM element attributes into strongly-typed action payloads.
   */
  private static parseActionPayload(
    trigger: HTMLElement,
  ): ParsedActionPayload | null {
    const action = trigger.dataset.action as BinderAction | undefined;
    if (!action) return null;

    switch (action) {
      case "select-segment": {
        const rawIndex = trigger.dataset.index;
        if (rawIndex === undefined) return null;
        return { action: "select-segment", index: Number(rawIndex) };
      }

      case "toggle-class": {
        const targetSelector = trigger.dataset.target;
        if (!targetSelector) return null;
        return {
          action: "toggle-class",
          targetSelector,
          className: trigger.dataset.class || "active",
        };
      }

      case "open-modal":
      case "close-modal": {
        const modalId = trigger.dataset.modalId;
        if (!modalId) return null;
        return { action, modalId };
      }

      case "toggle-drawer": {
        const drawerId = trigger.dataset.drawerId || trigger.dataset.modalId;
        if (!drawerId) return null;
        return { action: "toggle-drawer", drawerId };
      }

      case "reset-graph": {
        return { action: "reset-graph" };
      }

      default: {
        const _exhaustiveCheck: never = action;
        return null;
      }
    }
  }

  /**
   * Global click event delegate.
   */
  private static handleGlobalClick(event: MouseEvent): void {
    const targetElement = event.target as Element | null;
    if (!targetElement) return;

    const trigger = targetElement.closest<HTMLElement>("[data-action]");
    if (!trigger) return;

    const payload = UI.parseActionPayload(trigger);
    if (!payload) return;

    switch (payload.action) {
      case "select-segment": {
        const listContainer = trigger.closest("#sidebar-scroll-list");
        UI.handleActiveItemRefresh(listContainer, payload.index);

        if (window.playerStore?.selectSegment) {
          window.playerStore.selectSegment(payload.index);
        }
        break;
      }

      case "toggle-class": {
        const targetEl = document.querySelector(payload.targetSelector);
        UI.handleClassRefresh(targetEl, payload.className);
        break;
      }

      case "open-modal": {
        UI.handleModalToggle(payload.modalId, true);
        break;
      }

      case "close-modal": {
        UI.handleModalToggle(payload.modalId, false);
        if (window.graphStore?.closeDrawer) {
          window.graphStore.closeDrawer();
        }
        break;
      }

      case "toggle-drawer": {
        const drawer = document.getElementById(payload.drawerId);
        const isCurrentlyOpen = drawer?.classList.contains("is-open") ?? false;
        UI.handleModalToggle(payload.drawerId, !isCurrentlyOpen);
        break;
      }

      case "reset-graph": {
        if (window.graphStore?.resetGraph) {
          window.graphStore.resetGraph();
        }
        break;
      }
    }
  }

  /**
   * Binds global document event delegation.
   */
  static init(): void {
    document.removeEventListener("click", UI.handleGlobalClick);
    document.addEventListener("click", UI.handleGlobalClick);
    console.log("⚡ [UI Binder] Delegates initialized.");
  }
}

// Auto-initialize when loaded directly in browser scripts
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => UI.init());
  } else {
    UI.init();
  }
}
