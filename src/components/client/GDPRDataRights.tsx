import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const GDPRDataRights = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profileRes, clientsRes, filingsRes, incomeRes, docsRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("clients").select("*").eq("user_id", user.id),
        supabase.from("filings").select("*").eq("user_id", user.id),
        supabase.from("income_expenses").select("*").eq("user_id", user.id),
        supabase.from("documents").select("id, title, type, category, status, created_at").eq("user_id", user.id),
        supabase.from("messages").select("content, created_at, sender_id, receiver_id").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        account_email: user.email,
        profile: profileRes.data,
        client_records: clientsRes.data,
        filings: filingsRes.data,
        income_expenses: incomeRes.data,
        documents: docsRes.data,
        messages: messagesRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taxlounge-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete user data from all tables (order matters for foreign keys)
      await Promise.all([
        supabase.from("signatures").delete().eq("user_id", user.id),
        supabase.from("income_expenses").delete().eq("user_id", user.id),
        supabase.from("documents").delete().eq("user_id", user.id),
        supabase.from("messages").delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from("notifications").delete().eq("user_id", user.id),
      ]);
      // Then delete dependent records
      await supabase.from("filings").delete().eq("user_id", user.id);
      await supabase.from("clients").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);

      // Sign out — full account deletion requires admin action for auth.users
      await signOut();
      toast({ title: "Account data deleted. You have been signed out." });
    } catch {
      toast({ title: "Deletion failed", variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-elegant p-6 max-w-lg">
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">Your Data Rights (GDPR)</h3>
      <p className="text-sm text-muted-foreground mb-6">
        You have the right to export or delete your personal data at any time under UK GDPR and CCPA.
      </p>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
          <Download className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Export Your Data</p>
            <p className="text-xs text-muted-foreground mt-1">Download all your personal data as a JSON file including profile, filings, income/expenses, and messages.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export Data
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Delete Account & Data</p>
            <p className="text-xs text-muted-foreground mt-1">Permanently delete all your data. This cannot be undone. Note: tax records may be retained for 7 years per IRS/HMRC requirements.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="mt-3" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete My Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your personal data from TaxNuvia. Tax filing records may be retained for up to 7 years as required by IRS Publication 4557 and HMRC regulations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPRDataRights;
