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
      <p><strong>Year:</strong> ${project.year}</p>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;

    containerElement.appendChild(article);
  }
}