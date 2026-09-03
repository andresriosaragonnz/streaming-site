export interface ToastContainerProps {
  id?: string;
}

export const ToastContainer = ({
  id = "toast-container",
}: ToastContainerProps) => <div id={id} class="toast-container" />;
