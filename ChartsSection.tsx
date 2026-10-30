import React, { useState } from 'react';
import {
  ChannelBreakdownItem,
  DailyTrendPoint,
  DateRangePreset,
  SalesChannel,
} from '../types/sales';
import { formatCompactCurrency, formatCurrency } from '../utils/salesLogic';

interface ChartsSectionProps {
  trendPoints: DailyTrendPoint[];
  channelBreakdown: ChannelBreakdownItem[];
  selectedChannel: SalesChannel | 'All';
  onSelectChannel: (channel: SalesChannel | 'All') => void;
  activePreset?: DateRangePreset;
  onSelectPreset?: (preset: DateRangePreset) => void;
}

/**
 * Generates a smooth cubic bezier SVG path string through a list of {x, y} coordinates.
 */
function buildSmoothSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpx1 = p0.x + (p1.x - p0.x) * 0.45;
    const cpy1 = p0.y;
    const cpx2 = p0.x + (p1.x - p0.x) * 0.55;
    const cpy2 = p1.y;
    d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  trendPoints,
  channelBreakdown,
  selectedChannel,
  onSelectChannel,
  activePreset = 'monthly',
  onSelectPreset,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // If more than 14 points, sample or aggregate cleanly so the spline curve looks like Analyzo's 7-10 point wave
  const displayPoints =
    trendPoints.length > 14
      ? trendPoints.filter(
          (pt, idx) =>
            pt.revenue > 0 ||
            idx === 0 ||
            idx === trendPoints.length - 1 ||
            idx % 2 === 0
        )
      : trendPoints;

  const safePoints =
    displayPoints.length > 0
      ? displayPoints
      : [
          {
            date: '2026-10-29',
            label: '29 Oct',
            revenue: 0,
            paidRevenue: 0,
            unpaidRevenue: 0,
            orders: 0,
            units: 0,
          },
        ];

  const maxRevenue = Math.max(100000, ...safePoints.map((pt) => pt.revenue)) * 1.15;
  const totalPeriodRevenue = trendPoints.reduce((acc, pt) => acc + pt.revenue, 0);

  // SVG dimensions for Analyzo Smooth Spline Area Chart
  const svgWidth = 700;
  const svgHeight = 255;
  const padLeft = 58;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 34;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const coords = safePoints.map((pt, idx) => {
    const x =
      safePoints.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + (idx / (safePoints.length - 1)) * plotWidth;
    const y = padTop + plotHeight - (pt.revenue / maxRevenue) * plotHeight;
    return { x, y, pt, idx };
  });

  const linePath = buildSmoothSplinePath(coords);
  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
          padTop + plotHeight
        ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(
          padTop + plotHeight
        ).toFixed(1)} Z`
      : '';

  // Default callout index near the middle-right peak (just like Analyzo's 23 August callout)
  const defaultFocusIdx = Math.max(
    0,
    Math.min(coords.length - 1, Math.floor(coords.length * 0.55))
  );
  const activeCoord =
    hoveredIdx !== null && coords[hoveredIdx]
      ? coords[hoveredIdx]
      : coords[defaultFocusIdx];

  const yTicks = [0.2, 0.45, 0.7, 0.95].map((ratio) => ({
    ratio,
    value: Math.round(maxRevenue * ratio),
    y: padTop + plotHeight * (1 - ratio),
  }));

  const maxChannelRev = Math.max(
    1,
    ...channelBreakdown.map((c) => c.revenue)
  );
  const maxChannelUnits = Math.max(
    1,
    ...channelBreakdown.map((c) => c.units)
  );

  return (
    <section
      aria-label="Sales Analytics and Channel Performance"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
    >
      {/* Left 7 Cols: Analyzo Sales Analytics Smooth Spline Area Chart */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between shadow-2xs">
        <div>
          {/* Top Header Row */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Sales Analytics
            </h2>

            <div className="flex items-center gap-2">
              <label
                htmlFor="analytics-period-select"
                className="text-xs text-slate-400"
              >
                Period:
              </label>
              <select
                id="analytics-period-select"
                aria-label="Sales Analytics Period"
                value={activePreset}
                onChange={(e) =>
                  onSelectPreset?.(e.target.value as DateRangePreset)
                }
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="weekly">This Week (7D)</option>
                <option value="monthly">This Month (30D)</option>
                <option value="custom">Custom Range</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Subheader Total + Green Growth Badge */}
          <div className="flex items-center gap-3 mt-1.5 mb-3">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalPeriodRevenue)}
            </span>
            <span className="px-2 py-0.5 text-xs font-bold text-[#10B981] bg-[#E6F7EF] rounded-md font-mono tabular-nums">
              ↑ +20%
            </span>
          </div>

          {/* Smooth Cubic Bezier Area Chart */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-60 select-none"
              role="img"
              aria-label="Sales analytics trend curve"
            >
              <defs>
                <linearGradient
                  id="analyzoBlueFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Dashed Grid Lines & Y-Axis Labels */}
              {yTicks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={t.y}
                    x2={svgWidth - padRight}
                    y2={t.y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={t.y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px] font-mono tabular-nums"
                  >
                    {formatCompactCurrency(t.value)}
                  </text>
                </g>
              ))}

              {/* Baseline */}
              <line
                x1={padLeft}
                y1={padTop + plotHeight}
                x2={svgWidth - padRight}
                y2={padTop + plotHeight}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Soft Blue Area Under Curve */}
              {areaPath && <path d={areaPath} fill="url(#analyzoBlueFill)" />}

              {/* Smooth Royal Blue Spline Curve */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Active Point Vertical Dashed Line, Ring Node & Floating Tooltip Box */}
              {activeCoord && (
                <g>
                  <line
                    x1={activeCoord.x}
                    y1={padTop}
                    x2={activeCoord.x}
                    y2={padTop + plotHeight}
                    stroke="#2563EB"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="6"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="3"
                  />

                  {/* Floating Callout Card inside SVG */}
                  {(() => {
                    const boxW = 148;
                    const boxH = 58;
                    const boxX =
                      activeCoord.x + 14 + boxW > svgWidth - padRight
                        ? activeCoord.x - boxW - 14
                        : activeCoord.x + 12;
                    const boxY = Math.max(
                      padTop,
                      Math.min(padTop + plotHeight - boxH - 8, activeCoord.y - 36)
                    );
                    return (
                      <g>
                        <rect
                          x={boxX}
                          y={boxY}
                          width={boxW}
                          height={boxH}
                          rx="8"
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                          strokeWidth="1"
                        />
                        <text
                          x={boxX + 12}
                          y={boxY + 20}
                          className="fill-slate-500 text-[11px] font-medium"
                        >
                          Income · {activeCoord.pt.label}
                        </text>
                        <text
                          x={boxX + 12}
                          y={boxY + 42}
                          className="fill-slate-900 text-[14px] font-bold font-mono tabular-nums"
                        >
                          {formatCurrency(activeCoord.pt.revenue)}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* X-Axis Labels & Interactive Hover Columns */}
              {coords.map((c, idx) => {
                const count = coords.length;
                const step = Math.max(1, Math.ceil(count / 6));
                const showLabel =
                  count <= 8 ||
                  idx === 0 ||
                  idx === count - 1 ||
                  (idx % step === 0 && idx < count - 2);
                const colWidth = plotWidth / Math.max(1, count);

                return (
                  <g
                    key={c.pt.date}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={c.x - colWidth / 2}
                      y={padTop}
                      width={colWidth}
                      height={plotHeight}
                      fill="transparent"
                    />
                    {showLabel && (
                      <text
                        x={c.x}
                        y={svgHeight - 8}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px] font-mono tabular-nums"
                      >
                        {c.pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block" />
              <span>Daily Revenue Trend</span>
            </span>
            {activeCoord && (
              <span className="font-mono tabular-nums text-slate-600">
                Selected ({activeCoord.pt.label}): {activeCoord.pt.orders} orders ·{' '}
                {activeCoord.pt.units} units
              </span>
            )}
          </div>
          <span>Hover chart to inspect any date</span>
        </div>
      </div>

      {/* Right 5 Cols: Analyzo-Style Traffic / Sales Channel Pyramid & Breakdown */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between shadow-2xs">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Sales Channel
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Units Volume (Left) vs Revenue Share (Right)
              </p>
            </div>
            {selectedChannel !== 'All' ? (
              <button
                type="button"
                onClick={() => onSelectChannel('All')}
                className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
              >
                All Channels
              </button>
            ) : (
              <span className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
                All Channels
              </span>
            )}
          </div>

          {/* Legend Header matching Analyzo's Navy vs Royal Blue Pyramid */}
          <div className="grid grid-cols-12 items-center text-[11px] font-semibold pb-2 border-b border-slate-100">
            <div className="col-span-3 text-slate-500">Channel</div>
            <div className="col-span-3 text-right pr-2 text-[#0F172A]">
              Units Sold
            </div>
            <div className="col-span-3 text-left pl-2 text-[#2563EB]">
              Revenue
            </div>
            <div className="col-span-3 text-right text-slate-500">Total</div>
          </div>

          {channelBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No channel activity in the selected period.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {channelBreakdown.map((ch) => {
                const isSelected = selectedChannel === ch.channel;
                const leftWidthPct = Math.max(
                  8,
                  Math.round((ch.units / maxChannelUnits) * 100)
                );
                const rightWidthPct = Math.max(
                  8,
                  Math.round((ch.revenue / maxChannelRev) * 100)
                );

                return (
                  <button
                    key={ch.channel}
                    type="button"
                    onClick={() =>
                      onSelectChannel(isSelected ? 'All' : ch.channel)
                    }
                    className={`w-full py-3 px-1.5 grid grid-cols-12 items-center gap-1 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Channel Name & Orders */}
                    <div className="col-span-3 pr-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {ch.channel}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {ch.orders} orders · {ch.sharePct}%
                      </div>
                    </div>

                    {/* Left Diverging Bar (Dark Navy #0F172A — Units Sold) */}
                    <div className="col-span-3 flex items-center justify-end pr-1.5">
                      <div className="w-full flex justify-end items-center gap-1.5">
                        <span className="text-[10px] font-mono tabular-nums text-slate-500">
                          {ch.units}u
                        </span>
                        <div
                          className="h-2.5 bg-[#0F172A] rounded-l-full transition-all"
                          style={{ width: `${leftWidthPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Right Diverging Bar (Royal Blue #2563EB — Revenue) */}
                    <div className="col-span-3 flex items-center justify-start pl-1.5 border-l border-slate-200">
                      <div
                        className="h-2.5 bg-[#2563EB] rounded-r-full transition-all"
                        style={{ width: `${rightWidthPct}%` }}
                      />
                    </div>

                    {/* Total Revenue & Unpaid status */}
                    <div className="col-span-3 text-right font-mono tabular-nums">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCompactCurrency(ch.revenue)}
                      </div>
                      {ch.unpaidRevenue > 0 ? (
                        <div className="text-[10px] text-amber-700">
                          Due {formatCompactCurrency(ch.unpaidRevenue)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-700">
                          100% Paid
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Click any channel row to filter dashboard</span>
          <span className="font-mono tabular-nums">4 channels active</span>
        </div>
      </div>
    </section>
  );
};
