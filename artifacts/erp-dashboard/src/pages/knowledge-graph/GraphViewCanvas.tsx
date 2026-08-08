/**
 * @module GraphViewCanvas
 * @description React Flow canvas — node/edge mapping from real KG API data.
 * Zoom in/out/fit-to-screen = React Flow's own `<Controls />` (no custom
 * reimplementation). Hover-highlight dims unrelated nodes/edges. Broken
 * edges (`is_broken`) get the animated red pulse (AI-overlay flagship
 * feature, backed by real `qc-failed-kg.listener.ts` + staleness cron data,
 * not a client-side guess).
 */

import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow, Controls, MiniMap, Background, MarkerType, Handle, Position,
} from '@xyflow/react';
import type { Node, Edge, NodeProps, NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './graph-view.css';
import { colorForType, nodeKey } from './GraphViewTypes';
import type { KgNode, KgEdge, LayoutMode } from './GraphViewTypes';
import { gridLayout, circularLayout } from './GraphViewLayout';

function KgFlowNode({ data, id }: NodeProps) {
  const d = data as { entityType: string; title: string; dimmed: boolean };
  return (
    <div
      className={`kg-node ${d.dimmed ? 'kg-node--dimmed' : ''}`}
      style={{ borderColor: colorForType(d.entityType) }}
      data-testid="kg-canvas-node"
      data-node-id={id}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="kg-node__type" style={{ color: colorForType(d.entityType) }}>{d.entityType}</div>
      <div className="kg-node__title">{d.title}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const NODE_TYPES = { kg: KgFlowNode };

interface Props {
  nodes: KgNode[];
  edges: KgEdge[];
  layout: LayoutMode;
  visibleKeys: Set<string> | null; // null = show all (no depth-focus active)
  onNodeClick: (node: KgNode) => void;
}

export function GraphViewCanvas({ nodes, edges, layout, visibleKeys, onNodeClick }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const positions = useMemo(
    () => (layout === 'circular' ? circularLayout(nodes) : gridLayout(nodes)),
    [nodes, layout],
  );

  const relatedToHover = useMemo(() => {
    if (!hoveredKey) return null;
    const related = new Set<string>([hoveredKey]);
    for (const e of edges) {
      const s = nodeKey(e.sourceType, e.sourceId);
      const t = nodeKey(e.targetType, e.targetId);
      if (s === hoveredKey) related.add(t);
      if (t === hoveredKey) related.add(s);
    }
    return related;
  }, [hoveredKey, edges]);

  const rfNodes: Node[] = useMemo(() => nodes
    .filter((n) => !visibleKeys || visibleKeys.has(nodeKey(n.entityType, n.entityId)))
    .map((n) => {
      const key = nodeKey(n.entityType, n.entityId);
      const dimmed = relatedToHover ? !relatedToHover.has(key) : false;
      return {
        id: key,
        type: 'kg',
        position: positions[key] ?? { x: 0, y: 0 },
        data: { entityType: n.entityType, title: n.title, dimmed },
      };
    }), [nodes, positions, visibleKeys, relatedToHover]);

  const rfEdges: Edge[] = useMemo(() => edges
    .filter((e) => {
      if (!visibleKeys) return true;
      return visibleKeys.has(nodeKey(e.sourceType, e.sourceId)) && visibleKeys.has(nodeKey(e.targetType, e.targetId));
    })
    .map((e) => {
      const s = nodeKey(e.sourceType, e.sourceId);
      const t = nodeKey(e.targetType, e.targetId);
      const dimmed = relatedToHover ? !(relatedToHover.has(s) && relatedToHover.has(t)) : false;
      return {
        id: e.id,
        source: s,
        target: t,
        label: e.relationType,
        animated: !e.isBroken,
        className: e.isBroken ? 'kg-edge-broken' : undefined,
        style: {
          stroke: e.isBroken ? 'var(--ep-red)' : 'var(--ep-subtle)',
          strokeWidth: e.isBroken ? 2.5 : 1.5,
          opacity: dimmed ? 0.15 : 1,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: e.isBroken ? 'var(--ep-red)' : 'var(--ep-subtle)' },
      };
    }), [edges, visibleKeys, relatedToHover]);

  const handleNodeClick: NodeMouseHandler = useCallback((_evt, rfNode) => {
    const found = nodes.find((n) => nodeKey(n.entityType, n.entityId) === rfNode.id);
    if (found) onNodeClick(found);
  }, [nodes, onNodeClick]);

  const handleNodeMouseEnter: NodeMouseHandler = useCallback((_evt, rfNode) => setHoveredKey(rfNode.id), []);
  const handleNodeMouseLeave = useCallback(() => setHoveredKey(null), []);

  return (
    <div className="kg-canvas-wrapper">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={(n) => colorForType((n.data as { entityType: string }).entityType)} />
      </ReactFlow>
    </div>
  );
}
