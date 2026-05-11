import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <p className="text-4xl font-bold font-mono text-primary">404</p>
      <p className="text-sm text-muted-foreground">Page not found.</p>
      <button
        onClick={() => setLocation("/")}
        className="text-sm text-primary hover:underline"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
