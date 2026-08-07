document.addEventListener("DOMContentLoaded", () => {
  renderPrivateBands();
  initSearchAutocomplete();
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

async function initSearchAutocomplete() {
  const searchInput = document.getElementById("search-input");
  const resultsContainer = document.getElementById("autocomplete-results");
  const searchToggle = document.getElementById("search-toggle");

  if (!searchInput || !resultsContainer) return;

  let options = [];
  let selectedIndex = -1;

  // Fetch search options endpoint after DOM load
  try {
    const res = await fetch("/api/search-options");
    if (res.ok) {
      options = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch search options:", e);
  }

  // Helper to highlight active item during arrow navigation
  function updateActiveHighlight(items) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  // Reset search state
  function resetSearch() {
    searchInput.value = "";
    resultsContainer.innerHTML = "";
    selectedIndex = -1;
  }

  // Auto-focus input when search panel opens
  if (searchToggle) {
    searchToggle.addEventListener("change", () => {
      if (searchToggle.checked) {
        setTimeout(() => searchInput.focus(), 100);
      } else {
        resetSearch();
      }
    });
  }

  // Filter and render matching items on typing
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase().replace(" ", "_");
    resultsContainer.innerHTML = "";
    selectedIndex = -1;

    if (!query) return;

    const matches = options.filter((item) =>
      item.toLowerCase().includes(query),
    );

    matches.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `/${item}`;
      a.className = "autocomplete-item";
      a.textContent = item.replaceAll("_", " ");

      li.appendChild(a);
      resultsContainer.appendChild(li);
    });

    // When exactly 1 option remains, auto-fill input text
    if (matches.length === 1) {
      const formattedName = matches[0].replaceAll("_", " ");
      searchInput.value = formattedName;
      selectedIndex = 0;

      // Highlight the single remaining item
      const renderedItems =
        resultsContainer.querySelectorAll(".autocomplete-item");
      updateActiveHighlight(renderedItems);
    }
  });

  // Keyboard navigation (Enter, Arrow Down, Arrow Up, Tab)
  searchInput.addEventListener("keydown", (e) => {
    const renderedItems =
      resultsContainer.querySelectorAll(".autocomplete-item");
    if (renderedItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % renderedItems.length;
      updateActiveHighlight(renderedItems);
      searchInput.value = renderedItems[selectedIndex].textContent;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex =
        (selectedIndex - 1 + renderedItems.length) % renderedItems.length;
      updateActiveHighlight(renderedItems);
      searchInput.value = renderedItems[selectedIndex].textContent;
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
      if (renderedItems[targetIndex]) {
        renderedItems[targetIndex].click();
      }
    }
  });
}
