import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-8xl font-display font-bold text-accent mb-4">404</h1>
        <p className="text-xl text-foreground font-display font-semibold mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Go Back</Link>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
            <Link to="/"><Home className="h-4 w-4 mr-2" /> Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
