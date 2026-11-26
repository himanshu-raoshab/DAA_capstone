import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createSmartCityGraph,
  createNegativeWeightDemoGraph,
  createNegativeCycleDemoGraph,
} from './src/data/smartCityMap.js';
import { runDijkstra } from './src/algorithms/dijkstra.js';
import { runBellmanFord } from './src/algorithms/bellmanFord.js';
import { runPerformanceBenchmark } from './src/benchmark/benchmark.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const BENCHMARK_FILE = path.join(__dirname, 'benchmarks', 'results.json');
const PORT = Number(process.env.PORT || 3456);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function getScenarioGraph(scenario, metric, traffic) {
  if (scenario === 'negative') {
    return createNegativeWeightDemoGraph();
  }
  if (scenario === 'cycle') {
    return createNegativeCycleDemoGraph();
  }
  const base = createSmartCityGraph();
  return base.cloneWithOptions({
    metric: metric || 'time',
    trafficMultiplier: Number.isFinite(traffic) ? traffic : 1.0,
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/api/health') {
      return sendJson(res, 200, { status: 'ok', service: 'Smart City Route Optimization System' });
    }

    if (pathname === '/api/graph') {
      const scenario = url.searchParams.get('scenario') || 'city';
      const metric = url.searchParams.get('metric') || 'time';
      const traffic = Number(url.searchParams.get('traffic') || '1.0');
      const graph = getScenarioGraph(scenario, metric, traffic);
      return sendJson(res, 200, graph.toJSON());
    }

    if (pathname === '/api/route') {
      const scenario = url.searchParams.get('scenario') || 'city';
      const metric = url.searchParams.get('metric') || 'time';
      const traffic = Number(url.searchParams.get('traffic') || '1.0');
      const graph = getScenarioGraph(scenario, metric, traffic);

      const defaultFrom = scenario === 'city' ? 'UNI' : 'A';
      const defaultTo = scenario === 'city' ? 'AIR' : 'E';
      const from = url.searchParams.get('from') || defaultFrom;
      const to = url.searchParams.get('to') || defaultTo;
      const allowUnsafe = url.searchParams.get('allowUnsafe') === 'true';

      const dijkstra = runDijkstra(graph, from, to, { allowUnsafeNegative: allowUnsafe });
      const bellmanFord = runBellmanFord(graph, from, to, { earlyTerminate: true });

      return sendJson(res, 200, {
        scenario,
        metric,
        trafficMultiplier: traffic,
        from,
        to,
        graph: graph.toJSON(),
        dijkstra,
        bellmanFord,
      });
    }

    if (pathname === '/api/benchmark') {
      const refresh = url.searchParams.get('refresh') === 'true';
      if (!refresh && fs.existsSync(BENCHMARK_FILE)) {
        const cached = JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf8'));
        return sendJson(res, 200, cached);
      }

      const results = runPerformanceBenchmark();
      const payload = {
        generatedAt: new Date().toISOString(),
        author: 'Himanshu Yadav (Roll No: 2501730437)',
        nodeVersion: process.version,
        platform: `${process.platform} (${process.arch})`,
        results,
      };
      fs.mkdirSync(path.dirname(BENCHMARK_FILE), { recursive: true });
      fs.writeFileSync(BENCHMARK_FILE, JSON.stringify(payload, null, 2), 'utf8');
      return sendJson(res, 200, payload);
    }

    // Serve static files from public/
    const safePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(PUBLIC_DIR, path.normalize(safePath));
    if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Smart City Route Optimization System running at http://127.0.0.1:${PORT}`);
});
