import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

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
   */
  @Calculation('pp.bom.explodeFromDb')
  async explodeFromDb(
    productId: string,
    qty: number,
  ): Promise<Result<BomExplosionResult, AppError>> {
    try {
      const result = await runQuery<Record<string, unknown>>(sql`
        SELECT parent_id AS "parentId", child_id AS "childId",
               qty_per_unit AS "qtyPerUnit"
        FROM bom_components
        WHERE is_active = true
      `);
      const rawRows = result?.rows ?? [];
      const components: BomEdge[] = (rawRows ?? []).map((r) => ({
        parentId: String(r['parentId'] ?? ''),
        childId: String(r['childId'] ?? ''),
        qtyPerUnit: safeNum(r['qtyPerUnit'], 1),
      }));
      return this.explodeInMemory(productId, qty, components);
    } catch (_e) {
      return Err(makeBomErr('DB_ERROR', String(_e)));
    }
  }
}
