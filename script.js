// Unsplash Image Search - Vanilla JS
// Replace ACCESS_KEY with your Unsplash access key. Get one at https://unsplash.com/developers

const ACCESS_KEY = "vsIF3wBAPvdD8Hq32kPd8xN5uBtT87EtTcmgmIM-h68"; // <-- replace this

// DOM elements
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const statusEl = document.getElementById("status");
const gallery = document.getElementById("gallery");

// Helpers
function setStatus(message) {
    if (!message) {
        statusEl.textContent = "";
        statusEl.classList.add("hidden");
        return;
    }
    statusEl.textContent = message;
    statusEl.classList.remove("hidden");
}

function clearGallery() {
    gallery.innerHTML = "";
}

function createImageCard(photo) {
    const altText = photo.alt_description || photo.description || "Unsplash photo";
    const photographer = (photo.user && photo.user.name) ? photo.user.name : "Unknown";
    const photoPageUrl = photo.links && photo.links.html ? photo.links.html : photo.urls.raw;

    const card = document.createElement("article");
    card.className = "card";

    const media = document.createElement("div");
    media.className = "card-media";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = altText;
    img.src = photo.urls.small;
    img.srcset = [
        `${photo.urls.small} 400w`,
        `${photo.urls.regular} 1080w`,
    ].join(", ");
    img.sizes = "(max-width: 640px) 160px, (max-width: 1024px) 220px, 300px";

    media.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("p");
    title.className = "card-title";
    title.textContent = altText;

    const byline = document.createElement("p");
    byline.className = "byline";
    byline.innerHTML = `by <strong>${escapeHtml(photographer)}</strong> · <a href="${photoPageUrl}" target="_blank" rel="noopener noreferrer">View on Unsplash</a>`;

    body.appendChild(title);
    body.appendChild(byline);

    card.appendChild(media);
    card.appendChild(body);
    return card;
}

// Simple HTML escape for injected text content in innerHTML
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function searchUnsplash(query) {
    if (!ACCESS_KEY || ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
        throw new Error("Please set your Unsplash ACCESS_KEY in script.js");
    }

    const encoded = encodeURIComponent(query.trim());
    const url = `https://api.unsplash.com/search/photos?query=${encoded}&per_page=30&client_id=${ACCESS_KEY}`;
    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`.trim());
    }
    const data = await response.json();
    return data;
}

function renderResults(results) {
    clearGallery();

    if (!results || !Array.isArray(results.results) || results.results.length === 0) {
        setStatus("No results found.");
        return;
    }

    setStatus("");
    const fragment = document.createDocumentFragment();
    for (const photo of results.results) {
        fragment.appendChild(createImageCard(photo));
    }
    gallery.appendChild(fragment);
}

// Form submit handler
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = input.value.trim();

    if (!query) {
        setStatus("Please enter a search term.");
        input.focus();
        return;
    }

    setStatus("Loading…");
    clearGallery();

    try {
        const data = await searchUnsplash(query);
        renderResults(data);
    } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
    }
});

// Focus the input on load for quick searching
window.addEventListener("DOMContentLoaded", () => {
    input.focus();
});


