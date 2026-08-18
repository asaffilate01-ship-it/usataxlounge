import { Link } from "react-router-dom";
import taxloungeLogo from "@/assets/taxlounge-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

const Logo = ({ className = "", size = "md", showTagline = false }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16",
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={taxloungeLogo}
        alt="TaxNuvia - File clearly. Move forward."
        className={`${sizeClasses[size]} w-auto`}
      />
    </Link>
  );
};

export default Logo;
