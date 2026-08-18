import { Link } from "react-router-dom";
import logoDark from "@/assets/taxnuvia-logo.png.asset.json";
import logoLight from "@/assets/taxnuvia-logo-light.png.asset.json";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Force the light (white-text) variant, e.g. on dark hero panels */
  variant?: "auto" | "light";
  to?: string;
}

const sizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
  xl: "h-16",
  "2xl": "h-16 md:h-24",
};

const Logo = ({ className = "", size = "md", variant = "auto", to = "/" }: LogoProps) => {
  const cls = `${sizeClasses[size]} w-auto object-contain`;

  return (
    <Link to={to} className={`flex items-center ${className}`} aria-label="TaxNuvia home">
      {variant === "light" ? (
        <img src={logoLight.url} alt="TaxNuvia — File clearly. Move forward." className={cls} />
      ) : (
        <>
          <img
            src={logoDark.url}
            alt="TaxNuvia — File clearly. Move forward."
            className={`${cls} block dark:hidden`}
          />
          <img src={logoLight.url} alt="" aria-hidden className={`${cls} hidden dark:block`} />
        </>
      )}
    </Link>
  );
};

export default Logo;
