/**
 * OrgChartTreeNode.test.tsx — Phase 6 T6.1 + T6.2
 *
 * Verifies:
 *   T6.1 — name highlight uses <mark> when query matches, node gets a `ring`
 *          class so the user sees it pop in the tree.
 *   T6.2 — when `vepUserId` is set, the VEP chip renders as a Link to
 *          `/employees/:id` instead of plain text, and clicking it does NOT
 *          toggle the row.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { OrgChartTreeNode } from '../OrgChartTreeNode';
import type { OrgChartNode } from '../orgChartTypes';

// Wouter's <Link> renders a plain <a> with the resolved href without needing
// a router provider; we don't assert navigation here, only the href + click
// propagation behaviour.
function renderWithRouter(ui: React.ReactElement) {
  return render(ui);
}

const baseNode: OrgChartNode = {
  id: '42',
  name: 'Engineering',
  vep: 'Boburjon',
  vepUserId: 7,
  employeeCount: 12,
  children: [],
};

describe('OrgChartTreeNode — T6.1 highlight', () => {
  it('renders raw name when query is empty', () => {
    renderWithRouter(
      <OrgChartTreeNode
        node={baseNode}
        expandedIds={new Set()}
        matchedIds={new Set()}
        onToggle={() => undefined}
        query=""
      />,
    );
    expect(screen.queryByTestId('search-mark')).toBeNull();
    expect(screen.getByTestId('text-dept-name-42').textContent).toBe('Engineering');
  });

  it('wraps matched substring in <mark> when query matches (case-insensitive)', () => {
    renderWithRouter(
      <OrgChartTreeNode
        node={baseNode}
        expandedIds={new Set()}
        matchedIds={new Set(['42'])}
        onToggle={() => undefined}
        query="eng"
      />,
    );
    const marks = screen.getAllByTestId('search-mark');
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe('Eng');
  });

  it('adds the ring class to matched nodes', () => {
    renderWithRouter(
      <OrgChartTreeNode
        node={baseNode}
        expandedIds={new Set()}
        matchedIds={new Set(['42'])}
        onToggle={() => undefined}
        query="eng"
      />,
    );
    const row = screen.getByTestId('tree-node-toggle-42');
    expect(row.className).toMatch(/ring-2/);
  });
});

describe('OrgChartTreeNode — T6.2 navigation', () => {
  it('renders VEP as a link to /employees/:id when vepUserId is set', () => {
    renderWithRouter(
      <OrgChartTreeNode
        node={baseNode}
        expandedIds={new Set()}
        matchedIds={new Set()}
        onToggle={() => undefined}
        query=""
      />,
    );
    const link = screen.getByTestId('link-employee-42') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/employees/7');
  });

  it('renders VEP as plain text when no vepUserId / headUserId', () => {
    const node: OrgChartNode = { ...baseNode, vepUserId: undefined, headUserId: undefined };
    renderWithRouter(
      <OrgChartTreeNode
        node={node}
        expandedIds={new Set()}
        matchedIds={new Set()}
        onToggle={() => undefined}
        query=""
      />,
    );
    expect(screen.queryByTestId('link-employee-42')).toBeNull();
    expect(screen.getByTestId('text-vep-42').textContent).toBe('Boburjon');
  });

  it('falls back to headUserId when vepUserId is missing', () => {
    const node: OrgChartNode = { ...baseNode, vepUserId: undefined, headUserId: 99 };
    renderWithRouter(
      <OrgChartTreeNode
        node={node}
        expandedIds={new Set()}
        matchedIds={new Set()}
        onToggle={() => undefined}
        query=""
      />,
    );
    const link = screen.getByTestId('link-employee-42') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/employees/99');
  });

  it('clicking the employee link does NOT toggle the row', () => {
    const onToggle = vi.fn();
    renderWithRouter(
      <OrgChartTreeNode
        node={baseNode}
        expandedIds={new Set()}
        matchedIds={new Set()}
        onToggle={onToggle}
        query=""
      />,
    );
    fireEvent.click(screen.getByTestId('link-employee-42'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('clicking the row body still toggles expansion', () => {
    const onToggle = vi.fn();
    const node: OrgChartNode = {
      ...baseNode,
      children: [{ id: '99', name: 'Sub' }],
    };
    renderWithRouter(
      <OrgChartTreeNode
        node={node}
        expandedIds={new Set()}
        matchedIds={new Set()}
        onToggle={onToggle}
        query=""
      />,
    );
    fireEvent.click(screen.getByTestId('tree-node-toggle-42'));
    expect(onToggle).toHaveBeenCalledWith('42');
  });
});
