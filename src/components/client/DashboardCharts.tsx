import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { IncomeExpenseItem } from "@/hooks/useIncomeExpenses";

interface DashboardChartsProps {
  incomeExpenses: IncomeExpenseItem[];
  filings: { status: string | null }[];
}

const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--primary))",
  "hsl(var(--warning, 45 93% 47%))",
  "hsl(var(--success, 142 76% 36%))",
];

const DashboardCharts = ({ incomeExpenses, filings }: DashboardChartsProps) => {
  const categoryData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    incomeExpenses.forEach((item) => {
      const cat = item.category || "Other";
      const current = map.get(cat) || { income: 0, expense: 0 };
      if (item.type === "income") current.income += Number(item.amount);
      else current.expense += Number(item.amount);
      map.set(cat, current);
    });
    return Array.from(map.entries())
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
      .slice(0, 8);
  }, [incomeExpenses]);

  const filingStatusData = useMemo(() => {
    const map = new Map<string, number>();
    filings.forEach((f) => {
      const status = f.status || "draft";
      map.set(status, (map.get(status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filings]);

  if (incomeExpenses.length === 0 && filings.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {categoryData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-elegant p-5">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Income vs Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="income" fill="hsl(var(--success, 142 76% 36%))" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {filingStatusData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-elegant p-5">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Filing Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={filingStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name} (${value})`}
              >
                {filingStatusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DashboardCharts;
