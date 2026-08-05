document.addEventListener("DOMContentLoaded", () => {
  renderPrivateBands();
});

function getPrivateBands() {
  const rawData = localStorage.getItem("allowed_bands");
  if (!rawData) return [];

  const bands = JSON.parse(rawData);
  return bands;
}

function renderPrivateBands() {
  const section = document.getElementById("private-bands-section");
  const list = document.getElementById("private-bands-list");

  if (!section || !list) return;

  try {
    const bands = getPrivateBands();
    // Clear existing content to prevent duplicates
    list.innerHTML = "";

    bands.forEach((bandSlug) => {
      const li = document.createElement("li");
      const a = document.createElement("a");

      a.href = `/private/${bandSlug}`;
      a.className = "drawer-link drawer-sublink";

      // Format "freddie-mercury" -> "Freddie Mercury"
      a.textContent = bandSlug
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      li.appendChild(a);
      list.appendChild(li);
    });

    // Unhide the private bands section
    section.style.display = "block";

    // add private Link
    const peformanceLink = document.getElementById("performance-link");
    if (!peformanceLink) {
      return;
    }
    const currentArtist = peformanceLink.getAttribute("data-artist");
    if (bands.includes(currentArtist)) {
      console.log({ currentArtist }, "allowed");
      const a = document.createElement("a");
      a.href = `/private/${currentArtist}`;
      a.textContent = "See Private dashboard";

      peformanceLink.appendChild(a);
    }
  } catch (e) {
    console.error("Failed to read allowed_bands from localStorage:", e);
  }
}
