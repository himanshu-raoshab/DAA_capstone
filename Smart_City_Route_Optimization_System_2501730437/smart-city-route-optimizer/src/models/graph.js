/**
 * Graph data structure modeling a Smart City road network.
 * Locations are stored as vertices and roads as weighted directed edges
 * (bidirectional roads create symmetric directed edges in both adjacency and edge lists).
 */
export class CityGraph {
  constructor(name = 'Smart City Network') {
    this.name = name;
    this.nodes = new Map();
    this.adjacency = new Map();
    this.edges = [];
    this.directedEdges = [];
  }

  /**
   * Adds a city location (vertex) to the graph.
   * @param {Object} node
   */
  addNode({ id, name, zone = 'Central', type = 'hub', x = 0, y = 0 }) {
    if (!id) throw new Error('Node id is required');
    const nodeObj = { id, name: name || id, zone, type, x, y };
    this.nodes.set(id, nodeObj);
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, []);
    }
    return nodeObj;
  }

  /**
   * Adds a weighted road (edge) between two city locations.
   * @param {Object} edge
   */
  addEdge({
    from,
    to,
    weight,
    roadName = 'City Road',
    distanceKm = null,
    speedKmh = 50,
    congestion = 1.0,
    bidirectional = true,
  }) {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error(`Both endpoints must exist in graph: ${from} -> ${to}`);
    }
    const numericWeight = Number(weight);
    if (Number.isNaN(numericWeight)) {
      throw new Error(`Invalid edge weight: ${weight}`);
    }

    const edgeRecord = {
      id: `${from}-${to}-${this.edges.length + 1}`,
      from,
      to,
      weight: numericWeight,
      baseWeight: numericWeight,
      roadName,
      distanceKm: distanceKm !== null ? Number(distanceKm) : Number(Math.abs(numericWeight).toFixed(2)),
      speedKmh,
      congestion,
      bidirectional,
    };

    this.edges.push(edgeRecord);
    this._addDirectedEdge(from, to, numericWeight, edgeRecord);

    if (bidirectional) {
      this._addDirectedEdge(to, from, numericWeight, edgeRecord);
    }

    return edgeRecord;
  }

  _addDirectedEdge(from, to, weight, meta) {
    const dirEdge = {
      from,
      to,
      weight,
      roadName: meta.roadName,
      distanceKm: meta.distanceKm,
      speedKmh: meta.speedKmh,
      congestion: meta.congestion,
    };
    this.adjacency.get(from).push(dirEdge);
    this.directedEdges.push(dirEdge);
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  getNeighbors(id) {
    return this.adjacency.get(id) || [];
  }

  getDirectedEdges() {
    return this.directedEdges;
  }

  getVertexCount() {
    return this.nodes.size;
  }

  getEdgeCount() {
    return this.directedEdges.length;
  }

  hasNegativeWeights() {
    return this.directedEdges.some((e) => e.weight < 0);
  }

  /**
   * Produces a new graph with weights adjusted by traffic congestion and optional metric mode.
   * @param {Object} options
   * @param {number} options.trafficMultiplier - Multiplier >= 0.5 applied to congested zones
   * @param {'time'|'distance'|'eco'} options.metric - Weighting objective
   */
  cloneWithOptions({ trafficMultiplier = 1.0, metric = 'time' } = {}) {
    const cloned = new CityGraph(`${this.name} (${metric})`);
    for (const node of this.nodes.values()) {
      cloned.addNode({ ...node });
    }

    for (const edge of this.edges) {
      let computedWeight = edge.baseWeight;
      if (metric === 'distance') {
        computedWeight = edge.distanceKm;
      } else if (metric === 'time') {
        // Travel time in minutes scaled by road congestion and global traffic multiplier
        const effectiveCongestion = 1 + (edge.congestion - 1) * trafficMultiplier;
        const speed = Math.max(10, edge.speedKmh / effectiveCongestion);
        computedWeight = Number(((edge.distanceKm / speed) * 60).toFixed(2));
      } else if (metric === 'eco') {
        // Eco-routing cost: travel time minus green-corridor EV energy credit on select highways
        const isGreenCorridor = edge.roadName.includes('Green') || edge.roadName.includes('Express');
        const credit = isGreenCorridor ? 6.5 : 0;
        computedWeight = Number((edge.baseWeight - credit).toFixed(2));
      }

      cloned.addEdge({
        ...edge,
        weight: computedWeight,
      });
    }

    return cloned;
  }

  toJSON() {
    return {
      name: this.name,
      vertexCount: this.getVertexCount(),
      directedEdgeCount: this.getEdgeCount(),
      undirectedEdgeCount: this.edges.length,
      hasNegativeWeights: this.hasNegativeWeights(),
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }
}
