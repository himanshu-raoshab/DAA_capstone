const state = {
  scenario: 'city',
  metric: 'time',
  traffic: 1.0,
  from: 'UNI',
  to: 'AIR',
  graph: null,
  benchmark: null,
};

const el = (id) => document.getElementById(id);

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  const activate = (tabName) => {
    buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));
    panels.forEach((p) => p.classList.toggle('active', p.id === `tab-${tabName}`));
    if (tabName === 'benchmark' && !state.benchmark) {
      loadBenchmark(false);
    }
    if (tabName === 'negative') {
      loadNegativeLab();
    }
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => activate(btn.dataset.tab));
  });

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab');
  if (initialTab && ['route', 'benchmark', 'negative'].includes(initialTab)) {
    activate(initialTab);
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function populateNodeSelects(nodes) {
  const fromSel = el('from-select');
  const toSel = el('to-select');
  const prevFrom = state.from;
  const prevTo = state.to;

  fromSel.innerHTML = '';
  toSel.innerHTML = '';
  for (const n of nodes) {
    fromSel.add(new Option(`${n.id} — ${n.name}`, n.id));
    toSel.add(new Option(`${n.id} — ${n.name}`, n.id));
  }

  const ids = nodes.map((n) => n.id);
  state.from = ids.includes(prevFrom) ? prevFrom : ids[0];
  state.to = ids.includes(prevTo) ? prevTo : ids[ids.length - 1];
  fromSel.value = state.from;
  toSel.value = state.to;
}

async function computeRoute() {
  const params = new URLSearchParams({
    scenario: state.scenario,
    metric: state.metric,
    traffic: String(state.traffic),
    from: state.from,
    to: state.to,
    allowUnsafe: state.scenario !== 'city' ? 'true' : 'false',
  });

  const data = await fetchJson(`/api/route?${params.toString()}`);
  state.graph = data.graph;

  if (el('from-select').options.length !== data.graph.nodes.length) {
    populateNodeSelects(data.graph.nodes);
  }

  el('map-title').textContent = data.graph.name;
  el('graph-stats').textContent = `${data.graph.vertexCount} Vertices · ${data.graph.directedEdgeCount} Directed Edges`;

  const bestPath = data.bellmanFord.found ? data.bellmanFord.path : data.dijkstra.path;
  renderGraphSvg(el('city-svg'), data.graph, bestPath, state.from, state.to, data.bellmanFord.negativeCycle || []);
  renderAlgorithmCard('dijkstra', data.dijkstra, state.metric);
  renderAlgorithmCard('bf', data.bellmanFord, state.metric);
  renderSegmentsTable(data.graph, data.bellmanFord.found ? data.bellmanFord : data.dijkstra, data.dijkstra, data.bellmanFord);
}

function renderGraphSvg(svg, graph, pathIds, originId, destId, cycleIds = []) {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const pathPairs = new Set();
  for (let i = 0; i < pathIds.length - 1; i++) {
    pathPairs.add(`${pathIds[i]}->${pathIds[i + 1]}`);
  }

  const cyclePairs = new Set();
  for (let i = 0; i < cycleIds.length - 1; i++) {
    cyclePairs.add(`${cycleIds[i]}->${cycleIds[i + 1]}`);
  }

  const parts = [];
  parts.push(`
    <defs>
      <marker id="arrow-dim" viewBox="0 0 10 10" refX="19" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
      </marker>
      <marker id="arrow-path" viewBox="0 0 10 10" refX="19" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
      </marker>
      <marker id="arrow-cycle" viewBox="0 0 10 10" refX="19" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
      </marker>
      <filter id="glow" filterUnits="userSpaceOnUse" x="-50" y="-50" width="1100" height="700">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  `);

  // Background grid
  for (let x = 60; x < 980; x += 80) {
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="580" stroke="#1e293b" stroke-width="0.6" />`);
  }
  for (let y = 60; y < 580; y += 80) {
    parts.push(`<line x1="0" y1="${y}" x2="980" y2="${y}" stroke="#1e293b" stroke-width="0.6" />`);
  }

  // Edges
  for (const edge of graph.edges) {
    const u = nodeMap.get(edge.from);
    const v = nodeMap.get(edge.to);
    if (!u || !v) continue;

    const fwd = `${edge.from}->${edge.to}`;
    const rev = `${edge.to}->${edge.from}`;
    const onPath = pathPairs.has(fwd) || (edge.bidirectional && pathPairs.has(rev));
    const onCycle = cyclePairs.has(fwd) || cyclePairs.has(rev);
    const isNeg = edge.weight < 0;

    let stroke = '#334155';
    let strokeWidth = 2;
    let dash = '';
    let marker = edge.bidirectional ? '' : 'url(#arrow-dim)';

    if (isNeg) {
      stroke = '#f59e0b';
      strokeWidth = 3;
      dash = '6 4';
    }
    if (onPath) {
      stroke = '#38bdf8';
      strokeWidth = 4.5;
      dash = '';
      marker = pathPairs.has(fwd) ? 'url(#arrow-path)' : '';
    }
    if (onCycle) {
      stroke = '#ef4444';
      strokeWidth = 4.5;
      marker = 'url(#arrow-cycle)';
    }

    // Offset slightly if one-way so parallel edges don't overlap identically
    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = edge.bidirectional ? 0 : 8;
    const nx = (-dy / len) * off;
    const ny = (dx / len) * off;

    const x1 = u.x + nx;
    const y1 = u.y + ny;
    const x2 = v.x + nx;
    const y2 = v.y + ny;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}" ${
        onPath ? 'filter="url(#glow)"' : ''
      } ${marker ? `marker-end="${marker}"` : ''} />`
    );

    const labelBg = onPath ? '#0284c7' : isNeg ? '#b45309' : '#1e293b';
    const labelText = onPath || isNeg ? '#ffffff' : '#94a3b8';
    parts.push(`
      <rect x="${mx - 15}" y="${my - 9}" width="30" height="17" rx="4" fill="${labelBg}" opacity="0.92" />
      <text x="${mx}" y="${my + 3}" text-anchor="middle" font-size="10" font-weight="700" fill="${labelText}">${edge.weight}</text>
    `);
  }

  // Nodes
  const pathSet = new Set(pathIds);
  for (const n of graph.nodes) {
    const isOrigin = n.id === originId;
    const isDest = n.id === destId;
    const onPath = pathSet.has(n.id);

    let fill = '#1e293b';
    let stroke = '#64748b';
    let r = 17;

    if (onPath) {
      fill = '#0369a1';
      stroke = '#38bdf8';
      r = 19;
    }
    if (isOrigin) {
      fill = '#059669';
      stroke = '#34d399';
      r = 21;
    }
    if (isDest) {
      fill = '#e11d48';
      stroke = '#fb7185';
      r = 21;
    }

    parts.push(`
      <g>
        <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3" />
        <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff">${n.id}</text>
        <text x="${n.x}" y="${n.y + r + 14}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#cbd5e1">${n.name}</text>
      </g>
    `);
  }

  svg.innerHTML = parts.join('');
}

