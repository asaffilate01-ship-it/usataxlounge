import { FileCheck2, Files, ListChecks } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FEATURES = [
  { icon: Files, number: "01", key: "documents" },
  { icon: ListChecks, number: "02", key: "questions" },
  { icon: FileCheck2, number: "03", key: "approvals" },
];

const WorkspaceCapabilitiesSection = () => {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="workspace-capabilities-title" className="bg-background py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green-dark dark:text-accent">{t("capabilities.label")}</p>
          <h2 id="workspace-capabilities-title" className="mt-4 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">{t("capabilities.title")}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{t("capabilities.subtitle")}</p>
        </div>
        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, number, key }) => (
            <article key={key} className="group flex min-h-56 flex-col rounded-2xl border border-border bg-card p-6 shadow-elegant transition-colors hover:border-accent/40">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium tracking-widest text-muted-foreground">{number}</span>
                <Icon aria-hidden="true" className="h-6 w-6 text-brand-green-dark dark:text-accent" />
              </div>
              <h3 className="mt-8 text-lg font-semibold text-foreground">{t(`capabilities.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`capabilities.${key}.desc`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkspaceCapabilitiesSection;
