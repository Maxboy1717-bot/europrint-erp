/**
 * route.service.ts — TZ-48: Dijkstra Eng Qisqa Yo'l
 *
 * Dijkstra algoritmi (priority queue — min-heap):
 *   dist[s] = 0, dist[v] = ∞  ∀v ≠ s
 *   O((V + E) log V) murakkablik
 *   prev[] massivi orqali yo'l rekonstruksiyasi
 *
 * TAQIQLANGAN: BFS (og'irsiz graf uchun), Bellman-Ford (manfiy qirralar yo'q)
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
