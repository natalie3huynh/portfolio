import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

/* =========================
   GLOBAL SCALES (STEP 5 FIX)
========================= */
let xScale;
let yScale;

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

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  const maxDepth = d3.max(data, d => d.depth);
  dl.append('dt').text('Max Depth');
  dl.append('dd').text(maxDepth);

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

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

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
     SCALES (GLOBAL)
  ========================= */
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  /* =========================
     RADIUS SCALE
  ========================= */
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  /* =========================
     SORT (overlap fix)
  ========================= */
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  /* =========================
     GRIDLINES
  ========================= */
  const gridlines = svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  /* =========================
     AXES
  ========================= */
  const xAxis = d3.axisBottom(xScale);

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

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
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  /* =========================
     BRUSH (STEP 5)
  ========================= */
  const brush = d3.brush()
    .on('start brush end', brushed);

  svg.call(brush);

  // FIX TOOLTIP + DOT OVERLAY ISSUE
  svg.selectAll('.dots, .overlay ~ *').raise();
}

/* =========================
   BRUSH LOGIC
========================= */
function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle')
    .classed('selected', d => isSelected(selection, d));

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

/* =========================
   TOOLTIP
========================= */
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });

  time.textContent = commit.time || '';
  author.textContent = commit.author || '';
  lines.textContent = commit.totalLines ?? '';
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');

  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

/* =========================
   SELECTION UI
========================= */
function renderSelectionCount(selection) {
  const selected = selection
    ? commitsGlobal.filter(d => isSelected(selection, d))
    : [];

  const el = document.querySelector('#selection-count');

  el.textContent = selected.length
    ? `${selected.length} commits selected`
    : 'No commits selected';
}

function renderLanguageBreakdown(selection) {
  const container = document.getElementById('language-breakdown');

  const selected = selection
    ? commitsGlobal.filter(d => isSelected(selection, d))
    : commitsGlobal;

  const lines = selected.flatMap(d => d.lines);

  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  container.innerHTML = '';

  for (const [lang, count] of breakdown) {
    const pct = d3.format('.1~%')(count / lines.length);

    container.innerHTML += `
      <dt>${lang}</dt>
      <dd>${count} (${pct})</dd>
    `;
  }
}

/* =========================
   INIT
========================= */
let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
