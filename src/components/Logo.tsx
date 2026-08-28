import { Link } from "react-router-dom";
import markUrl from "@/assets/taxcenda-mark.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Force the light (white-text) variant, e.g. on dark hero panels */
  variant?: "auto" | "light";
  to?: string;
}

const sizeClasses: Record<NonNullable<LogoProps["size"]>, { mark: string; word: string; tagline: string }> = {
  sm: { mark: "h-8 w-8", word: "text-lg", tagline: "hidden" },
  md: { mark: "h-9 w-9", word: "text-xl", tagline: "text-[8px]" },
  lg: { mark: "h-10 w-10", word: "text-2xl", tagline: "text-[9px]" },
  xl: { mark: "h-12 w-12", word: "text-3xl", tagline: "text-[10px]" },
  "2xl": { mark: "h-14 w-14 md:h-16 md:w-16", word: "text-3xl md:text-4xl", tagline: "text-[10px] md:text-xs" },
};

const Logo = ({ className = "", size = "md", variant = "auto", to = "/" }: LogoProps) => {
  const sizes = sizeClasses[size];
  const light = variant === "light";

  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="TaxCenda home">
      <img
        src={markUrl}
        alt=""
        aria-hidden
        className={`${sizes.mark} shrink-0 rounded-xl bg-white object-contain p-0.5 shadow-accent`}
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`${sizes.word} font-display font-bold tracking-tight ${light ? "text-white" : "text-foreground"}`}>
          Tax<span className="text-accent">C</span>enda
        </span>
        <span className={`${sizes.tagline} mt-1 font-semibold tracking-[0.08em] ${light ? "text-white/60" : "text-muted-foreground"}`}>
          Filed right. Represented with confidence.
        </span>
      </span>
    </Link>
  );
};

export default Logo;
