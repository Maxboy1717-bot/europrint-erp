/**
 * @module KnowledgeGraphRoutes
 * @description AI Bilim Grafigi (owner 2026-08-08) — Faza A: list-view route
 * only. Sidebar entry is Faza B (Q-20 — route/page must exist before nav
 * chip); reachable directly at /knowledge-graph until then.
 */

import { lazy } from "react";

const GraphView = lazy(() => import("@/pages/knowledge-graph/GraphView"));

export const KNOWLEDGE_GRAPH_ROUTES: [string, React.ComponentType][] = [
  ['/knowledge-graph', GraphView],
];
