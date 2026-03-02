/**
 * Unit tests for Heatmap component.
 *
 * Run with: npx vitest
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heatmap } from '../components/progress/Heatmap';
import type { HeatmapEntry } from '../api/progress';

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

const mockData: HeatmapEntry[] = [
  { date: today, count: 3 },
  { date: yesterday, count: 1 },
];

describe('Heatmap', () => {
  it('renders without crashing with empty data', () => {
    render(<Heatmap data={[]} />);
    expect(screen.getByRole('img', { name: /heatmap/i })).toBeInTheDocument();
  });

  it('renders with data', () => {
    render(<Heatmap data={mockData} />);
    expect(screen.getByRole('img', { name: /heatmap/i })).toBeInTheDocument();
  });

  it('renders the legend', () => {
    render(<Heatmap data={[]} />);
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders 52*7 = 364 cells', () => {
    const { container } = render(<Heatmap data={[]} />);
    const cells = container.querySelectorAll('rect');
    expect(cells.length).toBe(364);
  });
});
