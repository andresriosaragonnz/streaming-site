export const Toast = () => (
  <div
    id="toast-notification"
    class="toast-container"
    data-bind-class="toast.show ? 'toast-container is-visible' : 'toast-container'"
  >
    <div
      class="toast-content"
      data-bind-class="`toast-content toast-${toast.type}`"
    >
      <span data-bind-text="toast.message"></span>
      <button
        type="button"
        class="toast-dismiss"
        data-action="dismiss-toast"
        aria-label="Close Toast"
      >
        ×
      </button>
    </div>
  </div>
);
