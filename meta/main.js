import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

/* =========================
   GLOBAL SCALES
========================= */
let xScale;
let yScale;

/* needed for selection logic */
let commitsGlobal = [];

/* =========================
   LOAD DATA
========================= */
async function loadData() {
  return await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
}

/* =========================
   PROCESS COMMITS
========================= */
function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    let first = lines[0];

    return {
      id: commit,
      url: 'https://github.com/natalie3huynh/portfolio/commit/' + commit,
      author: first.author,
      date: first.date,
      time: first.time,
      timezone: first.timezone,
      datetime: first.datetime,
      hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines
    };
  });
}

/* =========================
   STATS
========================= */
function renderCommitInfo(data, commits) {
  const container = d3.select('#stats');

  container.append('h2')
    .attr('class', 'stats-title')
    .text('Summary');

  const dl = container.append('dl').attr('class', 'stats');

  dl.append('dt').text('Total LOC');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.group(data, d => d.file).size);

  dl.append('dt').text('Max Depth');
  dl.append('dd').text(d3.max(data, d => d.depth));

  const longestLine = d3.greatest(data, d => d.length);
  dl.append('dt').text('Longest line');
  dl.append('dd').text(longestLine.length);
}

/* =========================
   SCATTERPLOT
========================= */
function renderScatterPlot(data, commits) {
  commitsGlobal = commits;

  const width = 1000;
  const height = 600;

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  /* =========================
     SVG (FIXED RESPONSIVE)
  ========================= */
  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  /* =========================
     SCALES
  ========================= */
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(commits, d => -d.totalLines);
/* =========================
   AXES + GRID
========================= */

/* GRIDLINES (soft + controlled styling) */
const gridlines = svg.append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left},0)`);

gridlines.call(
  d3.axisLeft(yScale)
    .tickSize(-usableArea.width)
    .tickFormat('')
);

/* soften gridlines (IMPORTANT: JS override fixes CSS issues) */
gridlines.selectAll('line')
  .attr('stroke', '#e6e6e6')
  .attr('stroke-opacity', 0.15)
  .attr('stroke-width', 0.5);

gridlines.selectAll('.domain')
  .attr('stroke', 'none');


/* X AXIS (bottom) */
svg.append('g')
  .attr('transform', `translate(0,${usableArea.bottom})`)
  .call(d3.axisBottom(xScale));


/* Y AXIS (left, labeled) */
svg.append('g')
  .attr('transform', `translate(${usableArea.left},0)`)
  .call(
    d3.axisLeft(yScale)
      .tickFormat(d => `${d}:00`)
  );

  /* =========================
     DOTS
  ========================= */
  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7);

  createBrushSelector(svg);
}

/* =========================
   BRUSH
========================= */
function createBrushSelector(svg) {
  const brush = d3.brush()
    .on('start brush end', brushed);

  svg.call(brush);

  svg.selectAll('.dots, .overlay ~ *').raise();
}

/* =========================
   BRUSH HANDLER
========================= */
function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle')
    .classed('selected', d => isCommitSelected(selection, d));

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

/* =========================
   SELECTION CHECK
========================= */
function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

/* =========================
   SELECTION COUNT
========================= */
function renderSelectionCount(selection) {
  const selected = selection
    ? commitsGlobal.filter(d => isCommitSelected(selection, d))
    : [];

  document.querySelector('#selection-count').textContent =
    `${selected.length || 'No'} commits selected`;
}

/* =========================
   LANGUAGE BREAKDOWN
========================= */
function renderLanguageBreakdown(selection) {
  const selected = selection
    ? commitsGlobal.filter(d => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');

  if (!selected.length) {
    container.innerHTML = '';
    return;
  }

  const lines = selected.flatMap(d => d.lines);

  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type
  );

  container.innerHTML = '';

  for (const [lang, count] of breakdown) {
    const pct = d3.format('.1~%')(count / lines.length);

    container.innerHTML += `
      <dt>${lang}</dt>
      <dd>${count} lines (${pct})</dd>
    `;
  }
}

/* =========================
   TOOLTIP
========================= */
function renderTooltipContent(commit) {
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;

  document.getElementById('commit-date').textContent =
    commit.datetime?.toLocaleString('en', { dateStyle: 'full' });

  document.getElementById('commit-time').textContent = commit.time || '';
  document.getElementById('commit-author').textContent = commit.author || '';
  document.getElementById('commit-lines').textContent = commit.totalLines ?? '';
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');

  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

/* =========================
   INIT
========================= */
const data = await loadData();
const commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);