function renderAlgorithmCard(prefix, res, metric) {
  const unit = metric === 'distance' ? 'km' : metric === 'eco' ? 'eco' : 'min';
  const statusEl = el(`${prefix}-status`);
  const kpiEl = el(`${prefix}-kpis`);
  const pathEl = el(`${prefix}-path`);

  if (res.hasNegativeCycle) {
    statusEl.innerHTML = `<span class="badge-danger">Negative Cycle Detected</span>`;
  } else if (!res.valid && res.warning) {
    statusEl.innerHTML = `<span class="badge-warn">${res.warning}</span>`;
  } else if (!res.valid) {
    statusEl.innerHTML = `<span class="badge-danger">${res.error}</span>`;
  } else if (res.found) {
    statusEl.innerHTML = `<span class="badge-success">Optimal Path Found</span>`;
  } else {
    statusEl.innerHTML = `<span class="badge-danger">Destination Unreachable</span>`;
  }

  const m = res.metrics;
  const costLabel = Number.isFinite(res.totalCost) ? `${res.totalCost} ${unit}` : res.hasNegativeCycle ? '-Infinity' : 'Unreachable';

  const thirdKpi =
    prefix === 'dijkstra'
      ? { label: 'Heap Ops', val: `${m.heapPushes} / ${m.heapPops}` }
      : { label: 'Relax Passes', val: `${m.passesCompleted}/${m.maxPasses}` };

  kpiEl.innerHTML = `
    <div class="kpi"><div class="kpi-label">Total Cost</div><div class="kpi-value">${costLabel}</div></div>
    <div class="kpi"><div class="kpi-label">Exec Time</div><div class="kpi-value">${m.executionTimeUs} &micro;s</div></div>
    <div class="kpi"><div class="kpi-label">Relaxations</div><div class="kpi-value">${m.relaxationsAttempted} (${m.relaxationsSuccessful} hit)</div></div>
    <div class="kpi"><div class="kpi-label">Hops</div><div class="kpi-value">${Math.max(0, res.path.length - 1)}</div></div>
    <div class="kpi"><div class="kpi-label">${prefix === 'dijkstra' ? 'Nodes Visited' : 'Early Stop'}</div><div class="kpi-value">${
      prefix === 'dijkstra' ? m.nodesVisited : m.earlyTerminated ? 'Yes' : 'No'
    }</div></div>
    <div class="kpi"><div class="kpi-label">${thirdKpi.label}</div><div class="kpi-value">${thirdKpi.val}</div></div>
  `;

  pathEl.textContent =
    res.path && res.path.length > 0
      ? `Path: ${res.path.join(' -> ')}`
      : res.negativeCycle && res.negativeCycle.length > 0
      ? `Cycle: ${res.negativeCycle.join(' -> ')}`
      : 'No valid path available.';
}

