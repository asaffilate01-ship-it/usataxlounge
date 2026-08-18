import { useEffect, useState } from "react";
import { Home, LayoutGrid, Smartphone, HelpCircle, KeyRound } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const sections = [
  { id: "overview", key: "promo.nav.overview", icon: Home },
  { id: "features", key: "promo.nav.features", icon: LayoutGrid },
  { id: "app", key: "promo.nav.app", icon: Smartphone },
  { id: "faq", key: "promo.nav.faq", icon: HelpCircle },
  { id: "access", key: "promo.nav.access", icon: KeyRound },
];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const PromoNav = () => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Desktop / tablet header */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur border-b border-border shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 md:h-28">
            <Logo size="2xl" variant={scrolled ? "auto" : "light"} to="/" />
            <nav aria-label="Preview sections" className="hidden lg:flex items-center gap-1">
              {[...sections.slice(0, 2), { id: "screens", key: "promo.nav.screens", icon: LayoutGrid }, ...sections.slice(2)].map(
                ({ id, key }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scrolled
                        ? active === id
                          ? "text-accent bg-accent/10"
                          : "text-foreground/80 hover:text-accent hover:bg-muted"
                        : active === id
                          ? "text-white bg-white/15"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {t(key)}
                  </button>
                ),
              )}
            </nav>
            <div className="flex items-center gap-2 md:gap-3">
              <LanguageToggle scrolled={scrolled} />
              <Button
                size="sm"
                onClick={() => scrollTo("access")}
                className="hidden sm:inline-flex bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {t("promo.hero.cta")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Native-style bottom tab bar (mobile) */}
      <nav
        aria-label="Preview sections"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5">
          {sections.map(({ id, key, icon: Icon }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  onClick={() => scrollTo(id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`w-full flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                    isActive ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                      isActive ? "bg-accent/12" : ""
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="leading-none">{t(key)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default PromoNav;
