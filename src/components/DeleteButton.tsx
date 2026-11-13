export interface DeleteButtonProps {
  id?: string;
  action?: string;
  label?: string;
}

export const DeleteButton = ({ id = "", action }: DeleteButtonProps) => {
  return (
    <button
      type="button"
      class="btn btn-delete-icon"
      data-action={action}
      data-id={id}
      title="Delete Item"
      aria-label="Delete"
    >
      {/* Crisp 16x16 Trash Icon SVG */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="square"
        stroke-linejoin="miter"
      >
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
};
