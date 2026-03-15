import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonsProps {
  data: Record<string, any>[];
  filename: string;
  columns: { key: string; label: string }[];
}

const ExportButtons = ({ data, filename, columns }: ExportButtonsProps) => {
  const exportCSV = () => {
    const header = columns.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = row[c.key] ?? "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const tableRows = data.map((row) =>
      `<tr>${columns.map((c) => `<td style="padding:8px;border-bottom:1px solid #eee">${row[c.key] ?? "—"}</td>`).join("")}</tr>`
    ).join("");
    w.document.write(`
      <html><head><title>${filename}</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:900px;margin:0 auto}
      table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px;text-transform:uppercase;color:#666}
      td{font-size:14px}h1{font-size:20px;margin-bottom:4px}.meta{color:#666;font-size:12px;margin-bottom:24px}</style></head>
      <body><h1>${filename}</h1><p class="meta">Generated ${new Date().toLocaleDateString()} • ${data.length} records</p>
      <table><thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
        <Download className="h-3.5 w-3.5" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
        <Download className="h-3.5 w-3.5" /> PDF
      </Button>
    </div>
  );
};

export default ExportButtons;
