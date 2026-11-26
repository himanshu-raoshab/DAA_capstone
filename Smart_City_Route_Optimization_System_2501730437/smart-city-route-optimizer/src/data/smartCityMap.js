import { CityGraph } from '../models/graph.js';

/**
 * Builds the primary 18-location Smart City road network ("NeoMetro")
 * with realistic district coordinates, distances, speed limits, and congestion factors.
 */
export function createSmartCityGraph() {
  const graph = new CityGraph('NeoMetro Smart City Network');

  const locations = [
    { id: 'HUB', name: 'Central Metro Hub', zone: 'Downtown', type: 'transit', x: 470, y: 290 },
    { id: 'GOV', name: 'City Hall & Civic Plaza', zone: 'Downtown', type: 'civic', x: 375, y: 235 },
    { id: 'FIN', name: 'Financial District', zone: 'Downtown', type: 'commercial', x: 560, y: 225 },
    { id: 'HSP', name: 'City General Hospital', zone: 'Medical', type: 'hospital', x: 310, y: 345 },
    { id: 'UNI', name: 'Metro University Campus', zone: 'Education', type: 'education', x: 220, y: 215 },
    { id: 'TEC', name: 'Cyber Tech Park', zone: 'Tech Corridor', type: 'tech', x: 700, y: 170 },
    { id: 'RND', name: 'AI & Robotics Center', zone: 'Tech Corridor', type: 'tech', x: 825, y: 235 },
    { id: 'GRD', name: 'Smart Grid Power Station', zone: 'Industrial', type: 'energy', x: 645, y: 345 },
    { id: 'AIR', name: 'International Airport', zone: 'Logistics', type: 'airport', x: 855, y: 420 },
    { id: 'PRT', name: 'Harbor Port Terminal', zone: 'Port', type: 'port', x: 690, y: 485 },
    { id: 'MKT', name: 'Grand Central Market', zone: 'Commercial', type: 'commercial', x: 475, y: 410 },
    { id: 'STD', name: 'National Sports Stadium', zone: 'Recreation', type: 'stadium', x: 350, y: 475 },
    { id: 'RES', name: 'Northwood Residences', zone: 'Residential', type: 'residential', x: 265, y: 105 },
    { id: 'ECO', name: 'Green Valley Eco Park', zone: 'Green Belt', type: 'park', x: 130, y: 310 },
    { id: 'SOL', name: 'Solar Farm & Microgrid', zone: 'Green Belt', type: 'energy', x: 120, y: 445 },
    { id: 'LOG', name: 'Freight & Rail Depot', zone: 'Logistics', type: 'logistics', x: 525, y: 515 },
    { id: 'MED', name: 'Biotech Medical Hub', zone: 'Medical', type: 'hospital', x: 475, y: 115 },
    { id: 'EVH', name: 'EV Supercharger Plaza', zone: 'Tech Corridor', type: 'energy', x: 650, y: 85 },
  ];

  for (const loc of locations) {
    graph.addNode(loc);
  }

  // Weight = nominal travel time in minutes
  const roads = [
    { from: 'RES', to: 'UNI', weight: 6.5, distanceKm: 4.2, speedKmh: 45, congestion: 1.15, roadName: 'Scholars Blvd' },
    { from: 'RES', to: 'MED', weight: 7.0, distanceKm: 5.1, speedKmh: 50, congestion: 1.10, roadName: 'North Ring Rd' },
    { from: 'MED', to: 'EVH', weight: 5.5, distanceKm: 4.4, speedKmh: 55, congestion: 1.05, roadName: 'Green Express Pkwy' },
    { from: 'MED', to: 'FIN', weight: 6.8, distanceKm: 3.9, speedKmh: 40, congestion: 1.35, roadName: 'Midtown Ave' },
    { from: 'MED', to: 'GOV', weight: 7.4, distanceKm: 4.3, speedKmh: 40, congestion: 1.30, roadName: 'Civic Connector' },
    { from: 'EVH', to: 'TEC', weight: 5.0, distanceKm: 4.5, speedKmh: 60, congestion: 1.05, roadName: 'Innovation Express' },
    { from: 'UNI', to: 'ECO', weight: 6.0, distanceKm: 4.8, speedKmh: 55, congestion: 1.05, roadName: 'Green Belt Trail' },
    { from: 'UNI', to: 'GOV', weight: 6.2, distanceKm: 3.6, speedKmh: 40, congestion: 1.25, roadName: 'College St' },
    { from: 'ECO', to: 'SOL', weight: 5.2, distanceKm: 4.6, speedKmh: 60, congestion: 1.00, roadName: 'Clean Energy Express' },
    { from: 'ECO', to: 'HSP', weight: 7.1, distanceKm: 4.5, speedKmh: 45, congestion: 1.15, roadName: 'West Park Rd' },
    { from: 'SOL', to: 'STD', weight: 8.2, distanceKm: 6.2, speedKmh: 50, congestion: 1.10, roadName: 'South Ridge Hwy' },
    { from: 'GOV', to: 'HUB', weight: 4.5, distanceKm: 2.2, speedKmh: 35, congestion: 1.45, roadName: 'Central Plaza Rd' },
    { from: 'GOV', to: 'HSP', weight: 5.8, distanceKm: 3.1, speedKmh: 38, congestion: 1.30, roadName: 'Mercy Ave' },
    { from: 'HUB', to: 'FIN', weight: 4.2, distanceKm: 2.1, speedKmh: 35, congestion: 1.50, roadName: 'Commerce Blvd' },
    { from: 'HUB', to: 'MKT', weight: 5.4, distanceKm: 2.7, speedKmh: 35, congestion: 1.45, roadName: 'Market Spine' },
    { from: 'HUB', to: 'GRD', weight: 6.8, distanceKm: 4.4, speedKmh: 45, congestion: 1.20, roadName: 'East Transit Link' },
    { from: 'FIN', to: 'TEC', weight: 7.5, distanceKm: 5.6, speedKmh: 50, congestion: 1.25, roadName: 'Tech Corridor Hwy' },
    { from: 'FIN', to: 'GRD', weight: 6.1, distanceKm: 4.0, speedKmh: 45, congestion: 1.20, roadName: 'Gridline Ave' },
    { from: 'TEC', to: 'RND', weight: 4.8, distanceKm: 3.8, speedKmh: 55, congestion: 1.10, roadName: 'Silicon Loop' },
    { from: 'RND', to: 'AIR', weight: 8.5, distanceKm: 7.8, speedKmh: 65, congestion: 1.10, roadName: 'Airport Express' },
    { from: 'RND', to: 'GRD', weight: 7.3, distanceKm: 5.2, speedKmh: 50, congestion: 1.15, roadName: 'East Industrial Way' },
    { from: 'HSP', to: 'MKT', weight: 6.4, distanceKm: 3.8, speedKmh: 40, congestion: 1.30, roadName: 'Crossway Rd' },
    { from: 'HSP', to: 'STD', weight: 5.9, distanceKm: 3.6, speedKmh: 42, congestion: 1.20, roadName: 'Arena Blvd' },
    { from: 'MKT', to: 'STD', weight: 5.3, distanceKm: 3.3, speedKmh: 42, congestion: 1.25, roadName: 'Victory Ave' },
    { from: 'MKT', to: 'LOG', weight: 5.6, distanceKm: 3.5, speedKmh: 42, congestion: 1.20, roadName: 'Freight Spur Rd' },
    { from: 'MKT', to: 'GRD', weight: 6.7, distanceKm: 4.5, speedKmh: 45, congestion: 1.20, roadName: 'Foundry St' },
    { from: 'STD', to: 'LOG', weight: 6.0, distanceKm: 4.2, speedKmh: 48, congestion: 1.15, roadName: 'South Beltway' },
    { from: 'LOG', to: 'PRT', weight: 6.2, distanceKm: 4.8, speedKmh: 52, congestion: 1.15, roadName: 'Dockside Express' },
    { from: 'GRD', to: 'PRT', weight: 6.9, distanceKm: 5.1, speedKmh: 50, congestion: 1.15, roadName: 'Harbor Artery' },
    { from: 'GRD', to: 'AIR', weight: 9.2, distanceKm: 8.0, speedKmh: 60, congestion: 1.15, roadName: 'Skyway Express' },
    { from: 'PRT', to: 'AIR', weight: 7.6, distanceKm: 6.8, speedKmh: 62, congestion: 1.10, roadName: 'Coastal Freight Express' },
    { from: 'UNI', to: 'RES', weight: 6.5, distanceKm: 4.2, speedKmh: 45, congestion: 1.15, roadName: 'Scholars Bypass', bidirectional: false },
    { from: 'HUB', to: 'HSP', weight: 5.1, distanceKm: 3.2, speedKmh: 42, congestion: 1.25, roadName: 'Emergency Priority Lane', bidirectional: false },
    { from: 'TEC', to: 'HUB', weight: 8.9, distanceKm: 6.4, speedKmh: 50, congestion: 1.20, roadName: 'Express Busway', bidirectional: false },
  ];

  for (const road of roads) {
    graph.addEdge(road);
  }

  return graph;
}

