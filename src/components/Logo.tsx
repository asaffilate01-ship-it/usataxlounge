import { Link } from "react-router-dom";
import taxloungeLogo from "@/assets/taxlounge-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

const Logo = ({ className = "", size = "md", showTagline = false }: LogoProps) => {
  const sizeClasses = {
    sm: "h-14",
    md: "h-20",
    lg: "h-28",
    xl: "h-36",
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={taxloungeLogo}
        alt="TaxLounge - Making Tax Less Taxing"
        className={`${sizeClasses[size]} w-auto`}
      />
    </Link>
  );
};

export default Logo;
