import { useMemo, useState } from 'react';
import type { HeatmapEntry } from '../../api/progress';

interface HeatmapProps {
  data: HeatmapEntry[];
}

const DAYS_IN_WEEK = 7;
const WEEKS = 52;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const CELL_STRIDE = CELL_SIZE + CELL_GAP;

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColor(count: number): string {
  if (count === 0) return '#1e2440';
  if (count === 1) return '#4a7c59';
  if (count === 2) return '#5a9968';
  if (count <= 4) return '#72bb80';
  return '#a8c5a0';
}

interface GridCell {
  date: string;
  count: number;
  col: number;
  row: number;
}

export function Heatmap({ data }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ cell: GridCell; x: number; y: number } | null>(null);

  const { cells, monthPositions } = useMemo(() => {
    const countMap: Record<string, number> = {};
    data.forEach((d) => {
      countMap[d.date] = d.count;
    });

    // Build a 52-week grid ending today
    const today = new Date();
    // Go back to the Sunday/Monday that starts our grid
    const endDate = new Date(today);
    // Align to end of week
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - WEEKS * DAYS_IN_WEEK + 1);

    const gridCells: GridCell[] = [];
    const monthPos: { month: number; col: number }[] = [];
    let lastMonth = -1;

    for (let col = 0; col < WEEKS; col++) {
      for (let row = 0; row < DAYS_IN_WEEK; row++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + col * DAYS_IN_WEEK + row);
        const dateStr = d.toISOString().slice(0, 10);
        const month = d.getMonth();

        if (month !== lastMonth && row === 0) {
          monthPos.push({ month, col });
          lastMonth = month;
        }

        gridCells.push({
          date: dateStr,
          count: countMap[dateStr] ?? 0,
          col,
          row,
        });
      }
    }

    return { cells: gridCells, monthPositions: monthPos };
  }, [data]);

  const svgWidth = WEEKS * CELL_STRIDE + 32; // 32 for day labels
  const svgHeight = DAYS_IN_WEEK * CELL_STRIDE + 24; // 24 for month labels

  return (
    <div className="relative overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        aria-label="Meditation activity heatmap"
        role="img"
      >
        {/* Month labels */}
        {monthPositions.map(({ month, col }) => (
          <text
            key={`month-${month}-${col}`}
            x={32 + col * CELL_STRIDE}
            y={10}
            className="text-xs"
            fill="#ffffff60"
            fontSize="10"
          >
            {MONTH_LABELS[month]}
          </text>
        ))}

        {/* Day labels */}
        {DAY_LABELS.map((label, i) => (
          <text
            key={`day-${i}`}
            x={0}
            y={24 + i * CELL_STRIDE + CELL_SIZE - 2}
            fill="#ffffff40"
            fontSize="9"
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {cells.map((cell) => (
          <rect
            key={cell.date}
            x={32 + cell.col * CELL_STRIDE}
            y={20 + cell.row * CELL_STRIDE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={2}
            fill={getColor(cell.count)}
            className="cursor-pointer transition-opacity hover:opacity-80"
            onMouseEnter={(e) => {
              const rect = (e.target as SVGRectElement).getBoundingClientRect();
              setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.top - 8 });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-offwhite/40">
        <span>Less</span>
        {[0, 1, 2, 3, 5].map((count) => (
          <div
            key={count}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(count) }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-navy-light border border-white/10 rounded-lg px-2 py-1.5 text-xs text-offwhite pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-medium">{tooltip.cell.date}</p>
          <p className="text-offwhite/60">
            {tooltip.cell.count === 0 ? 'No sessions' : `${tooltip.cell.count} session${tooltip.cell.count !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  );
}
