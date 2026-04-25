import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');

// update title with count
titleElement.textContent = `${projects.length} Projects`;

// render projects
renderProjects(projects, projectsContainer, 'h2');