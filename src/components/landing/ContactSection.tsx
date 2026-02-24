import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const ContactSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast({ title: t("contact.errorTitle"), description: t("contact.errorDesc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("contact.successTitle"), description: t("contact.successDesc") });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }
  };

  const contactInfo = [
    { icon: Phone, label: "(305) 555-0190", href: "tel:+13055550190" },
    { icon: MapPin, label: t("contact.address") },
    { icon: Clock, label: t("contact.hours") },
  ];

  return (
    <section id="contact" className="py-6 md:py-10 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("contact.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("contact.title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="space-y-6">
              {contactInfo.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                        {item.label}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="lg:col-span-3 rounded-2xl border border-border bg-card shadow-elegant p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.name")}</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("contact.namePh")} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.email")}</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("contact.emailPh")} required />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.phone")}</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("contact.phonePh")} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.subject")}</label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={t("contact.subjectPh")} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.message")}</label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t("contact.messagePh")} rows={5} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent text-base py-6">
              {loading ? t("contact.sending") : t("contact.send")}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