/**
 * Creates a small demonstrative network with negative edge weights
 * (EV regenerative braking / green-corridor toll credits) without negative cycles,
 * where greedy Dijkstra fails while Bellman-Ford finds the true minimum cost.
 */
export function createNegativeWeightDemoGraph() {
  const graph = new CityGraph('EV Green-Corridor Subsidy Network');
  graph.addNode({ id: 'A', name: 'Solar Depot (Start)', zone: 'West', type: 'energy', x: 140, y: 260 });
  graph.addNode({ id: 'B', name: 'Downtown Toll Gate', zone: 'Central', type: 'commercial', x: 400, y: 140 });
  graph.addNode({ id: 'C', name: 'Hillside Express', zone: 'South', type: 'transit', x: 400, y: 380 });
  graph.addNode({ id: 'D', name: 'EV Charging Hub', zone: 'East', type: 'energy', x: 640, y: 260 });
  graph.addNode({ id: 'E', name: 'Airport Terminal (Goal)', zone: 'Logistics', type: 'airport', x: 840, y: 260 });

  graph.addEdge({ from: 'A', to: 'B', weight: 4, roadName: 'City Direct', bidirectional: false });
  graph.addEdge({ from: 'A', to: 'C', weight: 7, roadName: 'Ridge Climb', bidirectional: false });
  graph.addEdge({ from: 'B', to: 'D', weight: 2, roadName: 'Metro Tunnel', bidirectional: false });
  // Negative weight (-5) represents regenerative downhill braking + green-corridor credit
  graph.addEdge({ from: 'C', to: 'B', weight: -5, roadName: 'Downhill Regen Corridor (-5)', bidirectional: false });
  graph.addEdge({ from: 'C', to: 'D', weight: 3, roadName: 'Valley Bypass', bidirectional: false });
  graph.addEdge({ from: 'D', to: 'E', weight: 3, roadName: 'Airport Link', bidirectional: false });

  return graph;
}

