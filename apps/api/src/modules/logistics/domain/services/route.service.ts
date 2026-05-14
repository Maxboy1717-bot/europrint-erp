/**
 * @module route.service
 * @description Shortest-path search over a weighted road / route graph,
 *   implemented with **Dijkstra** + binary min-heap priority queue.
 *
 *   Used by delivery planning to find the lowest-cost path between two
 *   stops where cost can be distance (km), drive time (minutes), or fuel
 *   (UZS) — caller decides what `weight` means by how they build the graph.
 *
 *   Complexity: O((V + E) log V) — fine for our city-scale graphs (~thousand
 *   nodes, ~few thousand edges).
 * @layer Domain Service (Logistics — pure compute, no DB)
 *
 * WHY DIJKSTRA, NOT BFS / BELLMAN-FORD / A*
 *   - **BFS** assumes uniform edge weights — wrong for road graphs where
 *     km and traffic vary per segment. Would return wrong "shortest" path.
 *   - **Bellman-Ford** is only worth it when edges can be negative.
 *     Road distance/time/cost is always positive, so Dijkstra's tighter
 *     O((V+E) log V) beats Bellman's O(V·E).
 *   - **A*** would be faster with a good heuristic (e.g. haversine to
 *     destination), but requires admissible heuristic to stay correct.
 *     We may upgrade to A* + haversine if route planning becomes a hot
 *     path; for now Dijkstra is fast enough and simpler to debug.
 *
 * WHY BINARY HEAP (not Fibonacci or std array)
 *   Binary heap: O(log V) per push/pop. Simple to implement, cache-friendly,
 *   no dependencies. Fibonacci would be theoretically faster (O(1) decrease-
 *   key) but in practice slower for small V due to constants. Std array
 *   push + linear scan for min would be O(V) per op — too slow at our scale.
 *
 * WHY THE HEAP IS INLINED IN THIS FILE
 *   Used in one place; isolating it lets us tune for the specific
 *   `[dist, node]` tuple shape. If another module needs a min-heap, factor
 *   it into `common/datastructures/min-heap.ts` then.
 *
 * WHY GRAPH IS A `Map<string, GraphEdge[]>` (not adjacency matrix)
 *   Our road graph is sparse — most pairs of nodes have no direct edge.
 *   Adjacency list is O(V + E) space; matrix would be O(V²) — wasteful
 *   for 1000-node graphs. Map keyed by node id is convenient because node
 *   ids are warehouse codes (strings), not contiguous integers.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { Calculation } from '@common/decorators/calculation.decorator';

export interface GraphEdge {
  to: string;
  weight: number;
}

export type Graph = Map<string, GraphEdge[]>;

export interface DijkstraResult {
  path: string[];
  totalDist: number;
}

/** Binary min-heap priority queue */
class MinHeap {
  private heap: [number, string][] = [];

  push(dist: number, node: string): void {
    this.heap.push([dist, node]);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): [number, string] | undefined {
    if (!this.heap.length) return;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (last === undefined) return top;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number { return this.heap.length; }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent][0] > this.heap[i][0]) {
        [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l][0] < this.heap[smallest][0]) smallest = l;
      if (r < n && this.heap[r][0] < this.heap[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

@Injectable()
export class RouteService {
  /**
   * Dijkstra algoritmi yordamida eng qisqa yo'l topish.
   * Sinxron — sof hisoblash, DB so'rovi yo'q.
   */
  dijkstra(
    graph: Graph,
    source: string,
    target: string,
  ): Result<DijkstraResult, AppError> {
    if (!graph.has(source)) {
      return Err({ code: 'NOT_FOUND', message: `Tugun topilmadi: ${source}` });
    }
    if (!graph.has(target)) {
      return Err({ code: 'NOT_FOUND', message: `Tugun topilmadi: ${target}` });
    }

    const dist = new Map<string, number>();
    const prev = new Map<string, string | null>();
    const visited = new Set<string>();

    for (const node of graph.keys()) {
      dist.set(node, Infinity);
      prev.set(node, null);
    }
    dist.set(source, 0);

    const pq = new MinHeap();
    pq.push(0, source);

    while (pq.size > 0) {
      const entry = pq.pop();
      if (!entry) break;
      const [d, u] = entry;

      if (visited.has(u)) continue;
      visited.add(u);

      if (u === target) break;

      const neighbors = graph.get(u) ?? [];
      for (const { to, weight } of neighbors) {
        if (weight < 0) {
          return Err({ code: 'VALIDATION', message: `Manfiy qirra og'irligi: ${u}→${to}` });
        }
        const alt = d + weight;
        if (alt < (dist.get(to) ?? Infinity)) {
          dist.set(to, alt);
          prev.set(to, u);
          pq.push(alt, to);
        }
      }
    }

    const targetDist = dist.get(target) ?? Infinity;
    if (!isFinite(targetDist)) {
      return Err({ code: 'NOT_FOUND', message: `Yo'l topilmadi: ${source} → ${target}` });
    }

    const path: string[] = [];
    let curr: string | null = target;
    while (curr !== null) {
      path.unshift(curr);
      curr = prev.get(curr) ?? null;
    }

    return Ok({ path, totalDist: targetDist });
  }

  /**
   * Barcha tugunlarga eng qisqa masofalarni hisoblash (multi-target).
   * Sinxron — sof hisoblash.
   */
  dijkstraAll(
    graph: Graph,
    source: string,
  ): Result<Map<string, number>, AppError> {
    if (!graph.has(source)) {
      return Err({ code: 'NOT_FOUND', message: `Tugun topilmadi: ${source}` });
    }

    const dist = new Map<string, number>();
    const visited = new Set<string>();

    for (const node of graph.keys()) dist.set(node, Infinity);
    dist.set(source, 0);

    const pq = new MinHeap();
    pq.push(0, source);

    while (pq.size > 0) {
      const entry = pq.pop();
      if (!entry) break;
      const [d, u] = entry;
      if (visited.has(u)) continue;
      visited.add(u);

      for (const { to, weight } of graph.get(u) ?? []) {
        const alt = d + weight;
        if (alt < (dist.get(to) ?? Infinity)) {
          dist.set(to, alt);
          pq.push(alt, to);
        }
      }
    }

    return Ok(dist);
  }

  /**
   * Yo'naltirilmagan grafni yo'naltirilgan grafga aylantirish.
   */
  buildUndirectedGraph(
    edges: readonly { from: string; to: string; weight: number }[],
  ): Graph {
    const graph: Graph = new Map();
    for (const { from, to, weight } of edges) {
      if (!graph.has(from)) graph.set(from, []);
      if (!graph.has(to))   graph.set(to, []);
      graph.get(from)?.push({ to, weight });
      graph.get(to)?.push({ to: from, weight });
    }
    return graph;
  }

  /**
   * Async wrapper: marshrut optimizatsiya uchun (parallel operatsiyalar uchun).
   */
  @Calculation('logistics.routing.dijkstra')
  async shortestPath(
    graph: Graph,
    source: string,
    target: string,
  ): Promise<Result<DijkstraResult, AppError>> {
    return this.dijkstra(graph, source, target);
  }
}
