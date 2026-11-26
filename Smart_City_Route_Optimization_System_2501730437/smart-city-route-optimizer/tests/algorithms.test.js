import test from 'node:test';
import assert from 'node:assert/strict';
import { CityGraph } from '../src/models/graph.js';
import { MinHeap } from '../src/algorithms/minHeap.js';
import { runDijkstra } from '../src/algorithms/dijkstra.js';
import { runBellmanFord } from '../src/algorithms/bellmanFord.js';
import {
  createSmartCityGraph,
  createNegativeWeightDemoGraph,
  createNegativeCycleDemoGraph,
  generateRandomCityGraph,
} from '../src/data/smartCityMap.js';

test('MinHeap maintains strict min-priority ordering', () => {
  const heap = new MinHeap();
  const values = [42, 7, 19, 3, 25, 3, 11, 1];
  values.forEach((v, i) => heap.push({ id: `N${i}`, priority: v }));

  const popped = [];
  while (!heap.isEmpty()) {
    popped.push(heap.pop().priority);
  }
  assert.deepEqual(popped, [1, 3, 3, 7, 11, 19, 25, 42]);
});

test('Dijkstra and Bellman-Ford agree on all Smart City routes', () => {
  const graph = createSmartCityGraph();
  const pairs = [
    ['UNI', 'AIR'],
    ['RES', 'PRT'],
    ['ECO', 'RND'],
    ['HUB', 'HUB'],
    ['SOL', 'EVH'],
  ];

  for (const [src, dst] of pairs) {
    const d = runDijkstra(graph, src, dst);
    const bf = runBellmanFord(graph, src, dst);
    assert.equal(d.valid, true);
    assert.equal(bf.valid, true);
    assert.equal(d.found, true);
    assert.equal(bf.found, true);
    assert.ok(Math.abs(d.totalCost - bf.totalCost) < 1e-6, `Mismatch on ${src}->${dst}`);
    assert.equal(d.path[0], src);
    assert.equal(d.path[d.path.length - 1], dst);
  }
});

test('Disconnected target returns found=false and Infinity cost', () => {
  const graph = new CityGraph('Disconnected Test');
  graph.addNode({ id: 'A', name: 'Node A' });
  graph.addNode({ id: 'B', name: 'Node B' });
  graph.addNode({ id: 'C', name: 'Isolated Node C' });
  graph.addEdge({ from: 'A', to: 'B', weight: 5 });

  const d = runDijkstra(graph, 'A', 'C');
  const bf = runBellmanFord(graph, 'A', 'C');

  assert.equal(d.found, false);
  assert.equal(d.totalCost, Infinity);
  assert.equal(bf.found, false);
  assert.equal(bf.totalCost, Infinity);
});

test('Bellman-Ford handles negative edge weights accurately while Dijkstra rejects them safely', () => {
  const graph = createNegativeWeightDemoGraph();
  const dSafe = runDijkstra(graph, 'A', 'E');
  assert.equal(dSafe.valid, false);
  assert.match(dSafe.error, /Negative edge weights/);

  // Optimal path A -> C (7) -> B (-5) -> D (2) -> E (3) = 7
  // Greedy unsafe Dijkstra locks B at 4 -> D (6) -> E (9)
  const dUnsafe = runDijkstra(graph, 'A', 'E', { allowUnsafeNegative: true });
  const bf = runBellmanFord(graph, 'A', 'E');

  assert.equal(bf.valid, true);
  assert.equal(bf.found, true);
  assert.deepEqual(bf.path, ['A', 'C', 'B', 'D', 'E']);
  assert.equal(bf.totalCost, 7);
  assert.equal(dUnsafe.totalCost, 9);
  assert.ok(bf.totalCost < dUnsafe.totalCost);
});

test('Bellman-Ford detects reachable negative-weight cycles', () => {
  const graph = createNegativeCycleDemoGraph();
  const bf = runBellmanFord(graph, 'A', 'E');

  assert.equal(bf.valid, false);
  assert.equal(bf.hasNegativeCycle, true);
  assert.ok(bf.negativeCycle.length >= 2);
});

test('Dijkstra and Bellman-Ford produce identical shortest-path costs on random graphs', () => {
  for (const size of [15, 40, 80]) {
    const graph = generateRandomCityGraph(size, 'sparse', 700 + size);
    const d = runDijkstra(graph, 'V0', null);
    const bf = runBellmanFord(graph, 'V0', null, { earlyTerminate: true });

    for (let i = 0; i < size; i++) {
      const nodeId = `V${i}`;
      assert.ok(
        Math.abs(d.distances[nodeId] - bf.distances[nodeId]) < 1e-6,
        `Distance mismatch at ${nodeId} for V=${size}`
      );
    }
  }
});
