console.log("IT’S ALIVE!");

// Helper: select multiple elements
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Pages for navigation
let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "https://github.com/natalie3huynh", title: "Profile" }
];

// Base path for GitHub Pages vs local
const BASE_PATH =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

/* =========================
   THEME SWITCHER (STEP 4.2–4.5)
========================= */

// Add UI
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="auto">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

// Get select element
const select = document.querySelector(".color-scheme select");

// Function to apply theme
function setColorScheme(mode) {
  if (mode === "auto") {
    document.documentElement.style.removeProperty("color-scheme");
  } else {
    document.documentElement.style.setProperty("color-scheme", mode);
  }

  select.value = mode;
}

// Listen for changes
select.addEventListener("input", (event) => {
  const mode = event.target.value;
  setColorScheme(mode);
  localStorage.colorScheme = mode;
});

// Load saved preference
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme("auto");
}

/* =========================
   NAVIGATION (STEP 3)
========================= */

// Create nav and insert into page
let nav = document.createElement("nav");
document.body.prepend(nav);

// Build navigation
for (let p of pages) {
  let url = p.url;

  // Fix internal links for deployment
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  // Create link element
  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // Highlight current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in new tab
  a.toggleAttribute("target", a.host !== location.host);

  // Add to nav
  nav.appendChild(a);
}