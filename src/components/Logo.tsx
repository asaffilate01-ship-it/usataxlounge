import { Link } from "react-router-dom";
import taxloungeLogo from "@/assets/taxlounge-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const Logo = ({ className = "", size = "md", showTagline = false }: LogoProps) => {
const sizeClasses = {
    sm: "h-10",
    md: "h-12",
    lg: "h-16",
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
