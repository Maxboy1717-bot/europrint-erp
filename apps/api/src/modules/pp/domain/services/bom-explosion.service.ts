/**
 * @module bom-explosion.service
 * @description "Explodes" a multi-level Bill of Materials into a flat list of
 *   total material requirements. Given a finished product and the qty to
 *   build, walks the parent→child graph and sums up every component's net
 *   requirement (handling diamond dependencies and shared sub-assemblies).
 *
 *   Used by:
 *     - MRP (`run-mrp.handler.ts`) — gross requirements per material per period
 *     - Quotation costing — total raw material cost of a quoted job
 *     - Shop-floor pick lists — what to deliver to the production line
 *
 *   Algorithm:
 *     1. Build adjacency map from the BOM edges
 *     2. BFS from `productId` to find the *reachable* subgraph
 *     3. Kahn topological sort on that subgraph (in-degree 0 first)
 *     4. Single forward pass, accumulating each node's qty into its children
 *
 *   Complexity: O(V + E) where V = unique materials reachable, E = BOM edges
 *   in the subgraph. Diamond dependencies (A→B→D and A→C→D) are correctly
 *   accumulated because each child's contribution is added per parent traversal.
 * @layer Domain Service (PP — pure compute over in-memory BOM graph)
 *
 * WHY KAHN TOPOLOGICAL + MEMOIZATION
 *   Naive recursive multiplication would re-traverse shared sub-assemblies
 *   exponentially (D in the diamond above visited twice). Kahn's algorithm
 *   guarantees each node is processed exactly once — critical for our larger
 *   BOMs (some assemblies have 50+ components 5 levels deep).
 *
 * WHY CYCLE DETECTION IS SUBGRAPH-SCOPED
 *   A cycle anywhere in the *global* BOM doesn't necessarily affect this
 *   product — it might be in an unrelated assembly. We only refuse if the
 *   cycle is reachable from `productId`. This matters because the BOM table
 *   is shared across products; one bad row shouldn't block all explosions.
 *
 * WHY MISSING productId IS NOT_FOUND, NOT EMPTY RESULT
 *   Calling explode on a leaf material (no children) is almost always a bug
 *   in the caller. Returning empty would mask it; NOT_FOUND surfaces the
 *   error so the planner sees it. If you genuinely need to explode a leaf,
 *   wrap with a try/catch in the caller and treat NOT_FOUND as empty there.
 *
 * DIAMOND DEPENDENCY TEST CASE (worth knowing)
 *   Edges: A→B(2), A→C(3), B→D(4), C→D(5)
 *   Explode(A, qty=1):
 *     A=1, B=2, C=3
 *     D = 2×4 (from B) + 3×5 (from C) = 23
 *   This is what the tests in `bom-explosion.spec.ts` verify.
 */

import { Injectable, Inject } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import type { IPpRepository } from '../repositories/pp.repository';
import { PP_REPO } from '../repositories/pp.repository';

export interface BomEdge {
  parentId: string;
  childId: string;
  qtyPerUnit: number;
}

export interface BomExplosionResult {
  requirements: Map<string, number>;
  totalNodes: number;
}

function makeBomErr(code: AppError['code'], message: string): AppError {
  return { code, message };
}

@Injectable()
export class BomExplosionService {
  constructor(
    @Inject(PP_REPO) private readonly repo: IPpRepository,
  ) {}

