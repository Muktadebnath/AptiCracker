import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/** Donut chart with a label in the middle. `data` = [{ name, value, tone }] */
export function Donut({ data, center, sub, size = 190, thickness = 22 }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const slices = total > 0 ? data.filter((d) => d.value > 0) : [{ name: 'Empty', value: 1, tone: 'skip' }];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} role="img" aria-label={`${center} ${sub || ''}. ${data.map((d) => `${d.name}: ${d.value}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: size, height: size }}>
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="name" innerRadius={size / 2 - thickness} outerRadius={size / 2 - 2} startAngle={90} endAngle={-270} paddingAngle={slices.length > 1 ? 2 : 0} cornerRadius={8} stroke="none" isAnimationActive>
            {slices.map((d) => <Cell key={d.name} fill={`var(--${d.tone})`} fillOpacity={total > 0 ? 1 : 0.35} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display text-3xl font-extrabold leading-none">{center}</div>
        {sub && <div className="mt-1 text-xs font-bold text-muted">{sub}</div>}
      </div>
    </div>
  );
}

export const chartColors = {
  grid: 'var(--line)',
  tick: { fill: 'var(--muted)', fontSize: 12 },
  tooltip: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, color: 'var(--ink)', boxShadow: 'var(--shadow)' },
};

const CustomTooltip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-xs shadow-pop" style={{ color: 'var(--ink)' }}>
      <div className="mb-0.5 font-bold">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}:</span> <span className="font-bold">{fmt ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const emptyBox = (h) => (
  <div className="flex items-center justify-center text-xs font-semibold text-muted" style={{ height: h }}>
    Not enough data yet — keep logging your days.
  </div>
);

/** Simple line chart. `data` = [{ x, ...series }], `lines` = [{ key, name, tone }] */
export function TrendLine({ data, lines, height = 220, xKey = 'x', fmt, unit = '' }) {
  if (!data?.length) return emptyBox(height);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={chartColors.tick} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
        <YAxis tick={chartColors.tick} axisLine={false} tickLine={false} unit={unit} />
        <Tooltip content={<CustomTooltip fmt={fmt} />} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={`var(--${l.tone})`} strokeWidth={2.5} dot={{ r: 3, fill: `var(--${l.tone})` }} activeDot={{ r: 5 }} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Simple bar chart. `data` = [{ x, value }] */
export function TrendBar({ data, dataKey = 'value', name, tone = 'accent', height = 200, xKey = 'x', fmt, unit = '' }) {
  if (!data?.length) return emptyBox(height);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={chartColors.tick} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
        <YAxis tick={chartColors.tick} axisLine={false} tickLine={false} unit={unit} />
        <Tooltip content={<CustomTooltip fmt={fmt} />} cursor={{ fill: 'var(--surface2)' }} />
        <Bar dataKey={dataKey} name={name} fill={`var(--${tone})`} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Filled area chart, e.g. cumulative questions solved. `data` = [{ x, value }] */
export function TrendArea({ data, dataKey = 'value', name, tone = 'accent', height = 200, xKey = 'x', fmt }) {
  if (!data?.length) return emptyBox(height);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(--${tone})`} stopOpacity={0.35} />
            <stop offset="100%" stopColor={`var(--${tone})`} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={chartColors.tick} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
        <YAxis tick={chartColors.tick} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip fmt={fmt} />} />
        <Area type="monotone" dataKey={dataKey} name={name} stroke={`var(--${tone})`} strokeWidth={2.5} fill="url(#areaFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
