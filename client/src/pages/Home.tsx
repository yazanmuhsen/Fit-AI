import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Sparkles, Target, Zap, BookOpen, Brain, ChevronDown, ChevronUp, Check } from "lucide-react";

const SPORTS = [
  {
    id: "powerlifting",
    name: "Powerlifting",
    tagline: "Max strength — Squat, Bench, Deadlift",
    imageUrl: "/powerlifting.jpeg",
    description: "A strength sport where you train to maximise your 1-rep max on three competition lifts: Squat, Bench Press, and Deadlift. Programming is periodised using RPE targets and percentage-based loading. Every session has a clear purpose and a measurable number to chase.",
    benefits: ["Exceptional absolute strength", "Structured, measurable progress", "Improved bone density", "Competitive opportunities"],
    requirements: ["Barbell, rack & bench", "3–4 days/week", "Technical coaching recommended"],
    bestFor: "People motivated by measurable strength and a goal-oriented, structured approach.",
  },
  {
    id: "powerbuilding",
    name: "Powerbuilding",
    tagline: "Strength + size hybrid",
    imageUrl: "/powerbuilding.jpeg",
    description: "The best of both worlds — combines low-rep strength work (like powerlifting) with moderate-rep hypertrophy work (like bodybuilding). You build real strength AND visible muscle. Ideal for people who don't want to sacrifice one quality for the other.",
    benefits: ["Balanced strength and size", "Injury resilience", "Functional strength", "Less prone to plateaus"],
    requirements: ["Gym equipment access", "4–5 days/week", "Mixed rep range programming"],
    bestFor: "People who want to look strong and be strong.",
  },
  {
    id: "bodybuilding",
    name: "Bodybuilding",
    tagline: "High volume hypertrophy",
    imageUrl: "/bodybuilding.jpeg",
    description: "Training focused on maximising muscle size, symmetry, and aesthetics. Higher rep ranges (8–15), more exercises per session, and a strong emphasis on mind-muscle connection. Nutrition is just as important as the training itself.",
    benefits: ["Significant muscle growth", "Improved body composition", "Metabolic boost", "Aesthetic physique"],
    requirements: ["Gym access (dumbbells, barbells, machines)", "4–6 days/week", "Disciplined nutrition"],
    bestFor: "People who want to build a muscular, aesthetic physique.",
  },
  {
    id: "calisthenics",
    name: "Calisthenics",
    tagline: "Bodyweight mastery & skill",
    imageUrl: "/calisthenics.jpeg",
    description: "Build relative strength, body control, and functional fitness using only your bodyweight. Progress through fundamental movements toward advanced skills — muscle-ups, handstands, planche. Minimal equipment. Maximum control.",
    benefits: ["Train anywhere", "Excellent body control", "Strong connective tissue", "Impressive skill movements"],
    requirements: ["Pullup bar or rings", "3–4 days/week", "Patience for skill development"],
    bestFor: "People who want to master their own body without equipment.",
  },
  {
    id: "general_health",
    name: "General Health",
    tagline: "Balanced fitness for life",
    imageUrl: "/general-health.png",
    description: "Balanced full-body programming designed to improve overall health, functional strength, cardiovascular fitness, and quality of life. Perfect for beginners, people returning to training, or anyone who values health over specialisation.",
    benefits: ["Improved health markers", "Balanced strength and endurance", "Sustainable long-term", "Reduced injury risk"],
    requirements: ["Minimal equipment", "2–4 days/week", "Consistency over intensity"],
    bestFor: "Anyone who wants to feel better, move well, and stay healthy long-term.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [expandedSport, setExpandedSport] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Evidence-Based AI Strength Coaching</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black font-display tracking-tight leading-[1.05] mb-8">
            From Beginner<br />to <span className="text-primary">Elite.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Answer our questionnaire, discover your sport, and get a fully periodised 12-week training program built on real sports science.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setLocation("/questionnaire")}
              className="group px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              Start Questionnaire
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setLocation("/dashboard")}
              className="px-8 py-4 bg-secondary text-secondary-foreground font-bold text-lg rounded-xl hover:bg-secondary/80 active:scale-95 transition-all"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <h2 className="text-4xl font-bold font-display text-center mb-14">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, step: "01", title: "Answer Questions", desc: "Share your biometrics, goals, equipment, and training history." },
              { icon: Brain, step: "02", title: "Read About Each Sport", desc: "Learn what each discipline involves and choose the one that fits you." },
              { icon: Target, step: "03", title: "Enter Your Maxes", desc: "Optionally input 1RMs so we recommend exact training loads." },
              { icon: Zap, step: "04", title: "Train Smarter", desc: "Follow your 12-week periodised program with RPE targets and technique cues." },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.step} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2">STEP {f.step}</p>
                  <h3 className="text-lg font-bold font-display mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5 Training Disciplines — clickable cards */}
      <div className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-display mb-3">5 Training Disciplines</h2>
          <p className="text-muted-foreground text-lg">Click any card to learn more about what each discipline involves.</p>
        </div>

        <div className="space-y-4">
          {SPORTS.map((sport) => {
            const isOpen = expandedSport === sport.id;

            return (
              <div key={sport.id} className={`rounded-2xl overflow-hidden border-2 transition-all ${isOpen ? "border-primary shadow-lg" : "border-border hover:border-primary/40"}`}>
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpandedSport(isOpen ? null : sport.id)}
                  className="w-full text-left flex items-center gap-0 group"
                >
                  {/* Thumbnail */}
                  <div className="w-28 h-24 md:w-40 md:h-28 shrink-0 overflow-hidden">
                    <img src={sport.imageUrl} alt={sport.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  {/* Text */}
                  <div className="flex-1 px-5 py-4">
                    <h3 className="text-lg font-black font-display">{sport.name}</h3>
                    <p className="text-sm text-muted-foreground">{sport.tagline}</p>
                  </div>
                  {/* Expand icon */}
                  <div className="pr-5 text-muted-foreground">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-border/50 bg-card">
                    {/* Full image — no fixed height so portrait photos aren't cropped */}
                    <div className="w-full">
                      <img src={sport.imageUrl} alt={sport.name} className="w-full object-contain max-h-[480px]" />
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                      <p className="text-muted-foreground leading-relaxed">{sport.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Benefits</p>
                          <ul className="space-y-2">
                            {sport.benefits.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Requirements</p>
                          <ul className="space-y-2">
                            {sport.requirements.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" /> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Best For</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{sport.bestFor}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setLocation("/questionnaire")}
                        className="w-full md:w-auto px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        Start with {sport.name} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/50 py-6 text-center text-sm text-muted-foreground">
        AI Fitness Coaching Demo · Built on Sports Science Principles
      </div>
    </div>
  );
}
