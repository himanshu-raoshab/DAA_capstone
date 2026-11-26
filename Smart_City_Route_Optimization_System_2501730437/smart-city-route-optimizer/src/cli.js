import { createSmartCityGraph, createNegativeWeightDemoGraph, createNegativeCycleDemoGraph } from './data/smartCityMap.js';
import { runDijkstra } from './algorithms/dijkstra.js';
import { runBellmanFord } from './algorithms/bellmanFord.js';
import { runPerformanceBenchmark } from './benchmark/benchmark.js';

function printHelp() {
  console.log(`
Smart City Route Optimization System — CLI
Author: Himanshu Yadav | Roll No: 2501730437

Usage:
  node src/cli.js route <FROM_ID> <TO_ID> [--metric time|distance|eco] [--traffic 1.0]
  node src/cli.js nodes
  node src/cli.js benchmark
  node src/cli.js negative-demo
`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'route';

  const baseGraph = createSmartCityGraph();

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'nodes') {
    console.log('\nAvailable Smart City Locations (Vertices):');
    console.table(
      Array.from(baseGraph.nodes.values()).map((n) => ({
        ID: n.id,
        Name: n.name,
        Zone: n.zone,
        Type: n.type,
      }))
    );
    return;
  }

  if (command === 'benchmark') {
    const results = runPerformanceBenchmark({ sizes: [20, 50, 100, 250, 500, 1000] });
    console.table(results);
    return;
  }

  if (command === 'negative-demo') {
    console.log('\n--- Scenario A: Negative Edge Weight (Without Cycle) ---');
    const negGraph = createNegativeWeightDemoGraph();
    const dUnsafe = runDijkstra(negGraph, 'A', 'E', { allowUnsafeNegative: true });
    const bfValid = runBellmanFord(negGraph, 'A', 'E');
    console.log(`Dijkstra (unsafe greedy): Path=${dUnsafe.path.join(' -> ')} | Cost=${dUnsafe.totalCost}`);
    console.log(`Bellman-Ford (exact):     Path=${bfValid.path.join(' -> ')} | Cost=${bfValid.totalCost}`);

    console.log('\n--- Scenario B: Reachable Negative-Weight Cycle ---');
    const cycleGraph = createNegativeCycleDemoGraph();
    const bfCycle = runBellmanFord(cycleGraph, 'A', 'E');
    console.log(`Has Negative Cycle: ${bfCycle.hasNegativeCycle}`);
    console.log(`Detected Cycle:     ${bfCycle.negativeCycle.join(' -> ')}`);
    return;
  }

  // Default: route calculation
  const fromId = (args[0] === 'route' ? args[1] : args[0]) || 'UNI';
  const toId = (args[0] === 'route' ? args[2] : args[1]) || 'AIR';

  const metricIdx = args.indexOf('--metric');
  const metric = metricIdx !== -1 && args[metricIdx + 1] ? args[metricIdx + 1] : 'time';

  const trafficIdx = args.indexOf('--traffic');
  const trafficMultiplier = trafficIdx !== -1 && args[trafficIdx + 1] ? Number(args[trafficIdx + 1]) : 1.0;

  const activeGraph = baseGraph.cloneWithOptions({ metric, trafficMultiplier });
  const unit = metric === 'distance' ? 'km' : metric === 'eco' ? 'eco-pts' : 'min';

  console.log('\n=== Smart City Route Optimization System ===');
  console.log(`Network: ${activeGraph.name} (V=${activeGraph.getVertexCount()}, E_dir=${activeGraph.getEdgeCount()})`);
  console.log(`Query:   ${fromId} (${activeGraph.getNode(fromId)?.name}) -> ${toId} (${activeGraph.getNode(toId)?.name})`);
  console.log(`Metric:  ${metric} | Traffic Multiplier: ${trafficMultiplier}x\n`);

  const dijkstraRes = runDijkstra(activeGraph, fromId, toId);
  const bellmanRes = runBellmanFord(activeGraph, fromId, toId);

  console.log('1) Dijkstra’s Algorithm (Min-Heap Priority Queue):');
  if (dijkstraRes.valid && dijkstraRes.found) {
    console.log(`   Path:        ${dijkstraRes.path.join(' -> ')}`);
    console.log(`   Total Cost:  ${dijkstraRes.totalCost} ${unit}`);
    console.log(`   Time:        ${dijkstraRes.metrics.executionTimeUs} us (${dijkstraRes.metrics.executionTimeMs} ms)`);
    console.log(`   Relaxations: ${dijkstraRes.metrics.relaxationsAttempted} attempted, ${dijkstraRes.metrics.relaxationsSuccessful} successful`);
  } else {
    console.log(`   Status:      ${dijkstraRes.error || 'No route found'}`);
  }

  console.log('\n2) Bellman-Ford Algorithm (Edge Relaxation):');
  if (bellmanRes.valid && bellmanRes.found) {
    console.log(`   Path:        ${bellmanRes.path.join(' -> ')}`);
    console.log(`   Total Cost:  ${bellmanRes.totalCost} ${unit}`);
    console.log(`   Time:        ${bellmanRes.metrics.executionTimeUs} us (${bellmanRes.metrics.executionTimeMs} ms)`);
    console.log(`   Passes:      ${bellmanRes.metrics.passesCompleted}/${bellmanRes.metrics.maxPasses} (Early Terminated: ${bellmanRes.metrics.earlyTerminated})`);
    console.log(`   Relaxations: ${bellmanRes.metrics.relaxationsAttempted} attempted, ${bellmanRes.metrics.relaxationsSuccessful} successful`);
  } else {
    console.log(`   Status:      ${bellmanRes.error || 'No route found'}`);
  }

  if (bellmanRes.found && bellmanRes.segments.length > 0) {
    console.log('\nTurn-by-Turn Optimal Route Breakdown:');
    console.table(
      bellmanRes.segments.map((s, idx) => ({
        Step: idx + 1,
        From: `${s.from} (${activeGraph.getNode(s.from)?.name})`,
        To: `${s.to} (${activeGraph.getNode(s.to)?.name})`,
        Road: s.roadName,
        Distance: `${s.distanceKm} km`,
        Cost: `${s.weight} ${unit}`,
      }))
    );
  }
}

main();
