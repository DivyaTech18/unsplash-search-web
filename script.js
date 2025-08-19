// Unsplash Image Search - Vanilla JS
// Replace ACCESS_KEY with your Unsplash access key. Get one at https://unsplash.com/developers

const ACCESS_KEY = "vsIF3wBAPvdD8Hq32kPd8xN5uBtT87EtTcmgmIM-h68"; // <-- replace this

// DOM elements
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const statusEl = document.getElementById("status");
const gallery = document.getElementById("gallery");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const searchHistory = document.getElementById("search-history");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
const loadMoreContainer = document.getElementById("load-more-container");
const loadMoreBtn = document.getElementById("load-more-btn");

// State
let currentQuery = "";
let currentPage = 1;
let hasMoreResults = false;
let searchHistoryData = JSON.parse(localStorage.getItem("unsplashSearchHistory") || "[]");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    input.focus();
    loadTheme();
    renderSearchHistory();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    form.addEventListener("submit", handleSearch);
    themeToggle.addEventListener("click", toggleTheme);
    clearHistoryBtn.addEventListener("click", clearHistory);
    loadMoreBtn.addEventListener("click", loadMore);
    
    // Infinite scroll
    window.addEventListener("scroll", handleScroll);
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem("unsplashTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("unsplashTheme", newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === "light" ? "🌙" : "☀️";
}

// Search History Management
function addToHistory(query) {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return;
    
    // Remove if already exists
    searchHistoryData = searchHistoryData.filter(item => item !== trimmedQuery);
    
    // Add to beginning
    searchHistoryData.unshift(trimmedQuery);
    
    // Keep only last 5
    searchHistoryData = searchHistoryData.slice(0, 5);
    
    localStorage.setItem("unsplashSearchHistory", JSON.stringify(searchHistoryData));
    renderSearchHistory();
}

function renderSearchHistory() {
    if (searchHistoryData.length === 0) {
        searchHistory.classList.add("hidden");
        return;
    }
    
    searchHistory.classList.remove("hidden");
    historyList.innerHTML = "";
    
    searchHistoryData.forEach(query => {
        const item = document.createElement("span");
        item.className = "history-item";
        item.textContent = query;
        item.addEventListener("click", () => {
            input.value = query;
            handleSearch(new Event("submit"));
        });
        historyList.appendChild(item);
    });
}

function clearHistory() {
    searchHistoryData = [];
    localStorage.removeItem("unsplashSearchHistory");
    renderSearchHistory();
}

// Search Functions
async function handleSearch(event) {
    event.preventDefault();
    const query = input.value.trim();

    if (!query) {
        setStatus("Please enter a search term.");
        input.focus();
        return;
    }

    currentQuery = query;
    currentPage = 1;
    addToHistory(query);
    
    setStatus("Loading…");
    clearGallery();
    hideLoadMore();

    try {
        const data = await searchUnsplash(query, currentPage);
        renderResults(data, true);
    } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
    }
}

async function loadMore() {
    if (!currentQuery || !hasMoreResults) return;
    
    currentPage++;
    setStatus("Loading more images…");
    
    try {
        const data = await searchUnsplash(currentQuery, currentPage);
        renderResults(data, false);
    } catch (err) {
        console.error(err);
        setStatus("Failed to load more images. Please try again.");
        currentPage--; // Revert on error
    }
}

// Infinite Scroll
function handleScroll() {
    if (!hasMoreResults || !loadMoreContainer.classList.contains("hidden")) return;
    
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMore();
    }
}

// API Functions
async function searchUnsplash(query, page = 1) {
    if (!ACCESS_KEY || ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
        throw new Error("Please set your Unsplash ACCESS_KEY in script.js");
    }

    const encoded = encodeURIComponent(query.trim());
    const url = `https://api.unsplash.com/search/photos?query=${encoded}&per_page=20&page=${page}&client_id=${ACCESS_KEY}`;
    
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

// UI Functions
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

function showLoadMore() {
    loadMoreContainer.classList.remove("hidden");
}

function hideLoadMore() {
    loadMoreContainer.classList.add("hidden");
}

function renderResults(results, isNewSearch) {
    if (!results || !Array.isArray(results.results) || results.results.length === 0) {
        if (isNewSearch) {
            setStatus("No results found.");
        }
        hideLoadMore();
        return;
    }

    setStatus("");
    
    // Check if there are more results
    hasMoreResults = results.results.length === 20; // Unsplash per_page limit
    
    if (isNewSearch) {
        clearGallery();
    }
    
    const fragment = document.createDocumentFragment();
    for (const photo of results.results) {
        fragment.appendChild(createImageCard(photo));
    }
    
    if (isNewSearch) {
        gallery.appendChild(fragment);
    } else {
        gallery.appendChild(fragment);
    }
    
    // Show/hide load more button
    if (hasMoreResults) {
        showLoadMore();
    } else {
        hideLoadMore();
    }
}

function createImageCard(photo) {
    const altText = photo.alt_description || photo.description || "Unsplash photo";
    const photographer = (photo.user && photo.user.name) ? photo.user.name : "Unknown";
    const photoPageUrl = photo.links && photo.links.html ? photo.links.html : photo.urls.raw;
    const downloadUrl = photo.links && photo.links.download ? photo.links.download : photo.urls.full;

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
    img.sizes = "(max-width: 640px) 160px, (max-width: 1024px) 280px, 300px";

    media.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("p");
    title.className = "card-title";
    title.textContent = altText;

    const byline = document.createElement("p");
    byline.className = "byline";
    byline.innerHTML = `by <strong>${escapeHtml(photographer)}</strong> · <a href="${photoPageUrl}" target="_blank" rel="noopener noreferrer">View on Unsplash</a>`;

    // Stats
    const stats = document.createElement("div");
    stats.className = "card-stats";
    
    if (photo.likes !== undefined) {
        const likes = document.createElement("div");
        likes.className = "stat-item";
        likes.innerHTML = `❤️ ${photo.likes.toLocaleString()}`;
        stats.appendChild(likes);
    }
    
    if (photo.downloads !== undefined) {
        const downloads = document.createElement("div");
        downloads.className = "stat-item";
        downloads.innerHTML = `⬇️ ${photo.downloads.toLocaleString()}`;
        stats.appendChild(downloads);
    }

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "card-actions";
    
    const viewBtn = document.createElement("button");
    viewBtn.className = "action-btn";
    viewBtn.textContent = "View Full";
    viewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.open(photo.urls.full, "_blank");
    });
    
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "action-btn";
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadImage(downloadUrl, altText);
    });

    actions.appendChild(viewBtn);
    actions.appendChild(downloadBtn);

    body.appendChild(title);
    body.appendChild(byline);
    if (stats.children.length > 0) {
        body.appendChild(stats);
    }
    body.appendChild(actions);

    card.appendChild(media);
    card.appendChild(body);
    
    // Make entire card clickable to open full image
    card.addEventListener("click", () => {
        window.open(photo.urls.full, "_blank");
    });
    
    return card;
}

// Download function
async function downloadImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${filename || "unsplash-image"}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("Download failed:", error);
        // Fallback: open in new tab
        window.open(url, "_blank");
    }
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


