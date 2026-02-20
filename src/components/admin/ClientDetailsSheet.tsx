import { X, Mail, Phone, MapPin, Briefcase, FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ClientDetailsSheetProps {
  client: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const filingStatusLabel: Record<string, string> = {
  single: "Single",
  married_joint: "Married Filing Jointly",
  married_separate: "Married Filing Separately",
  head_of_household: "Head of Household",
  qualifying_widow: "Qualifying Widow(er)",
};

const statusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-success/10 text-success border-success/20";
    case "pending": return "bg-warning/10 text-warning border-warning/20";
    case "completed": return "bg-accent/10 text-accent border-accent/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const ClientDetailsSheet = ({ client, open, onOpenChange }: ClientDetailsSheetProps) => {
  if (!client) return null;

  const initials = client.full_name
    ? client.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Client Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-lg font-bold text-accent">
              {initials}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-semibold text-foreground">{client.full_name || "—"}</h3>
              <Badge className={statusColor(client.status)}>{client.status || "pending"}</Badge>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contact Information</h4>
            {client.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-accent shrink-0" />
                <a href={`mailto:${client.email}`} className="text-foreground hover:text-accent transition-colors">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <a href={`tel:${client.phone}`} className="text-foreground hover:text-accent transition-colors">{client.phone}</a>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent shrink-0" />
                <span className="text-foreground">{client.address}</span>
              </div>
            )}
            {client.occupation && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-accent shrink-0" />
                <span className="text-foreground">{client.occupation}</span>
              </div>
            )}
          </div>

          {/* Tax Info */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tax Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Filing Status</p>
                <p className="text-sm font-medium text-foreground">{filingStatusLabel[client.filing_status] || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tax Year</p>
                <p className="text-sm font-medium text-foreground">{client.tax_year || new Date().getFullYear()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SSN (Last 4)</p>
                <p className="text-sm font-medium text-foreground font-mono">{client.ssn_last4 ? `•••-••-${client.ssn_last4}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium text-foreground">{new Date(client.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientDetailsSheet;
