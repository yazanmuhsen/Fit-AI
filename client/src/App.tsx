import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Questionnaire from "./pages/Questionnaire";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

function SiteHeader() {
  const [, setLocation] = useLocation();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-5xl">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 group"
          aria-label="Go to home"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-black text-sm font-display">S</span>
          </div>
          <span className="text-xl font-black font-display tracking-tight group-hover:text-primary transition-colors">
            Stronger With AI
          </span>
        </button>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setLocation("/questionnaire")}
            className="px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
          >
            Questionnaire
          </button>
          <button
            onClick={() => setLocation("/dashboard")}
            className="px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
          >
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/questionnaire" component={Questionnaire} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SiteHeader />
        {/* pt-14 to offset fixed header */}
        <div className="pt-14">
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
