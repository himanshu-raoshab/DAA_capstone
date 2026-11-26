import { MinHeap } from './minHeap.js';

/**
 * Computes shortest paths from sourceId using Dijkstra's algorithm
 * backed by a Binary Min-Heap priority queue: O((V + E) log V).
 *
 * @param {import('../models/graph.js').CityGraph} graph
 * @param {string} sourceId
 * @param {string|null} targetId - Optional destination for early exit and path reconstruction
 * @param {Object} options
 * @param {boolean} options.allowUnsafeNegative - If true, runs even with negative edges (to demonstrate failure)
 */
export function runDijkstra(graph, sourceId, targetId = null, { allowUnsafeNegative = false } = {}) {
  if (!graph.getNode(sourceId)) {
    throw new Error(`Source node "${sourceId}" does not exist in graph`);
  }
  if (targetId && !graph.getNode(targetId)) {
    throw new Error(`Target node "${targetId}" does not exist in graph`);
  }

  const hasNegatives = graph.hasNegativeWeights();
  if (hasNegatives && !allowUnsafeNegative) {
    return {
      algorithm: 'Dijkstra',
      valid: false,
      found: false,
      error: 'Negative edge weights detected. Dijkstra’s greedy invariant requires all edge weights to be non-negative (w >= 0).',
      path: [],
      segments: [],
      totalCost: Infinity,
      visitedOrder: [],
      metrics: {
        executionTimeMs: 0,
        executionTimeUs: 0,
        relaxationsAttempted: 0,
        relaxationsSuccessful: 0,
        heapPushes: 0,
        heapPops: 0,
        nodesVisited: 0,
        vertexCount: graph.getVertexCount(),
        edgeCount: graph.getEdgeCount(),
      },
    };
  }

  const startNs = process.hrtime.bigint();

  const distances = new Map();
  const previous = new Map();
  const previousEdge = new Map();
  const visited = new Set();
  const visitedOrder = [];

  for (const nodeId of graph.nodes.keys()) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }
  distances.set(sourceId, 0);

  const pq = new MinHeap();
  pq.push({ id: sourceId, priority: 0 });

  let relaxationsAttempted = 0;
  let relaxationsSuccessful = 0;

  while (!pq.isEmpty()) {
    const { id: u, priority: distU } = pq.pop();

    // Skip stale entries in the lazy priority queue
    if (visited.has(u)) continue;
    if (distU > distances.get(u)) continue;

    visited.add(u);
    visitedOrder.push(u);

    if (targetId && u === targetId) {
      break;
    }

    const neighbors = graph.getNeighbors(u);
    for (let i = 0; i < neighbors.length; i++) {
      const edge = neighbors[i];
      if (visited.has(edge.to)) continue;
      relaxationsAttempted++;

      const alt = distU + edge.weight;
      if (alt < distances.get(edge.to)) {
        distances.set(edge.to, alt);
        previous.set(edge.to, u);
        previousEdge.set(edge.to, edge);
        relaxationsSuccessful++;
        pq.push({ id: edge.to, priority: alt });
      }
    }
  }

  const elapsedNs = Number(process.hrtime.bigint() - startNs);
  const executionTimeMs = Number((elapsedNs / 1e6).toFixed(4));
  const executionTimeUs = Number((elapsedNs / 1e3).toFixed(2));

  const { found, path, segments, totalCost } = reconstructPath(
    sourceId,
    targetId,
    distances,
    previous,
    previousEdge
  );

  return {
    algorithm: 'Dijkstra',
    valid: !hasNegatives,
    warning: hasNegatives
      ? 'Graph contains negative weights; Dijkstra output may be suboptimal or incorrect.'
      : null,
    found,
    path,
    segments,
    totalCost,
    visitedOrder,
    distances: Object.fromEntries(distances),
    metrics: {
      executionTimeMs,
      executionTimeUs,
      relaxationsAttempted,
      relaxationsSuccessful,
      heapPushes: pq.pushCount,
      heapPops: pq.popCount,
      nodesVisited: visited.size,
      vertexCount: graph.getVertexCount(),
      edgeCount: graph.getEdgeCount(),
    },
  };
}

export function reconstructPath(sourceId, targetId, distances, previous, previousEdge) {
  if (!targetId) {
    return { found: true, path: [], segments: [], totalCost: 0 };
  }

  const dist = distances.get(targetId);
  if (dist === undefined || dist === Infinity) {
    return { found: false, path: [], segments: [], totalCost: Infinity };
  }

  const path = [];
  const segments = [];
  let curr = targetId;
  const guard = new Set();

  while (curr !== null) {
    if (guard.has(curr)) break;
    guard.add(curr);
    path.unshift(curr);
    const edge = previousEdge.get(curr);
    if (edge) {
      segments.unshift({
        from: edge.from,
        to: edge.to,
        weight: Number(edge.weight.toFixed(2)),
        roadName: edge.roadName,
        distanceKm: edge.distanceKm,
      });
    }
    curr = previous.get(curr) ?? null;
  }

  if (path[0] !== sourceId) {
    return { found: false, path: [], segments: [], totalCost: Infinity };
  }

  return {
    found: true,
    path,
    segments,
    totalCost: Number(dist.toFixed(2)),
  };
}