function renderSegmentsTable(graph, bestRes, dijkstra, bf) {
  const tbody = el('segments-tbody');
  const pill = el('route-summary-pill');
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const unit = state.metric === 'distance' ? 'km' : state.metric === 'eco' ? 'eco' : 'min';

  if (bf.hasNegativeCycle) {
    pill.className = 'badge-danger';
    pill.textContent = 'Negative Cycle Anomaly';
  } else if (dijkstra.valid && bf.valid && Math.abs(dijkstra.totalCost - bf.totalCost) < 1e-6) {
    pill.className = 'badge-success';
    pill.textContent = `Verified Parity (${bf.totalCost} ${unit})`;
  } else {
    pill.className = 'badge-warn';
    pill.textContent = `Bellman-Ford (${bf.totalCost}) vs Dijkstra (${dijkstra.totalCost})`;
  }

  if (!bestRes.segments || bestRes.segments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No route segments to display.</td></tr>';
    return;
  }

  tbody.innerHTML = bestRes.segments
    .map((s, i) => {
      const fromNode = nodeMap.get(s.from);
      const toNode = nodeMap.get(s.to);
      return `
        <tr>
          <td><strong>#${i + 1}</strong></td>
          <td><code>${s.from}</code> ${fromNode ? fromNode.name : ''}</td>
          <td><code>${s.to}</code> ${toNode ? toNode.name : ''}</td>
          <td>${s.roadName}</td>
          <td>${s.distanceKm} km</td>
          <td><strong>${s.weight} ${unit}</strong></td>
        </tr>
      `;
    })
    .join('');
}

async function loadBenchmark(refresh = false) {
  const btn = el('run-bench-btn');
  btn.disabled = true;
  btn.textContent = 'Running Benchmarks...';
  try {
    const data = await fetchJson(`/api/benchmark?refresh=${refresh}`);
    state.benchmark = data;
    el('bench-meta').textContent = `Node ${data.nodeVersion} · ${data.platform}`;

    const sparseRows = data.results.filter((r) => r.density === 'sparse');
    const denseRows = data.results.filter((r) => r.density === 'dense');
    renderLineChart(el('sparse-chart'), sparseRows);
    renderLineChart(el('dense-chart'), denseRows);

    el('bench-tbody').innerHTML = data.results
      .map(
        (r) => `
      <tr>
        <td><strong>${r.density.toUpperCase()}</strong></td>
        <td>${r.vertices}</td>
        <td>${r.directedEdges}</td>
        <td style="color:#4f46e5;font-weight:700">${r.dijkstraTimeMs.toFixed(3)}</td>
        <td style="color:#059669;font-weight:700">${r.bellmanFordEarlyTimeMs.toFixed(3)}</td>
        <td style="color:#d97706;font-weight:700">${r.bellmanFordStrictTimeMs.toFixed(3)}</td>
        <td>${r.bellmanFordPasses}</td>
        <td><strong>${r.speedupStrictVsDijkstra}x faster</strong></td>
        <td><span class="badge-success">${r.costMatch ? 'PASS' : 'FAIL'}</span></td>
      </tr>
    `
      )
      .join('');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Re-run Live Benchmark';
  }
}

