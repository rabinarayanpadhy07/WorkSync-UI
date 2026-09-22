import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { TrendingUpIcon } from 'lucide-react';

import { shellCardClass } from '../utils/adminDashboardUtils';

const TREND_OPTIONS = [
    { key: 'signups', label: 'Signups', color: '#36C5F0' },
    { key: 'messages', label: 'Messages', color: '#2EB67D' },
    { key: 'workspaces', label: 'Workspaces', color: '#ECB22E' }
];

const formatDayLabel = (isoDate) => {
    const date = new Date(`${isoDate}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

const TrendTooltip = ({ active, payload, color, label: activeLabel }) => {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-[#611f69]/40 bg-[#1a0d1c] px-3 py-2 shadow-xl">
            <p className="text-xs text-[#a49ba8]">{formatDayLabel(activeLabel)}</p>
            <p className="text-sm font-semibold" style={{ color }}>
                {payload[0].value} {TREND_OPTIONS.find((o) => o.color === color)?.label.toLowerCase()}
            </p>
        </div>
    );
};

export const AdminTrendsChart = ({ trends }) => {
    const [activeKey, setActiveKey] = useState('signups');
    const active = TREND_OPTIONS.find((option) => option.key === activeKey) ?? TREND_OPTIONS[0];
    const series = useMemo(() => trends?.[activeKey] || [], [trends, activeKey]);

    const totalInWindow = useMemo(
        () => series.reduce((sum, point) => sum + (point.count || 0), 0),
        [series]
    );
    const hasAnyActivity = totalInWindow > 0;

    return (
        <div className={`${shellCardClass} p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#611f69]/30 bg-[#350d36]/40 text-[#36C5F0]">
                        <TrendingUpIcon className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[#f8f8f8]">Growth &amp; activity</h3>
                        <p className="mt-1 text-sm text-[#a49ba8]">
                            {totalInWindow} {active.label.toLowerCase()} over the last 14 days
                        </p>
                    </div>
                </div>

                <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-[#1a0d1c]/80 p-1">
                    {TREND_OPTIONS.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => setActiveKey(option.key)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                option.key === activeKey
                                    ? 'bg-[#611f69]/40 text-[#f8f8f8]'
                                    : 'text-[#a49ba8] hover:text-[#f8f8f8]'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 h-[180px] w-full">
                {hasAnyActivity ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`admin-trend-${active.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={active.color} stopOpacity={0.35} />
                                    <stop offset="95%" stopColor={active.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={formatDayLabel}
                                tick={{ fill: '#a49ba8', fontSize: 11 }}
                                interval={2}
                            />
                            <Tooltip
                                content={<TrendTooltip color={active.color} />}
                                cursor={{ stroke: `${active.color}40`, strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke={active.color}
                                strokeWidth={2}
                                fill={`url(#admin-trend-${active.key})`}
                                activeDot={{ r: 4, fill: active.color, stroke: '#1a0d1c', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#611f69]/30 text-sm text-[#a49ba8]">
                        No {active.label.toLowerCase()} recorded in the last 14 days.
                    </div>
                )}
            </div>
        </div>
    );
};
