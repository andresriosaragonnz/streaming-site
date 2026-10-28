import type { ArchNodeProps } from "../types";

export function ArchNode({
  id,
  title,
  subtitle,
  badge,
  x,
  y,
  state = "default",
  children,
}: ArchNodeProps) {
  const stateClass = state !== "default" ? `state-${state}` : "";

  return (
    <div
      id={`node-${id}`}
      class={`arch-node ${stateClass}`}
      style={`left: ${x}px; top: ${y}px;`}
    >
      <div class="arch-node-header">
        <span class="arch-node-title">{title}</span>
        {badge && <span class="arch-node-badge">{badge}</span>}
      </div>
      {subtitle && <div class="arch-node-subtitle">{subtitle}</div>}
      {children && <div class="node-content-box">{children}</div>}
    </div>
  );
}
