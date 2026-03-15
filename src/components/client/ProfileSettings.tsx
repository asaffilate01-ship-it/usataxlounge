import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Phone, Camera, Loader2 } from "lucide-react";

const ProfileSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, avatar_url: avatarUrl || null })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/avatar_${Date.now()}.${file.name.split(".").pop()}`;
    const { data, error } = await supabase.storage.from("message-attachments").upload(filePath, file);
    if (error) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(data.path);
      setAvatarUrl(urlData.publicUrl);
    }
    setUploading(false);
    e.target.value = "";
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-elegant p-6 max-w-lg">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">Profile Information</h3>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold text-lg">
              {initials}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center cursor-pointer hover:bg-accent/80 transition-colors">
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{fullName || "Your Name"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Full Name</Label>
          <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
        </div>
        <div>
          <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</Label>
          <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;
