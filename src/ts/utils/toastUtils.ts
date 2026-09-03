// public/js/utils/toastUtils.ts

export interface ToastDetail {
  message: string;
  type?: "success" | "info" | "error";
  duration?: number;
}

export function initToastListener(
  containerId = "toast-container",
  defaultDuration = 3000,
): void {
  window.addEventListener("app-toast-trigger", ((
    e: CustomEvent<ToastDetail>,
  ) => {
    const {
      message,
      type = "info",
      duration = defaultDuration,
    } = e.detail || {};
    if (!message) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Show container
    container.style.display = "flex";

    // 1. Create toast pill
    const toast = document.createElement("div");
    toast.className = `toast-pill toast-${type}`;
    toast.textContent = message;

    // 2. Dismiss logic
    let isDismissing = false;
    const dismissToast = () => {
      if (isDismissing) return;
      isDismissing = true;

      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");

      toast.addEventListener("transitionend", () => {
        toast.remove();
        if (container.children.length === 0) {
          container.style.display = "none";
        }
      });
    };

    toast.addEventListener("click", dismissToast);
    container.appendChild(toast);

    // 3. Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    // 4. Auto-dismiss timer
    setTimeout(dismissToast, duration);
  }) as EventListener);
}
