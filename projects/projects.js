import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let selectedYear = null;
let query = '';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
let searchInput = document.querySelector('.searchBar');

titleElement.textContent = `${projects.length} Projects`;

/*grid filtering*/
function getGridProjects(baseProjects) {
  let filtered = baseProjects;

  filtered = filtered.filter(project => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  if (selectedYear) {
    filtered = filtered.filter(p => p.year === selectedYear);
  }

  return filtered;
}

/*pie filtering*/
function getPieData(baseProjects) {
  return baseProjects.filter(project => {
    let values = Object.values(project).join('\n').toLowerCase();
    //applies search but not year
    return values.includes(query.toLowerCase());
  });
}

/*pie chart based on data*/
function renderPieChart(baseData) {
  let svg = d3.select('#projects-pie-plot');
  let legend = d3.select('.legend');

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  let rolledData = d3.rollups(
    baseData,
    v => v.length,
    d => d.year
  );

  let data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  let sliceGenerator = d3.pie().value(d => d.value);
  let arcData = sliceGenerator(data);

  let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

/*pie selection and deselection*/
  svg.selectAll('path')
    .data(arcData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i))
    .classed('selected', d => d.data.label === selectedYear)
    .on('click', (event, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;

      renderAll(); // IMPORTANT: full re-render, NOT pie filtering
    });

/*legend*/
  legend.selectAll('li')
    .data(data)
    .join('li')
    .attr('style', (d, i) => `--color:${colors(i)}`)
    .classed('selected', d => d.label === selectedYear)
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('click', (event, d) => {
      selectedYear = selectedYear === d.label ? null : d.label;

      renderAll(); // same fix
    });
}

/*render*/
//purpose: recompute filtered data for grid and for pie chart 
//while resetting and rebuilding and not updating 
//but both interactions (pie click and search bar use it) 
//so each would recompute filters independently 
function renderAll() {
  const gridData = getGridProjects(projects);
  //relies solely on query and not the selected year 
  const pieData = getPieData(projects);
//rebuild pie and grid so filters are applied independently
  renderProjects(gridData, projectsContainer, 'h2');
  renderPieChart(pieData);
}

renderAll();

/*search bar*/
//queries what the user types, but makes the selected year null
//so the selection is erased
searchInput.addEventListener('change', (event) => {
  query = event.target.value;
  selectedYear = null;
  renderAll();
});