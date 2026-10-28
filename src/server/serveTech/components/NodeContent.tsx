import type { Mp4CardProps, FragmentGridProps } from "../types";

export function Mp4Card({
  filename,
  filesize,
  isFragmenting = false,
}: Mp4CardProps) {
  return (
    <div id="mp4Card" class={`mp4-card ${isFragmenting ? "fragmenting" : ""}`}>
      <div class="mp4-card-title">{filename}</div>
      <div class="mp4-card-meta">{filesize} | Single File</div>
    </div>
  );
}

export function FragmentGrid({
  segmentCount = 8,
  visibleCount = 0,
}: FragmentGridProps) {
  const segments = Array.from({ length: segmentCount }, (_, i) => i);

  return (
    <div id="fragGrid" class="fragment-grid">
      {segments.map((i) => {
        const isVisible = i < visibleCount;
        return (
          <div
            id={`seg-${i}`}
            class={`fragment-cell ${isVisible ? "visible active" : ""}`}
          >
            {`seg_${i}.ts`}
          </div>
        );
      })}
    </div>
  );
}
