import logoDark from "@/assets/taxnuvia-logo.png";
import logoLight from "@/assets/taxnuvia-logo-light.png";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-background px-6">
      {/* soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--accent)/0.16),transparent_60%)]"
      />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <span
            aria-hidden
            className="absolute -inset-6 rounded-full bg-accent/15 blur-2xl animate-pulse"
          />
          <img
            src={logoDark}
            alt="TaxNuvia"
            className="relative h-12 w-auto object-contain block dark:hidden"
          />
          <img
            src={logoLight}
            alt=""
            aria-hidden
            className="relative h-12 w-auto object-contain hidden dark:block"
          />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          File clearly. Move forward.
        </p>

        <div
          role="progressbar"
          aria-label="Loading"
          className="h-[3px] w-36 overflow-hidden rounded-full bg-muted"
        >
          <span className="block h-full w-2/5 rounded-full gradient-accent animate-loader-slide motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
