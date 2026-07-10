window.addEventListener("DOMContentLoaded", (): void => {
  const prefetch = (url: string): void => {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);
    }
  };

  document.querySelectorAll(".artist-card").forEach((card) => {
    const href = card.getAttribute("href");
    if (href) {
      card.addEventListener("mouseover", () => prefetch(href), { once: true });
    }
  });
});
