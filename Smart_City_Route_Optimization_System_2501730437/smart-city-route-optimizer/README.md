# Smart City Route Optimization System

**Capstone Project 1**  
**Student Name:** Himanshu Yadav  
**Roll Number:** 2501730437  

## Problem Statement
Develop a route optimization system that finds the shortest and most efficient route between different locations in a city. The system represents locations as vertices and roads as weighted edges, implements **Dijkstra's** and **Bellman-Ford** algorithms to calculate shortest paths, and compares their performance across different graph sizes.

## Key Features
- **Graph Modeling (`src/models/graph.js`)**: Models 18 realistic Smart City locations as vertices and 34 roads (bidirectional and one-way arterial corridors) as weighted edges supporting Travel Time (`min`), Physical Distance (`km`), and Eco-Cost (`EV Credits`).
- **Dijkstra's Algorithm (`src/algorithms/dijkstra.js`)**: Implemented from scratch using a custom **Binary Min-Heap Priority Queue** (`src/algorithms/minHeap.js`) achieving $O((V + E) \log V)$ complexity, with full instrumentation (execution time in µs/ms, relaxations, heap pushes/pops, visited nodes).
- **Bellman-Ford Algorithm (`src/algorithms/bellmanFord.js`)**: Implemented from scratch with up to $|V|-1$ edge relaxation passes, optional **early termination**, and $|V|$-th pass **negative-weight cycle detection** and cycle extraction ($O(V \cdot E)$).
- **Multi-Scale Performance Benchmark (`src/benchmark/benchmark.js`)**: Reproducible benchmark suite across Sparse ($E \approx 6V$) and Dense ($E \approx 0.25V^2$) topologies for graph sizes $V = 20$ up to $1500$.
- **Interactive Web Dashboard (`server.js`, `public/`)**: Live SVG city map visualizer, real-time traffic congestion simulation, side-by-side Dijkstra vs. Bellman-Ford telemetry, interactive benchmark charts, and Negative Weight / Cycle Lab.
- **CLI & Automated Test Suite (`src/cli.js`, `tests/algorithms.test.js`)**: Zero external dependencies; runs natively on Node.js 18+.

## Quick Start
```bash
# 1. Run automated unit tests
npm test

# 2. Run multi-scale performance benchmarks (generates benchmarks/results.json & results.csv)
npm run benchmark

# 3. Query a route via CLI
node src/cli.js route UNI AIR --metric time --traffic 1.2

# 4. Launch the interactive Web Dashboard
npm start
# Open http://127.0.0.1:3456 in your browser
```
