import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTaxWorkspace } from "@/hooks/useTaxWorkspace";
import { filingTaxYear } from "@/integrations/supabase/taxcenda";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INCOME_SOURCES = ["W-2 Employment", "1099 Freelance/Contract", "Business Income", "Rental Income", "Investment Income", "Social Security", "Retirement/Pension", "Other"];
const DEDUCTIONS = ["Mortgage Interest", "Home Office", "Student Loan Interest", "Medical Expenses", "Charitable Donations", "State/Local Taxes", "Child Care", "Education Expenses", "Vehicle/Mileage", "Other"];

interface OnboardingQuestionnaireProps {
  onComplete: () => void;
}

const OnboardingQuestionnaire = ({ onComplete }: OnboardingQuestionnaireProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { initializeWorkspace } = useTaxWorkspace();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [filingStatus, setFilingStatus] = useState("");
  const [dependents, setDependents] = useState("0");
  const [selectedIncome, setSelectedIncome] = useState<string[]>([]);
  const [selectedDeductions, setSelectedDeductions] = useState<string[]>([]);
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");
  const [legalName, setLegalName] = useState("");
  const [entityType, setEntityType] = useState("individual");
  const [accountingMethod, setAccountingMethod] = useState("cash");
  const [taxHomeState, setTaxHomeState] = useState("");
  const [taxYear, setTaxYear] = useState(String(filingTaxYear()));

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    // Update client record
    const { error: clientError } = await supabase
      .from("clients")
      .upsert({
        user_id: user.id,
        filing_status: filingStatus,
        dependents: parseInt(dependents) || 0,
        income_sources: selectedIncome,
        deductions: selectedDeductions,
        occupation,
        phone,
        status: "active",
      }, { onConflict: "user_id" });

    // Mark onboarding complete
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true, phone })
      .eq("user_id", user.id);

    if (clientError || profileError) {
      toast({ title: "Error", description: (clientError || profileError)?.message, variant: "destructive" });
    } else {
      const workspaceReady = await initializeWorkspace({
        legalName,
        entityType,
        accountingMethod,
        taxHomeState,
        taxYear: Number(taxYear),
      });
      if (!workspaceReady) {
        setSaving(false);
        return;
      }
      toast({ title: "Welcome!", description: "Your profile is set up. Let's get started!" });
      onComplete();
    }
    setSaving(false);
  };

  const steps = [
    // Step 0: Filing Status
    <div key="filing" className="space-y-4">
      <h3 className="font-display text-xl font-bold text-foreground">Filing Status</h3>
      <p className="text-sm text-muted-foreground">How will you be filing this year?</p>
      <Select value={filingStatus} onValueChange={setFilingStatus}>
        <SelectTrigger><SelectValue placeholder="Select filing status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single</SelectItem>
          <SelectItem value="married_joint">Married Filing Jointly</SelectItem>
          <SelectItem value="married_separate">Married Filing Separately</SelectItem>
          <SelectItem value="head_household">Head of Household</SelectItem>
          <SelectItem value="qualifying_widow">Qualifying Surviving Spouse</SelectItem>
        </SelectContent>
      </Select>
      <div>
        <Label>Number of Dependents</Label>
        <Input className="mt-1.5" type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value)} />
      </div>
      <div>
        <Label>Occupation</Label>
        <Input className="mt-1.5" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Software Engineer" />
      </div>
      <div>
        <Label>Taxpayer or business name</Label>
        <Input className="mt-1.5" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Your legal name or registered business name" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Entity type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="sole_proprietor">Sole proprietor</SelectItem>
              <SelectItem value="single_member_llc">Single-member LLC</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="s_corporation">S corporation</SelectItem>
              <SelectItem value="c_corporation">C corporation</SelectItem>
              <SelectItem value="trust">Trust or estate</SelectItem>
              <SelectItem value="exempt_organization">Exempt organization</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tax year</Label>
          <Input className="mt-1.5" type="number" min="2000" max="2100" value={taxYear} onChange={(e) => setTaxYear(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Accounting method</Label>
          <Select value={accountingMethod} onValueChange={setAccountingMethod}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="accrual">Accrual</SelectItem>
              <SelectItem value="hybrid">Hybrid / unsure</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tax home state</Label>
          <Input className="mt-1.5 uppercase" maxLength={2} value={taxHomeState} onChange={(e) => setTaxHomeState(e.target.value.toUpperCase())} placeholder="e.g. FL" />
        </div>
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
      </div>
    </div>,

    // Step 1: Income Sources
    <div key="income" className="space-y-4">
      <h3 className="font-display text-xl font-bold text-foreground">Income Sources</h3>
      <p className="text-sm text-muted-foreground">Select all that apply for this tax year.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INCOME_SOURCES.map((src) => (
          <label key={src} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedIncome.includes(src) ? "border-accent bg-accent/5" : "border-border hover:bg-muted/30"}`}>
            <Checkbox checked={selectedIncome.includes(src)} onCheckedChange={() => toggleItem(src, selectedIncome, setSelectedIncome)} />
            <span className="text-sm text-foreground">{src}</span>
          </label>
        ))}
      </div>
    </div>,

    // Step 2: Deductions
    <div key="deductions" className="space-y-4">
      <h3 className="font-display text-xl font-bold text-foreground">Potential Deductions</h3>
      <p className="text-sm text-muted-foreground">Select any deductions you may qualify for.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DEDUCTIONS.map((ded) => (
          <label key={ded} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDeductions.includes(ded) ? "border-accent bg-accent/5" : "border-border hover:bg-muted/30"}`}>
            <Checkbox checked={selectedDeductions.includes(ded)} onCheckedChange={() => toggleItem(ded, selectedDeductions, setSelectedDeductions)} />
            <span className="text-sm text-foreground">{ded}</span>
          </label>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Logo size="md" />
          <p className="text-sm text-muted-foreground mt-2">Let's set up your tax profile</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-border"}`} />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-elegant p-6">
          {steps[step]}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            ) : <div />}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="bg-accent text-accent-foreground hover:bg-brand-green-dark gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving} className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingQuestionnaire;
