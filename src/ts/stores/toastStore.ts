// =============================================================================
// Toast Store Architecture (Alpine-Free Singleton)
// =============================================================================

export type ToastType = "success" | "error" | "info";

export interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

export class ToastStore {
  public state: ToastState = {
    show: false,
    message: "",
    type: "success",
  };

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  private notify(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toast-state-changed"));
    }
  }

  get show(): boolean {
    return this.state.show;
  }

  get message(): string {
    return this.state.message;
  }

  get type(): ToastType {
    return this.state.type;
  }

  public trigger(
    message: string,
    type: ToastType = "success",
    duration = 3000,
  ): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.state.message = message;
    this.state.type = type;
    this.state.show = true;
    this.notify();

    this.timeoutId = setTimeout(() => {
      this.dismiss();
    }, duration);
  }

  public dismiss(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.state.show = false;
    this.notify();
  }
}

declare global {
  interface Window {
    toastStore?: ToastStore;
  }
}

export function initToastStore(): ToastStore {
  const store = new ToastStore();
  if (typeof window !== "undefined") {
    window.toastStore = store;
    window.UI?.registerStore("toast", "toastStore");
    window.UI?.listenToEvents("toast-state-changed");
  }
  return store;
}
