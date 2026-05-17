/**
 * @module MobileAccordionTree.test
 * @description Phase 2 / Task 2.3 — verifies the mobile org-chart accordion
 *   renders nodes, exposes children behind triggers, and degrades gracefully
 *   on empty / null input.
 *
 *   The component renders a Radix Accordion. We assert structure via
 *   data-testid hooks rather than open/close interaction — Radix's controlled
 *   collapse uses portals/CSS animation that aren't worth simulating here.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { MobileAccordionTree, type OrgChartNode } from '../MobileAccordionTree';

const sampleTree: OrgChartNode[] = [
  {
    id: 'dept-1',
    name: 'Production',
    employeeCount: 42,
    color: '#aabbcc',
    vep: 'Bahodir',
    children: [
      {
        id: 'dept-1a',
        name: 'Workshop 1',
        employeeCount: 12,
        children: [
          { id: 'dept-1a-i', name: 'Print line', employeeCount: 3 },
        ],
      },
      {
        id: 'dept-1b',
        name: 'Workshop 2',
        employeeCount: 8,
      },
    ],
  },
  {
    id: 'dept-2',
    name: 'Sales',
    employeeCount: 9,
  },
];

describe('MobileAccordionTree (Phase 2 / Task 2.3)', () => {
  it('renders top-level departments as accordion items', () => {
    render(
      <TestProviders>
        <MobileAccordionTree nodes={sampleTree} />
      </TestProviders>,
    );
    expect(screen.getByTestId('mobile-accordion-item-dept-1')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-accordion-item-dept-2')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-text-dept-name-dept-1')).toHaveTextContent('Production');
    expect(screen.getByTestId('mobile-text-dept-name-dept-2')).toHaveTextContent('Sales');
  });

  it('displays the employee-count badge for each node', () => {
    render(
      <TestProviders>
        <MobileAccordionTree nodes={sampleTree} />
      </TestProviders>,
    );
    expect(screen.getByTestId('mobile-badge-employee-count-dept-1')).toHaveTextContent('42');
    expect(screen.getByTestId('mobile-badge-employee-count-dept-2')).toHaveTextContent('9');
  });

  it('marks the top-level accordion with depth 0', () => {
    render(
      <TestProviders>
        <MobileAccordionTree nodes={sampleTree} />
      </TestProviders>,
    );
    expect(screen.getByTestId('mobile-accordion-d0')).toBeInTheDocument();
  });

  it('renders nothing for an empty node list', () => {
    const { container } = render(
      <TestProviders>
        <MobileAccordionTree nodes={[]} />
      </TestProviders>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for a non-array input', () => {
    const { container } = render(
      <TestProviders>
        {/* Defensive cast — production code paths get here via API noise */}
        <MobileAccordionTree nodes={null as unknown as OrgChartNode[]} />
      </TestProviders>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('disables the trigger for leaf nodes (no children)', () => {
    render(
      <TestProviders>
        <MobileAccordionTree nodes={sampleTree} />
      </TestProviders>,
    );
    const leafTrigger = screen.getByTestId('mobile-accordion-trigger-dept-2');
    // Leaf nodes have hasChildren=false, which sets the disabled attribute.
    expect(leafTrigger).toBeDisabled();
  });

  it('enables the trigger for parent nodes', () => {
    render(
      <TestProviders>
        <MobileAccordionTree nodes={sampleTree} />
      </TestProviders>,
    );
    expect(screen.getByTestId('mobile-accordion-trigger-dept-1')).not.toBeDisabled();
  });
});