/**
 * Creates a network containing a reachable negative-weight cycle
 * to demonstrate Bellman-Ford's cycle detection capability.
 */
export function createNegativeCycleDemoGraph() {
  const graph = createNegativeWeightDemoGraph();
  graph.name = 'Negative-Weight Cycle Anomaly Network';
  // Introduce B -> C with weight +2 so C -> B (-5) + B -> C (+2) = -3 cycle!
  graph.addEdge({ from: 'B', to: 'C', weight: 2, roadName: 'Looping Toll Rebate (+2)', bidirectional: false });
  return graph;
}

/**
 * Deterministic seeded random city graph generator for multi-scale benchmarking.
 * @param {number} numVertices
 * @param {'sparse'|'dense'} density
 * @param {number} seed
 */
export function generateRandomCityGraph(numVertices, density = 'sparse', seed = 42) {
  const graph = new CityGraph(`Synthetic City (V=${numVertices}, ${density})`);

  // Mulberry32 deterministic PRNG
  let state = seed >>> 0;
  const rand = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < numVertices; i++) {
    graph.addNode({
      id: `V${i}`,
      name: `District ${i}`,
      zone: `Zone-${i % 6}`,
      x: Math.round(rand() * 900),
      y: Math.round(rand() * 550),
    });
  }

  // Ensure full connectivity via a random spanning tree first
  const edgeSet = new Set();
  for (let i = 1; i < numVertices; i++) {
    const parent = Math.floor(rand() * i);
    const w = Number((1 + rand() * 19).toFixed(2));
    graph.addEdge({
      from: `V${parent}`,
      to: `V${i}`,
      weight: w,
      roadName: `Road-${parent}-${i}`,
      bidirectional: true,
    });
    edgeSet.add(`${parent}-${i}`);
    edgeSet.add(`${i}-${parent}`);
  }

  // Target undirected edge count based on topology
  const maxUndirected = (numVertices * (numVertices - 1)) / 2;
  const targetUndirected =
    density === 'dense'
      ? Math.min(maxUndirected, Math.floor(numVertices * Math.min(numVertices - 1, Math.max(8, Math.floor(numVertices * 0.25))) / 2))
      : Math.min(maxUndirected, numVertices * 3);

  let attempts = 0;
  const maxAttempts = targetUndirected * 10;
  while (graph.edges.length < targetUndirected && attempts < maxAttempts) {
    attempts++;
    const u = Math.floor(rand() * numVertices);
    const v = Math.floor(rand() * numVertices);
    if (u === v) continue;
    const key = `${u}-${v}`;
    if (edgeSet.has(key)) continue;

    edgeSet.add(key);
    edgeSet.add(`${v}-${u}`);
    const w = Number((1 + rand() * 24).toFixed(2));
    graph.addEdge({
      from: `V${u}`,
      to: `V${v}`,
      weight: w,
      roadName: `Road-${u}-${v}`,
      bidirectional: true,
    });
  }

  return graph;
}
