import taxloungeLogo from "@/assets/taxlounge-logo.png";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <img
        src={taxloungeLogo}
        alt="TaxLounge"
        className="h-16 w-auto animate-pulse"
      />
      <div className="mt-6 flex space-x-1">
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  );
};

export default LoadingScreen;
