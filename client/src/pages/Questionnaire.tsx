import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { questionnaireSchema, type QuestionnaireRequest, type StoredProfile, type Sport } from "@shared/schema";
import { suggestSport } from "@/lib/sportSuggester";
import {
  Activity, Dumbbell, Target, Heart, Loader2, ArrowRight,
  ChevronRight, Check, Info, Star
} from "lucide-react";

function calcOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

const ALL_SPORTS: Sport[] = [
  {
    id: "powerlifting",
    name: "Powerlifting",
    description: "A strength sport where you train to maximise your 1-rep max on three competition lifts: Squat, Bench Press, and Deadlift. Programming uses block periodisation — Volume Block → Strength Block → Peaking → Deload. Every session has a clear RPE target and a measurable number to beat.",
    imageUrl: "/powerlifting.jpeg",
    videoUrl: "https://www.youtube.com/embed/ultWZbUMPL8",
    benefits: ["Exceptional absolute strength", "Structured, measurable progress", "Improved bone density", "Competitive opportunities"],
    requirements: ["Barbell, rack & bench", "3–4 days/week", "Technical coaching recommended"],
  },
  {
    id: "powerbuilding",
    name: "Powerbuilding",
    description: "A hybrid approach combining low-rep strength work with moderate-rep hypertrophy work. You develop both muscle size and real strength simultaneously. Periodisation runs: Hypertrophy Phase → Strength-Hypertrophy → Strength Emphasis → Deload.",
    imageUrl: "/powerbuilding.jpeg",
    videoUrl: "https://www.youtube.com/embed/OsQMM7GG_A4",
    benefits: ["Balanced strength and size", "Injury resilience", "Functional strength", "Less prone to plateaus"],
    requirements: ["Gym equipment access", "4–5 days/week", "Mixed rep range programming"],
  },
  {
    id: "bodybuilding",
    name: "Bodybuilding",
    description: "Training focused on maximising muscle size, symmetry, and aesthetics. No competition peaking needed — instead: Foundation → Volume Accumulation → Intensification → Active Recovery Deload. Progressive overload and mind-muscle connection are the keys.",
    imageUrl: "/bodybuilding.jpeg",
    videoUrl: "https://www.youtube.com/embed/R6gZoAzAhCg",
    benefits: ["Significant muscle growth", "Improved body composition", "Metabolic boost", "Aesthetic physique"],
    requirements: ["Gym access (dumbbells, barbells, machines)", "4–6 days/week", "Disciplined nutrition"],
  },
  {
    id: "calisthenics",
    name: "Calisthenics",
    description: "Build relative strength, body control, and functional fitness using bodyweight exercises. Progress is skill-based: Foundation → Volume Practice → Skill Progression → Skill Consolidation. No traditional peaking — you progress through movement mastery.",
    imageUrl: "/calisthenics.jpeg",
    videoUrl: "https://www.youtube.com/embed/sSUJcMI1qLA",
    benefits: ["Train anywhere", "Excellent body control", "Strong connective tissue", "Impressive skill movements"],
    requirements: ["Pullup bar or rings", "3–4 days/week", "Patience for skill development"],
  },
  {
    id: "general_health",
    name: "General Health",
    description: "Balanced full-body programming focused on overall health and quality of life. Follows an Adaptation → Development → Consolidation model — no forced peaking, no competition prep. Perfect for building a solid, sustainable foundation.",
    imageUrl: "/general-health.png",
    videoUrl: "https://www.youtube.com/embed/3p8EBPVZ2Iw",
    benefits: ["Improved health markers", "Balanced strength and endurance", "Sustainable long-term", "Reduced injury risk"],
    requirements: ["Minimal equipment", "2–4 days/week", "Consistency over intensity"],
  },
];

const GOAL_SPORT_HINTS: Record<string, string[]> = {
  strength:       ["powerlifting", "powerbuilding"],
  muscle_size:    ["bodybuilding", "powerbuilding"],
  endurance:      ["calisthenics", "general_health"],
  weight_loss:    ["general_health", "calisthenics"],
  general_health: ["general_health", "calisthenics"],
};

