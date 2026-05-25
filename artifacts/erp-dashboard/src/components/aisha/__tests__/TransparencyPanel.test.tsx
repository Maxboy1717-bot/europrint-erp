import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { TransparencyPanel } from '../TransparencyPanel';
import { useAishaStore, type AishaResponse } from '@/aisha/store';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function setResp(over: Partial<AishaResponse['provenance']> = {}): void {
  useAishaStore.setState({
    lastResponse: {
      text: 'ok',
      provenance: {
        sources: [
          { type: 'database', identifier: 'sd.sales_orders', queriedAt: '2026-01-01T00:00:00Z', latencyMs: 12, freshness: 'live', rowCount: 5 },
        ],
        confidence: 0.85,
        citations: [{ label: 'SO-1', url: '/sd/orders/1' }],
        ...over,
      },
    },
  });
}

beforeEach(() => {
  useAishaStore.setState({ lastResponse: null });
  cleanup();
});

describe('TransparencyPanel', () => {
  it('renders nothing when no response yet', () => {
    const { container } = render(<TransparencyPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders panel when response is present', () => {
    setResp();
    render(<TransparencyPanel />);
    expect(screen.getByTestId('aisha-transparency')).toBeInTheDocument();
  });

  it('shows confidence percentage', () => {
    setResp();
    render(<TransparencyPanel />);
    expect(screen.getByTestId('aisha-confidence')).toHaveTextContent('85');
  });

  it('lists every source identifier', () => {
    setResp({
      sources: [
        { type: 'database', identifier: 'a.b', queriedAt: 'x', latencyMs: 1, freshness: 'live' },
        { type: 'camera',   identifier: 'camera.c1', queriedAt: 'x', latencyMs: 2, freshness: 'live' },
      ],
    });
    render(<TransparencyPanel />);
    expect(screen.getByText('a.b')).toBeInTheDocument();
    expect(screen.getByText('camera.c1')).toBeInTheDocument();
  });

  it('renders camera snapshots when present', () => {
    setResp({
      cameraSnapshots: [
        { cameraId: 'c1', cameraName: 'Sex-3', snapshotUrl: 'http://x/1.jpg', capturedAt: 'now' },
      ],
    });
    render(<TransparencyPanel />);
    expect(screen.getByTestId('aisha-cameras')).toBeInTheDocument();
    expect(screen.getByAltText('Sex-3')).toBeInTheDocument();
  });

  it('hides camera section when no snapshots', () => {
    setResp();
    render(<TransparencyPanel />);
    expect(screen.queryByTestId('aisha-cameras')).toBeNull();
  });

  it('renders citation links when url provided', () => {
    setResp();
    render(<TransparencyPanel />);
    const link = screen.getByRole('link', { name: 'SO-1' });
    expect(link).toHaveAttribute('href', '/sd/orders/1');
  });

  it('collapse button toggles content visibility', () => {
    setResp();
    render(<TransparencyPanel />);
    const btn = screen.getAllByRole('button')[0];
    fireEvent.click(btn);
    expect(screen.queryByText('transparency.sources')).toBeNull();
  });
});
