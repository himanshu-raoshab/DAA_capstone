import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDijkstra } from '../algorithms/dijkstra.js';
import { runBellmanFord } from '../algorithms/bellmanFord.js';
import { generateRandomCityGraph } from '../data/smartCityMap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs performance benchmarks comparing Dijkstra's algorithm and Bellman-Ford
 * (early-terminating and strict worst-case) across varying graph sizes and densities.
 */
export function runPerformanceBenchmark({
  sizes = [20, 50, 100, 250, 500, 1000, 1500],
  densities = ['sparse', 'dense'],
  trials = 3,
} = {}) {
  const results = [];

  // Warm up V8 JIT compiler before taking measurements
  const warmupGraph = generateRandomCityGraph(40, 'sparse', 99);
  for (let i = 0; i < 5; i++) {
    runDijkstra(warmupGraph, 'V0', null);
    runBellmanFord(warmupGraph, 'V0', null, { earlyTerminate: true });
    runBellmanFord(warmupGraph, 'V0', null, { earlyTerminate: false });
  }

  for (const density of densities) {
    for (const V of sizes) {
      // Keep dense largest size bounded so benchmark completes swiftly while showing clear scaling
      if (density === 'dense' && V > 1000) continue;

      const graph = generateRandomCityGraph(V, density, 1000 + V);
      const source = 'V0';
      const target = `V${V - 1}`;

      let dijkstraSumUs = 0;
      let bfEarlySumUs = 0;
      let bfStrictSumUs = 0;

      let lastD = null;
      let lastBfEarly = null;
      let lastBfStrict = null;

      for (let t = 0; t < trials; t++) {
        lastD = runDijkstra(graph, source, null);
        dijkstraSumUs += lastD.metrics.executionTimeUs;

        lastBfEarly = runBellmanFord(graph, source, null, { earlyTerminate: true });
        bfEarlySumUs += lastBfEarly.metrics.executionTimeUs;

        // Run strict worst-case Bellman-Ford up to V <= 500 or single trial for larger graphs
        if (V <= 500 || t === 0) {
          lastBfStrict = runBellmanFord(graph, source, null, { earlyTerminate: false });
          bfStrictSumUs += lastBfStrict.metrics.executionTimeUs;
        }
      }

      const avgDijkstraMs = Number(((dijkstraSumUs / trials) / 1000).toFixed(4));
      const avgBfEarlyMs = Number(((bfEarlySumUs / trials) / 1000).toFixed(4));
      const strictDivisor = V <= 500 ? trials : 1;
      const avgBfStrictMs = Number(((bfStrictSumUs / strictDivisor) / 1000).toFixed(4));

      // Verify path cost agreement on a specific target
      const checkD = runDijkstra(graph, source, target);
      const checkBF = runBellmanFord(graph, source, target, { earlyTerminate: true });
      const costMatch = Math.abs(checkD.totalCost - checkBF.totalCost) < 1e-6;

      results.push({
        density,
        vertices: graph.getVertexCount(),
        directedEdges: graph.getEdgeCount(),
        undirectedEdges: graph.edges.length,
        dijkstraTimeMs: avgDijkstraMs,
        bellmanFordEarlyTimeMs: avgBfEarlyMs,
        bellmanFordStrictTimeMs: avgBfStrictMs,
        dijkstraRelaxations: lastD.metrics.relaxationsAttempted,
        bellmanFordEarlyRelaxations: lastBfEarly.metrics.relaxationsAttempted,
        bellmanFordStrictRelaxations: lastBfStrict.metrics.relaxationsAttempted,
        bellmanFordPasses: lastBfEarly.metrics.passesCompleted,
        speedupEarlyVsDijkstra: Number((avgBfEarlyMs / Math.max(avgDijkstraMs, 0.001)).toFixed(2)),
        speedupStrictVsDijkstra: Number((avgBfStrictMs / Math.max(avgDijkstraMs, 0.001)).toFixed(2)),
        costMatch,
      });
    }
  }

  return results;
}

function saveBenchmarkArtifacts(results) {
  const outDir = path.resolve(__dirname, '../../benchmarks');
  fs.mkdirSync(outDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    author: 'Himanshu Yadav (Roll No: 2501730437)',
    nodeVersion: process.version,
    platform: `${process.platform} (${process.arch})`,
    results,
  };

  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(payload, null, 2), 'utf8');

  const headers = [
    'density',
    'vertices',
    'directedEdges',
    'dijkstraTimeMs',
    'bellmanFordEarlyTimeMs',
    'bellmanFordStrictTimeMs',
    'dijkstraRelaxations',
    'bellmanFordEarlyRelaxations',
    'bellmanFordStrictRelaxations',
    'bellmanFordPasses',
    'speedupEarlyVsDijkstra',
    'speedupStrictVsDijkstra',
    'costMatch',
  ];

  const csvRows = [headers.join(',')];
  for (const row of results) {
    csvRows.push(headers.map((h) => row[h]).join(','));
  }
  fs.writeFileSync(path.join(outDir, 'results.csv'), csvRows.join('\n'), 'utf8');

  return outDir;
}

// Run when invoked directly via `node src/benchmark/benchmark.js`
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  console.log('=== Smart City Route Optimization System: Performance Benchmark ===');
  console.log('Author: Himanshu Yadav | Roll No: 2501730437\n');

  const results = runPerformanceBenchmark();
  const outDir = saveBenchmarkArtifacts(results);

  console.table(
    results.map((r) => ({
      Topology: r.density,
      V: r.vertices,
      'E (dir)': r.directedEdges,
      'Dijkstra (ms)': r.dijkstraTimeMs,
      'BF-Early (ms)': r.bellmanFordEarlyTimeMs,
      'BF-Strict (ms)': r.bellmanFordStrictTimeMs,
      'BF Passes': r.bellmanFordPasses,
      'Speedup (Early)': `${r.speedupEarlyVsDijkstra}x`,
      'Speedup (Strict)': `${r.speedupStrictVsDijkstra}x`,
      Match: r.costMatch ? 'PASS' : 'FAIL',
    }))
  );

  console.log(`\nSaved benchmark artifacts to: ${outDir}`);
}
