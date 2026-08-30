export function ToastNotification() {
  return (
    <div
      x-data
      x-show="$store.toast.show"
      x-transition:enter="toast-enter"
      x-transition:enter-start="toast-enter-start"
      x-transition:enter-end="toast-enter-end"
      x-transition:leave="toast-leave"
      x-transition:leave-start="toast-leave-start"
      x-transition:leave-end="toast-leave-end"
      x-cloak
      class="toast-container"
      x-bind:class="$store.toast.type"
    >
      <div class="toast-content">
        <span
          x-text="$store.toast.type === 'success' ? '✓' : '⚠'"
          class="toast-icon"
        ></span>
        <span x-text="$store.toast.message" class="toast-message"></span>
        <button
          x-on:click="$store.toast.dismiss()"
          type="button"
          class="toast-close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
