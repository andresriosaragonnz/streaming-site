document.addEventListener("DOMContentLoaded", () => {
  if (!window.matchMedia("(hover: hover)").matches) return;

  const fadeImg = document.getElementById("hero-img-fade");
  if (!fadeImg) return;

  let activePreloader = null;

  document.addEventListener("pointerover", (e) => {
    const card = e.target.closest(".card[data-bg]");
    if (!card) return;

    const bgPath = card.getAttribute("data-bg");
    if (!bgPath) return;

    const cleanPath = bgPath.replace(/\/$/, "");
    const targetUrl = `${cleanPath}/desktop.jpg`;

    // Set target URL on fade element immediately
    fadeImg.src = targetUrl;

    const preloader = new Image();
    activePreloader = preloader;

    preloader.onload = () => {
      if (activePreloader === preloader) {
        requestAnimationFrame(() => {
          fadeImg.classList.add("is-active");
        });
      }
    };

    preloader.src = targetUrl;

    // Handle cached images instantly
    if (preloader.complete) {
      requestAnimationFrame(() => {
        fadeImg.classList.add("is-active");
      });
    }
  });

  document.addEventListener("pointerout", (e) => {
    const card = e.target.closest(".card[data-bg]");
    if (card && !card.contains(e.relatedTarget)) {
      activePreloader = null;
      fadeImg.classList.remove("is-active");
    }
  });
});