type OrmEntry = { weight: string; reps: string };

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [recommendedSportId, setRecommendedSportId] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [ormEntries, setOrmEntries] = useState<{ squat: OrmEntry; bench: OrmEntry; deadlift: OrmEntry }>({
    squat:    { weight: "", reps: "1" },
    bench:    { weight: "", reps: "1" },
    deadlift: { weight: "", reps: "1" },
  });

  const form = useForm<QuestionnaireRequest>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      age: 0,
      weight: 0,
      height: 0,
      experience: "beginner",
      goals: [],
      daysPerWeek: 3,
      equipment: ["bodyweight"],
      environment: "gym",
      preference: "mixed",
    },
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const isStrengthSport = selectedSportId === "powerlifting" || selectedSportId === "powerbuilding";
  const hasBarbell = form.watch("equipment").includes("barbell");
  const showOrmStep = isStrengthSport && hasBarbell;
  const totalSteps = showOrmStep ? 5 : 4;

  const selectedGoals = form.watch("goals") ?? [];

  const toggleGoal = (g: string) => {
    const cur = form.watch("goals");
    form.setValue(
      "goals",
      cur.includes(g as any) ? cur.filter((x) => x !== g) : [...cur, g as any],
      { shouldValidate: true }
    );
  };

  const toggleEquipment = (item: string) => {
    const cur = form.watch("equipment");
    form.setValue(
      "equipment",
      cur.includes(item as any) ? cur.filter((e) => e !== item) : [...cur, item as any]
    );
  };

  const goToNextStep = async () => {
    // Validate step-specific fields before advancing
    if (step === 1) {
      const valid = await form.trigger(["age", "weight", "height", "experience"]);
      if (!valid) return;
    }
    if (step === 2) {
      const valid = await form.trigger(["goals", "daysPerWeek"]);
      if (!valid) return;
    }
    if (step === 3) {
      setIsSuggesting(true);
      try {
        const data = form.getValues();
        const result = await suggestSport(data);
        setRecommendedSportId(result.sport.id);
        if (!selectedSportId) setSelectedSportId(result.sport.id);
      } catch (_) { /* ignore */ } finally {
        setIsSuggesting(false);
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    if (!selectedSportId) return;
    const sport = ALL_SPORTS.find((s) => s.id === selectedSportId)!;
    const questionnaire = form.getValues();
    const orm: StoredProfile["calculatedOrm"] = {};
    if (ormEntries.squat.weight)    orm.squat    = calcOneRepMax(Number(ormEntries.squat.weight),    Number(ormEntries.squat.reps));
    if (ormEntries.bench.weight)    orm.bench    = calcOneRepMax(Number(ormEntries.bench.weight),    Number(ormEntries.bench.reps));
    if (ormEntries.deadlift.weight) orm.deadlift = calcOneRepMax(Number(ormEntries.deadlift.weight), Number(ormEntries.deadlift.reps));
    const profile: StoredProfile = { questionnaire, sport, calculatedOrm: Object.keys(orm).length ? orm : undefined };
    localStorage.setItem("fitnessProfile", JSON.stringify(profile));
    setLocation("/dashboard");
  };

  // Collect hints from all selected goals
  const hintedSports = Array.from(new Set(selectedGoals.flatMap((g) => GOAL_SPORT_HINTS[g] ?? [])));

  const goals = [
    { id: "strength",       label: "Build Strength",       desc: "Maximise 1RM and raw power output" },
    { id: "muscle_size",    label: "Build Muscle",         desc: "Hypertrophy and aesthetic development" },
    { id: "endurance",      label: "Improve Endurance",    desc: "Cardio capacity and stamina" },
    { id: "weight_loss",    label: "Lose Weight",          desc: "Fat loss while retaining muscle" },
    { id: "general_health", label: "General Health",       desc: "Balanced fitness and longevity" },
  ];

  const experienceLevels = [
    { id: "beginner",     label: "Beginner",     desc: "Less than 1 year of consistent training" },
    { id: "intermediate", label: "Intermediate", desc: "1–3 years of consistent training" },
    { id: "advanced",     label: "Advanced",     desc: "3–5+ years of structured training" },
    { id: "elite",        label: "Elite",        desc: "5+ years with competitive experience" },
  ];
  const equipmentOptions = ["barbell", "dumbbell", "kettlebell", "machines", "bodyweight", "cables"];

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Progress bar */}
      <div className="sticky top-14 z-40 bg-background/90 backdrop-blur border-b border-border/50">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Step {step} of {totalSteps}</span>
            <span className="text-sm font-semibold text-primary">{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-2xl">

        {/* ── STEP 1: Biometrics & Experience ──────────────────────────── */}
        {step === 1 && (
          <div className="space-y-8">
            <StepHeader icon={<Heart className="w-4 h-4" />} title="About You" subtitle="Tell us about yourself so we can personalise your program." />

            <div>
              <p className="text-sm font-bold mb-3">Your Measurements</p>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { name: "age" as const,    label: "Age",    unit: "yrs", placeholder: "e.g. 25",  min: 16, max: 100 },
                  { name: "weight" as const, label: "Weight", unit: "kg",  placeholder: "e.g. 80",  min: 30, max: 300 },
                  { name: "height" as const, label: "Height", unit: "cm",  placeholder: "e.g. 175", min: 100, max: 250 },
                ] as const).map((f) => {
                  const err = form.formState.errors[f.name];
                  return (
                    <div key={f.name}>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">{f.label} ({f.unit})</label>
                      <input
                        type="number"
                        value={form.watch(f.name) || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          form.setValue(f.name, v === "" ? (0 as any) : Number(v), { shouldValidate: true });
                        }}
                        placeholder={f.placeholder}
                        min={f.min}
                        max={f.max}
                        data-testid={`input-${f.name}`}
                        className={`w-full px-3 py-3 rounded-xl border-2 bg-background focus:ring-2 focus:ring-primary/20 transition-all text-lg font-semibold ${err ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"}`}
                      />
                      {err && <p className="text-xs text-red-500 mt-1 font-medium">{err.message as string}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold mb-3">Training Experience</p>
              <div className="space-y-2">
                {experienceLevels.map((lvl) => {
                  const selected = form.watch("experience") === lvl.id;
                  return (
                    <button key={lvl.id} type="button" onClick={() => form.setValue("experience", lvl.id as any)}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div>
                        <span className={`block font-bold ${selected ? "text-primary" : ""}`}>{lvl.label}</span>
                        <span className="text-sm text-muted-foreground">{lvl.desc}</span>
                      </div>
                      {selected && <Check className="w-5 h-5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Goals & Schedule ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-8">
            <StepHeader icon={<Target className="w-4 h-4" />} title="Your Goals" subtitle="Select everything that applies — we'll find what discipline fits your combination best." />

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold">What do you want to achieve? <span className="font-normal text-muted-foreground">(pick all that apply)</span></p>
                {selectedGoals.length > 0 && (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedGoals.length} selected</span>
                )}
              </div>

              <div className="space-y-2">
                {goals.map((g) => {
                  const selected = selectedGoals.includes(g.id as any);
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGoal(g.id)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <span className={`block font-bold ${selected ? "text-primary" : ""}`}>{g.label}</span>
                        <span className="text-sm text-muted-foreground">{g.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedGoals.length > 1 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    You've selected {selectedGoals.length} goals — we'll score all 5 disciplines against your combination and highlight which fits best.
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">Days Available Per Week</p>
                <span className="text-3xl font-black text-primary">{form.watch("daysPerWeek")}</span>
              </div>
              <input type="range" min="1" max="7" step="1"
                value={form.watch("daysPerWeek")}
                onChange={(e) => form.setValue("daysPerWeek", Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-semibold mt-1 px-0.5">
                {[1,2,3,4,5,6,7].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Equipment & Environment ──────────────────────────── */}
        {step === 3 && (
          <div className="space-y-8">
            <StepHeader icon={<Dumbbell className="w-4 h-4" />} title="Equipment & Environment" subtitle="Select everything you have access to — this shapes which exercises we can include." />

            <div>
              <p className="text-sm font-bold mb-3">Available Equipment <span className="font-normal text-muted-foreground">(select all that apply)</span></p>
              <div className="grid grid-cols-2 gap-3">
                {equipmentOptions.map((item) => {
                  const selected = form.watch("equipment").includes(item as any);
                  return (
                    <button key={item} type="button" onClick={() => toggleEquipment(item)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-semibold transition-all ${selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-bold mb-3">Where Do You Train?</p>
                {["home", "gym", "both"].map((env) => {
                  const selected = form.watch("environment") === env;
                  return (
                    <button key={env} type="button" onClick={() => form.setValue("environment", env as any)}
                      className={`w-full mb-2 flex items-center justify-between px-4 py-3.5 rounded-xl border-2 font-semibold transition-all ${selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      <span>{env === "gym" ? "Gym" : env === "home" ? "Home" : "Both"}</span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
              <div>
                <p className="text-sm font-bold mb-3">Training Style Preference</p>
                {[
                  { id: "bodyweight", label: "Bodyweight only" },
                  { id: "weights",    label: "Weights (barbell/dumbbells)" },
                  { id: "mixed",      label: "Mix of both" },
                ].map((pref) => {
                  const selected = form.watch("preference") === pref.id;
                  return (
                    <button key={pref.id} type="button" onClick={() => form.setValue("preference", pref.id as any)}
                      className={`w-full mb-2 flex items-center justify-between px-4 py-3.5 rounded-xl border-2 font-semibold transition-all ${selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      <span>{pref.label}</span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Choose Your Discipline ───────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <StepHeader icon={<Star className="w-4 h-4" />} title="Choose Your Discipline" subtitle="Read about each one, then pick the training style that fits your goals and lifestyle. We've marked our recommendation and any that match your goals." />

            {isSuggesting && (
              <div className="flex items-center gap-3 p-4 bg-secondary/40 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium text-sm">Analysing your goals...</span>
              </div>
            )}

            <div className="space-y-4">
              {ALL_SPORTS.map((sport) => {
                const isSelected    = selectedSportId === sport.id;
                const isRecommended = recommendedSportId === sport.id;
                const isHinted      = !isRecommended && hintedSports.includes(sport.id);

                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => setSelectedSportId(sport.id)}
                    className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all ${isSelected ? "border-primary shadow-lg shadow-primary/10" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="relative bg-black">
                      <img src={sport.imageUrl} alt={sport.name} className="w-full object-contain max-h-[340px] mx-auto block" />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-xl font-black text-white font-display drop-shadow">{sport.name}</h3>
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        {isRecommended && (
                          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                            ★ Recommended for you
                          </span>
                        )}
                        {isHinted && (
                          <span className="px-3 py-1 bg-white/90 text-foreground text-xs font-bold rounded-full">
                            Matches your goals
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 bg-card">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{sport.description}</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Benefits</p>
                          <ul className="space-y-1">
                            {sport.benefits.map((b, i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5">
                                <span className="text-primary font-bold mt-0.5 shrink-0">✓</span> {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Requirements</p>
                          <ul className="space-y-1">
                            {sport.requirements.map((r, i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5">
                                <span className="text-muted-foreground mt-0.5 shrink-0">→</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {isSelected ? <><Check className="w-4 h-4" /> Selected</> : "Select This Discipline"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!selectedSportId && (
              <p className="text-center text-sm text-muted-foreground">Select a discipline above to continue.</p>
            )}
          </div>
        )}

        {/* ── STEP 5: Optional 1RM ─────────────────────────────────────── */}
        {step === 5 && showOrmStep && (
          <div className="space-y-8">
            <StepHeader icon={<Activity className="w-4 h-4" />} title="Strength Baselines" subtitle="Optional — enter your known maxes so we can suggest exact training loads. Leave blank if unsure." />

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                You can enter your true 1RM, or any rep-max weight and we'll calculate it using the Epley formula.
              </p>
            </div>

            {(["squat", "bench", "deadlift"] as const).map((lift) => (
              <div key={lift}>
                <p className="text-sm font-bold mb-3 capitalize">{lift}{lift === "bench" ? " Press" : ""}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Weight lifted (kg)</label>
                    <input type="number" placeholder="e.g. 100"
                      value={ormEntries[lift].weight}
                      onChange={(e) => setOrmEntries((p) => ({ ...p, [lift]: { ...p[lift], weight: e.target.value } }))}
                      className="w-full px-3 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Reps completed</label>
                    <select value={ormEntries[lift].reps}
                      onChange={(e) => setOrmEntries((p) => ({ ...p, [lift]: { ...p[lift], reps: e.target.value } }))}
                      className="w-full px-3 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="1">1 rep (true 1RM)</option>
                      <option value="3">3 reps (3RM)</option>
                      <option value="5">5 reps (5RM)</option>
                      <option value="8">8 reps</option>
                      <option value="10">10 reps</option>
                    </select>
                  </div>
                </div>
                {ormEntries[lift].weight && (
                  <p className="text-sm font-bold text-primary mt-2">
                    Estimated 1RM: {calcOneRepMax(Number(ormEntries[lift].weight), Number(ormEntries[lift].reps))} kg
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="mt-10 flex gap-4">
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="flex-1 px-6 py-4 border-2 border-border rounded-xl font-bold hover:border-primary transition-all"
            >
              Back
            </button>
          )}

          {step < totalSteps && (
            <button type="button" onClick={goToNextStep}
              disabled={isSuggesting || (step === 2 && selectedGoals.length === 0) || (step === 4 && !selectedSportId)}
              className="flex-1 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSuggesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</> : <>Continue <ChevronRight className="w-5 h-5" /></>}
            </button>
          )}

          {step === totalSteps && (
            <button type="button" onClick={handleSubmit} disabled={!selectedSportId}
              className="flex-1 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              Go to My Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>
        <h2 className="text-2xl font-black font-display">{title}</h2>
      </div>
      <p className="text-muted-foreground text-sm ml-11">{subtitle}</p>
    </div>
  );
}