function renderLineChart(svg, rows) {
  if (!rows.length) return;
  const W = 560;
  const H = 300;
  const pad = { top: 26, right: 24, bottom: 46, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxV = Math.max(...rows.map((r) => r.vertices));
  const maxY = Math.max(
    1,
    ...rows.map((r) => Math.max(r.dijkstraTimeMs, r.bellmanFordEarlyTimeMs, r.bellmanFordStrictTimeMs))
  );

  const scaleX = (v) => pad.left + (v / maxV) * plotW;
  const scaleY = (y) => pad.top + plotH - (y / maxY) * plotH;

  const series = [
    { key: 'dijkstraTimeMs', label: 'Dijkstra', color: '#4f46e5' },
    { key: 'bellmanFordEarlyTimeMs', label: 'Bellman-Ford (Early)', color: '#059669' },
    { key: 'bellmanFordStrictTimeMs', label: 'Bellman-Ford (Strict)', color: '#d97706' },
  ];

  const parts = [];
  // Y gridlines
  for (let i = 0; i <= 4; i++) {
    const val = (maxY * i) / 4;
    const y = scaleY(val);
    parts.push(`<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />`);
    parts.push(`<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="#64748b">${val.toFixed(1)}</text>`);
  }

  // Axes
  parts.push(`<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#94a3b8" stroke-width="1.2" />`);
  parts.push(`<line x1="${pad.left}" y1="${pad.top + plotH}" x2="${W - pad.right}" y2="${pad.top + plotH}" stroke="#94a3b8" stroke-width="1.2" />`);

  // X ticks
  for (const r of rows) {
    const x = scaleX(r.vertices);
    parts.push(`<text x="${x}" y="${pad.top + plotH + 16}" text-anchor="middle" font-size="10" fill="#64748b">${r.vertices}</text>`);
  }
  parts.push(`<text x="${pad.left + plotW / 2}" y="${H - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Graph Size (Vertices V)</text>`);
  parts.push(`<text x="15" y="${pad.top + plotH / 2}" transform="rotate(-90 15 ${pad.top + plotH / 2})" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Time (ms)</text>`);

  // Lines & dots
  for (const s of series) {
    const pts = rows.map((r) => `${scaleX(r.vertices)},${scaleY(r[s.key])}`).join(' ');
    parts.push(`<polyline fill="none" stroke="${s.color}" stroke-width="2.6" points="${pts}" />`);
    for (const r of rows) {
      parts.push(`<circle cx="${scaleX(r.vertices)}" cy="${scaleY(r[s.key])}" r="3.8" fill="${s.color}" stroke="#fff" stroke-width="1.2" />`);
    }
  }

  // Legend
  series.forEach((s, idx) => {
    const lx = pad.left + 12 + idx * 160;
    parts.push(`<rect x="${lx}" y="6" width="12" height="10" rx="2" fill="${s.color}" />`);
    parts.push(`<text x="${lx + 17}" y="15" font-size="11" font-weight="600" fill="#334155">${s.label}</text>`);
  });

  svg.innerHTML = parts.join('');
}

async function loadNegativeLab() {
  const [resA, resB] = await Promise.all([
    fetchJson('/api/route?scenario=negative&from=A&to=E&allowUnsafe=true'),
    fetchJson('/api/route?scenario=cycle&from=A&to=E&allowUnsafe=true'),
  ]);

  renderGraphSvg(el('neg-a-svg'), resA.graph, resA.bellmanFord.path, 'A', 'E');
  el('neg-a-comparison').innerHTML = `
    <div class="neg-box-item">
      <h4 style="color:#d97706">Dijkstra (Greedy / Unsafe)</h4>
      <div><strong>Path:</strong> ${resA.dijkstra.path.join(' &rarr; ')}</div>
      <div><strong>Reported Cost:</strong> ${resA.dijkstra.totalCost} (Suboptimal!)</div>
    </div>
    <div class="neg-box-item">
      <h4 style="color:#059669">Bellman-Ford (Exact)</h4>
      <div><strong>Path:</strong> ${resA.bellmanFord.path.join(' &rarr; ')}</div>
      <div><strong>Optimal Cost:</strong> ${resA.bellmanFord.totalCost} (True Minimum)</div>
    </div>
  `;

  renderGraphSvg(el('neg-b-svg'), resB.graph, [], 'A', 'E', resB.bellmanFord.negativeCycle);
  el('neg-b-comparison').innerHTML = `
    <div class="neg-box-item">
      <h4 style="color:#dc2626">Negative Cycle Status</h4>
      <div><strong>Detected:</strong> ${resB.bellmanFord.hasNegativeCycle ? 'YES' : 'NO'}</div>
      <div><strong>Cycle:</strong> ${resB.bellmanFord.negativeCycle.join(' &rarr; ')}</div>
    </div>
    <div class="neg-box-item">
      <h4 style="color:#0f172a">Algorithm Verdict</h4>
      <div>Shortest path is undefined (-&infin;). Bellman-Ford safely halts and flags the anomaly.</div>
    </div>
  `;
}

function bindControls() {
  el('scenario-select').addEventListener('change', (e) => {
    state.scenario = e.target.value;
    state.from = state.scenario === 'city' ? 'UNI' : 'A';
    state.to = state.scenario === 'city' ? 'AIR' : 'E';
    el('from-select').innerHTML = '';
    computeRoute();
  });

  el('from-select').addEventListener('change', (e) => {
    state.from = e.target.value;
    computeRoute();
  });

  el('to-select').addEventListener('change', (e) => {
    state.to = e.target.value;
    computeRoute();
  });

  el('metric-select').addEventListener('change', (e) => {
    state.metric = e.target.value;
    computeRoute();
  });

  el('traffic-slider').addEventListener('input', (e) => {
    state.traffic = Number(e.target.value);
    el('traffic-val').textContent = `${state.traffic.toFixed(1)}x`;
  });

  el('traffic-slider').addEventListener('change', () => {
    computeRoute();
  });

  el('optimize-btn').addEventListener('click', computeRoute);
  el('run-bench-btn').addEventListener('click', () => loadBenchmark(true));
}

initTabs();
bindControls();
computeRoute();
