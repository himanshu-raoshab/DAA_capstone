import { reconstructPath } from './dijkstra.js';

/**
 * Computes shortest paths from sourceId using the Bellman-Ford algorithm: O(V * E).
 * Supports negative edge weights and detects negative-weight cycles reachable from sourceId.
 *
 * @param {import('../models/graph.js').CityGraph} graph
 * @param {string} sourceId
 * @param {string|null} targetId
 * @param {Object} options
 * @param {boolean} options.earlyTerminate - Stop relaxing if a full pass yields zero updates
 */
export function runBellmanFord(graph, sourceId, targetId = null, { earlyTerminate = true } = {}) {
  if (!graph.getNode(sourceId)) {
    throw new Error(`Source node "${sourceId}" does not exist in graph`);
  }
  if (targetId && !graph.getNode(targetId)) {
    throw new Error(`Target node "${targetId}" does not exist in graph`);
  }

  const startNs = process.hrtime.bigint();

  const V = graph.getVertexCount();
  const edges = graph.getDirectedEdges();
  const E = edges.length;

  const distances = new Map();
  const previous = new Map();
  const previousEdge = new Map();

  for (const nodeId of graph.nodes.keys()) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }
  distances.set(sourceId, 0);

  let relaxationsAttempted = 0;
  let relaxationsSuccessful = 0;
  let passesCompleted = 0;
  let earlyTerminated = false;

  // Step 1: Relax all edges up to |V| - 1 times
  for (let pass = 1; pass <= Math.max(0, V - 1); pass++) {
    passesCompleted = pass;
    let updatedInPass = false;

    for (let i = 0; i < E; i++) {
      const edge = edges[i];
      const distU = distances.get(edge.from);
      if (distU === Infinity) continue;

      relaxationsAttempted++;
      const alt = distU + edge.weight;
      if (alt < distances.get(edge.to) - 1e-12) {
        distances.set(edge.to, alt);
        previous.set(edge.to, edge.from);
        previousEdge.set(edge.to, edge);
        relaxationsSuccessful++;
        updatedInPass = true;
      }
    }

    if (earlyTerminate && !updatedInPass) {
      earlyTerminated = true;
      break;
    }
  }

  // Step 2: Run V-th pass to detect negative-weight cycles reachable from sourceId
  let hasNegativeCycle = false;
  let cycleTriggerNode = null;

  if (!earlyTerminated || !earlyTerminate) {
    for (let i = 0; i < E; i++) {
      const edge = edges[i];
      const distU = distances.get(edge.from);
      if (distU === Infinity) continue;

      relaxationsAttempted++;
      if (distU + edge.weight < distances.get(edge.to) - 1e-12) {
        hasNegativeCycle = true;
        cycleTriggerNode = edge.to;
        previous.set(edge.to, edge.from);
        break;
      }
    }
  }

  let negativeCycle = [];
  if (hasNegativeCycle && cycleTriggerNode) {
    negativeCycle = extractNegativeCycle(cycleTriggerNode, previous, V);
  }

  const elapsedNs = Number(process.hrtime.bigint() - startNs);
  const executionTimeMs = Number((elapsedNs / 1e6).toFixed(4));
  const executionTimeUs = Number((elapsedNs / 1e3).toFixed(2));

  const pathResult = hasNegativeCycle
    ? { found: false, path: [], segments: [], totalCost: -Infinity }
    : reconstructPath(sourceId, targetId, distances, previous, previousEdge);

  return {
    algorithm: 'Bellman-Ford',
    valid: !hasNegativeCycle,
    hasNegativeCycle,
    negativeCycle,
    error: hasNegativeCycle
      ? `Negative-weight cycle detected (${negativeCycle.join(' -> ')}). Shortest path is undefined (-Infinity).`
      : null,
    found: pathResult.found,
    path: pathResult.path,
    segments: pathResult.segments,
    totalCost: pathResult.totalCost,
    distances: Object.fromEntries(distances),
    metrics: {
      executionTimeMs,
      executionTimeUs,
      passesCompleted,
      maxPasses: Math.max(0, V - 1),
      earlyTerminated,
      relaxationsAttempted,
      relaxationsSuccessful,
      vertexCount: V,
      edgeCount: E,
    },
  };
}

function extractNegativeCycle(startNode, previous, vertexCount) {
  let curr = startNode;
  for (let i = 0; i < vertexCount; i++) {
    curr = previous.get(curr) ?? curr;
  }

  // Walk backward through predecessors until we revisit a node on the cycle
  const visitedAt = new Map();
  const chain = [];
  let tracer = curr;
  while (tracer && !visitedAt.has(tracer)) {
    visitedAt.set(tracer, chain.length);
    chain.push(tracer);
    tracer = previous.get(tracer);
  }

  if (tracer && visitedAt.has(tracer)) {
    // chain is in reverse edge order (v <- prev(v) <- ...), so reverse to get forward cycle
    const loopSlice = chain.slice(visitedAt.get(tracer)).reverse();
    return [tracer, ...loopSlice];
  }
  return chain.reverse();
}
