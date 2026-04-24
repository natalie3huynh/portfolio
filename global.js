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

//Switch Theme: light, dark, automatic

// UI
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

// theme application
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

/* Navigation bar*/

// Create nav and insert into page
let nav = document.createElement("nav");
document.body.prepend(nav);

// Build navigation
for (let p of pages) {
  let url = p.url;


  url = !url.startsWith("http") ? BASE_PATH + url : url;

  //link element
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

// Get form (only exists on contact page)
const form = document.querySelector("form");

form?.addEventListener("submit", (event) => {
  event.preventDefault(); // stop default mailto behavior

  const data = new FormData(form);

  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const url = `${form.action}?${params.join("&")}`;

  // Open email client with properly encoded fields
  location.href = url;
});

//step 1.2
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    
    //error handling
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    //data parsing
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

//better testing
// fetchJSON('../lib/projects.json').then(data => {
//   console.log("DATA:", data);
// });
//adding project rendering function
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Validate container
  if (!containerElement) {
    console.error("Invalid container element");
    return;
  }

  // Clear existing content
  containerElement.innerHTML = '';

  // Handle empty data
  if (!projects || projects.length === 0) {
    containerElement.innerHTML = "<p>No projects available.</p>";
    return;
  }

  // Loop through each project
  for (let project of projects) {
    const article = document.createElement('article');

    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;

    containerElement.appendChild(article);
  }
}