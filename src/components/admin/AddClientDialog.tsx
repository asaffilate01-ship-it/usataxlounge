import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddClientDialogProps {
  onClientAdded: () => void;
}

const AddClientDialog = ({ onClientAdded }: AddClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    occupation: "",
    filing_status: "",
    ssn_last4: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: "Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Create client record (admin creates on behalf)
      const { error } = await supabase.from("clients").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        occupation: form.occupation.trim() || null,
        filing_status: form.filing_status || null,
        ssn_last4: form.ssn_last4.trim() || null,
        notes: form.notes.trim() || null,
        user_id: (await supabase.auth.getUser()).data.user?.id || "",
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Client Added", description: `${form.full_name} has been added successfully.` });
      setForm({ full_name: "", email: "", phone: "", address: "", occupation: "", filing_status: "", ssn_last4: "", notes: "" });
      setOpen(false);
      onClientAdded();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
          <Plus className="h-4 w-4 mr-2" /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input className="mt-1.5" placeholder="John Doe" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input className="mt-1.5" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input className="mt-1.5" placeholder="(555) 123-4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>SSN (Last 4)</Label>
              <Input className="mt-1.5" placeholder="1234" maxLength={4} value={form.ssn_last4} onChange={(e) => setForm({ ...form, ssn_last4: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input className="mt-1.5" placeholder="123 Main St, City, State ZIP" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Occupation</Label>
              <Input className="mt-1.5" placeholder="Software Engineer" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
            </div>
            <div>
              <Label>Filing Status</Label>
              <Select value={form.filing_status} onValueChange={(v) => setForm({ ...form, filing_status: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married_joint">Married Filing Jointly</SelectItem>
                  <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                  <SelectItem value="head_of_household">Head of Household</SelectItem>
                  <SelectItem value="qualifying_widow">Qualifying Widow(er)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1.5" placeholder="Additional notes about this client..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
            {loading ? "Adding..." : "Add Client"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