  /**
   * TZ-D09: BOM Explosion — Kahn topologik tartib + Memoization
   * Murakkablik: O(V+E) — bitta traversal
   *
   * Formula: R(i, q) = q + Σ_{j:(i,j)∈E} R(j, q×m_ij)
   *   q — i materialning o'zi (oraliq ham)
   *   R(j, ...) — bolalar talablarini yig'ish
   *
   * Sikl: faqat productId dan erishiluvchi subgrafda tekshiriladi
   * (global BOM da boshqa sikl bo'lsa — bu mahsulotga ta'sir qilmaydi)
   *
   * Diamond dependency test:
   *   A→B(2), A→C(3), B→D(4), C→D(5)
   *   R(A,1): B=2, C=3, D=2×4+3×5=23  ✓
   */
  @Calculation('pp.bom.explodeInMemory')
  explodeInMemory(
    productId: string,
    qty: number,
    components: BomEdge[],
  ): Result<BomExplosionResult, AppError> {
    if (qty <= 0) return Err(makeBomErr('VALIDATION', 'qty musbat bo\'lishi kerak'));
    if (!productId) return Err(makeBomErr('VALIDATION', 'productId bo\'sh bo\'lmasin'));

    // 1. To'liq adjacency map: barcha komponentlardan
    const adjAll = new Map<string, { childId: string; qty: number }[]>();
    const allNodesAll = new Set<string>();

    for (const c of components) {
      const pId = c.parentId;
      const cId = c.childId;
      if (!adjAll.has(pId)) adjAll.set(pId, []);
      const adjList = adjAll.get(pId);
      if (adjList) adjList.push({ childId: cId, qty: safeNum(c.qtyPerUnit, 1) });
      allNodesAll.add(pId);
      allNodesAll.add(cId);
    }

    if (!allNodesAll.has(productId)) {
      // Izoh: Agar productId hech qanday BOM edge da yo'q bo'lsa (barg material),
      // NOT_FOUND qaytariladi. Bu ataylab: komponentlarsiz mahsulot BOM ga
      // kiritilmagan deb hisoblanadi. Agar bo'sh requirements kerak bo'lsa,
      // bomEdges da productId qatnashishi lozim yoki explodeInMemory chaqirilmasin.
      return Err(makeBomErr('NOT_FOUND', `productId '${productId}' BOM da topilmadi`));
    }

    // 2. Faqat productId dan erishiluvchi nodelarni topamiz (BFS)
    const reachable = new Set<string>();
    const bfsQueue: string[] = [productId];
    while (bfsQueue.length) {
      const node = bfsQueue.shift();
      if (!node || reachable.has(node)) continue;
      reachable.add(node);
      for (const { childId } of adjAll.get(node) ?? []) {
        if (!reachable.has(childId)) bfsQueue.push(childId);
      }
    }

    // 3. Subgraf: faqat reachable nodelar uchun adj va inDegree
    const adj = new Map<string, { childId: string; qty: number }[]>();
    const inDegree = new Map<string, number>();

    for (const node of reachable) {
      if (!inDegree.has(node)) inDegree.set(node, 0);
      for (const edge of adjAll.get(node) ?? []) {
        if (reachable.has(edge.childId)) {
          if (!adj.has(node)) adj.set(node, []);
          adj.get(node)?.push(edge);
          inDegree.set(edge.childId, (inDegree.get(edge.childId) ?? 0) + 1);
        }
      }
    }

    // 4. Kahn's topologik tartib + sikl tekshiruv (faqat reachable subgrafda)
    const queue: string[] = [];
    for (const node of reachable) {
      if ((inDegree.get(node) ?? 0) === 0) queue.push(node);
    }

    const topoOrder: string[] = [];
    let processed = 0;
    while (queue.length) {
      const node = queue.shift();
      if (!node) continue;
      topoOrder.push(node);
      processed++;
      for (const { childId } of adj.get(node) ?? []) {
        const deg = (inDegree.get(childId) ?? 1) - 1;
        inDegree.set(childId, deg);
        if (deg === 0) queue.push(childId);
      }
    }

    if (processed < reachable.size) {
      return Err(makeBomErr('CONFLICT', `CyclicBomError: '${productId}' BOM da sikl aniqlandi`));
    }

    // 5. Memoization: barg→root, har node o'zini (qty=1) + bolalarni saqlaydi
    const memo = new Map<string, Map<string, number>>();
    for (const node of [...topoOrder].reverse()) {
      const children = adj.get(node);
      const total = new Map<string, number>();

      // Node o'zi (oraliq yoki barg — ikkisi ham kerakli material)
      total.set(node, 1);

      if (children && children.length > 0) {
        for (const { childId, qty: edgeQty } of children) {
          const childMemo = memo.get(childId);
          if (!childMemo) continue;
          for (const [mat, q] of childMemo) {
            total.set(mat, (total.get(mat) ?? 0) + q * edgeQty);
          }
        }
      }

      memo.set(node, total);
    }

    const baseReq = memo.get(productId);
    if (!baseReq) {
      return Err(makeBomErr('NOT_FOUND', `productId '${productId}' memo da topilmadi`));
    }

    // Root mahsulotning o'zini chiqaramiz (uni ishlab chiqaramiz, xarID qilmaymiz)
    const requirements = new Map<string, number>();
    for (const [mat, q] of baseReq) {
      if (mat === productId) continue;
      requirements.set(mat, q * qty);
    }

    return Ok({ requirements, totalNodes: reachable.size });
  }

  /**
   * DB-dan BOM yuklab, keyin explodeInMemory() chaqiradi.
   * Repository orqali so'rov yuboradi — domain SQL bilmaydi.
   */
  @Calculation('pp.bom.explodeFromDb')
  async explodeFromDb(
    productId: string,
    qty: number,
  ): Promise<Result<BomExplosionResult, AppError>> {
    const componentsResult = await this.repo.findActiveBomComponents();
    if (!componentsResult.ok) {
      return Err(makeBomErr('DB_ERROR', componentsResult.error.message));
    }
    const components: BomEdge[] = (Array.isArray(componentsResult.data) ? componentsResult.data : []).map((r) => ({
      parentId: r.parentId,
      childId: r.childId,
      qtyPerUnit: safeNum(r.qtyPerUnit, 1),
    }));
    return this.explodeInMemory(productId, qty, components);
  }
}
