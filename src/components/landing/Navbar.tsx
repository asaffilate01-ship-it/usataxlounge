import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />

          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Services</a>
            <a href="#why-us" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Why Us</a>
            <a href="#process" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Process</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button className="text-foreground" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              <a href="#services" className="text-sm font-medium text-muted-foreground py-2">Services</a>
              <a href="#why-us" className="text-sm font-medium text-muted-foreground py-2">Why Us</a>
              <a href="#process" className="text-sm font-medium text-muted-foreground py-2">Process</a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground py-2">Contact</a>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" asChild className="flex-1">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-brand-green-dark">
                  <Link to="/auth?tab=signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
