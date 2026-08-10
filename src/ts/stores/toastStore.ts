export function initToastStore(Alpine: any): void {
  Alpine.store("toast", {
    show: false,
    message: "",
    type: "success" as "success" | "error" | "info",
    timeoutId: null as any,

    trigger(
      message: string,
      type: "success" | "error" | "info" = "success",
      duration = 3000,
    ) {
      // Clear any existing timeout if a new toast arrives quickly
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.message = message;
      this.type = type;
      this.show = true;

      this.timeoutId = setTimeout(() => {
        this.show = false;
      }, duration);
    },

    dismiss() {
      this.show = false;
    },
  });
}
