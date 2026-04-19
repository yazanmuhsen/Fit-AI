import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGenerateProgram } from "@/hooks/use-program";
import { ProgramDisplay } from "@/components/ProgramDisplay";
import type { StoredProfile, ProgramResponse, Exercise } from "@shared/schema";
import { ArrowLeft, Play, Loader2, Target, Trophy, Brain, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const PROGRAM_STORAGE_KEY = "fitnessProgram";

const educationalVideos = [
  { title:"How to Squat",          description:"Perfect squat mechanics, bracing, and depth from a certified coach.",               videoId:"ultWZbUMPL8", tag:"Technique" },
  { title:"How to Bench Press",    description:"Setup, arch, leg drive, and bar path for a safe and strong bench press.",           videoId:"rT7DgCr-3pg", tag:"Technique" },
  { title:"How to Deadlift",       description:"Hip hinge pattern, lat engagement, and proper pull mechanics.",                     videoId:"op9kVnSso6Q", tag:"Technique" },
  { title:"Strength Training Basics", description:"Everything a beginner needs to understand before starting a strength program.", videoId:"3p8EBPVZ2Iw", tag:"Education" },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [localProgram, setLocalProgram] = useState<ProgramResponse | null>(null);

  const { mutate: generateProgram, isPending, isError } = useGenerateProgram({
    onSuccess: (data: ProgramResponse) => {
      setLocalProgram(data);
      localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(data));
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem("fitnessProfile");
    if (!saved) { setLocation("/questionnaire"); return; }
    try {
      const p: StoredProfile = JSON.parse(saved);
      setProfile(p);

      // Try to restore previously saved program
      const savedProgram = localStorage.getItem(PROGRAM_STORAGE_KEY);
      if (savedProgram) {
        try {
          const prog: ProgramResponse = JSON.parse(savedProgram);
          // Only restore if it's for the same sport
          if (prog.sport === p.sport.id) {
            setLocalProgram(prog);
            return;
          }
        } catch {
          // fall through to generate
        }
      }

      // Generate fresh program
      generateProgram({
        age: p.questionnaire.age,
        weight: p.questionnaire.weight,
        height: p.questionnaire.height,
        experience: p.questionnaire.experience,
        sport: p.sport.id,
        daysPerWeek: p.questionnaire.daysPerWeek,
        goals: p.questionnaire.goals,
        equipment: p.questionnaire.equipment,
        environment: p.questionnaire.environment,
        preference: p.questionnaire.preference,
        calculatedOrm: p.calculatedOrm,
      });
    } catch {
      setLocation("/questionnaire");
    }
  }, []);

  // ── Program mutation helpers ─────────────────────────────────────────────
  const saveProgram = useCallback((prog: ProgramResponse) => {
    setLocalProgram(prog);
    localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(prog));
  }, []);

  const handleDeleteExercise = useCallback((weekIdx: number, dayIdx: number, exIdx: number) => {
    if (!localProgram) return;
    const updated: ProgramResponse = {
      ...localProgram,
      program: localProgram.program.map((week, wi) =>
        wi !== weekIdx ? week : {
          ...week,
          days: week.days.map((day, di) =>
            di !== dayIdx ? day : {
              ...day,
              exercises: day.exercises.filter((_, ei) => ei !== exIdx),
            }
          ),
        }
      ),
    };
    saveProgram(updated);
  }, [localProgram, saveProgram]);

  const handleAddExercise = useCallback((weekIdx: number, dayIdx: number, ex: Exercise) => {
    if (!localProgram) return;
    const exWithFlag = { ...ex, __custom: true } as Exercise & { __custom: boolean };
    const updated: ProgramResponse = {
      ...localProgram,
      program: localProgram.program.map((week, wi) =>
        wi !== weekIdx ? week : {
          ...week,
          days: week.days.map((day, di) =>
            di !== dayIdx ? day : {
              ...day,
              exercises: [...day.exercises, exWithFlag],
            }
          ),
        }
      ),
    };
    saveProgram(updated);
  }, [localProgram, saveProgram]);

  const handleRegenerate = useCallback(() => {
    if (!profile) return;
    localStorage.removeItem(PROGRAM_STORAGE_KEY);
    generateProgram({
      age: profile.questionnaire.age,
      weight: profile.questionnaire.weight,
      height: profile.questionnaire.height,
      experience: profile.questionnaire.experience,
      sport: profile.sport.id,
      daysPerWeek: profile.questionnaire.daysPerWeek,
      goals: profile.questionnaire.goals,
      equipment: profile.questionnaire.equipment,
      environment: profile.questionnaire.environment,
      preference: profile.questionnaire.preference,
      calculatedOrm: profile.calculatedOrm,
    });
  }, [profile, generateProgram]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const { sport, questionnaire, calculatedOrm } = profile;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-sm bg-background/90">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between gap-4">
          <button
            onClick={() => setLocation("/questionnaire")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-all text-sm font-semibold"
            data-testid="button-retake-questionnaire"
          >
            <ArrowLeft className="w-4 h-4" /> Retake Questionnaire
          </button>
          <h1 className="font-bold font-display text-lg hidden sm:block">Training Dashboard</h1>
          <button
            onClick={handleRegenerate}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-all text-sm font-semibold text-muted-foreground disabled:opacity-50"
            title="Reset and regenerate program from scratch"
            data-testid="button-regenerate-program"
          >
            <RotateCcw className="w-4 h-4" /> Reset Program
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-16">

        {/* ── Sport Hero Card ──────────────────────────────────────────────── */}
        <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div className="rounded-3xl overflow-hidden border border-border/50 shadow-lg bg-card">
            <div className="relative bg-black">
              <img
                src={sport.imageUrl}
                alt={sport.name}
                className="w-full object-contain max-h-[420px] mx-auto block"
                data-testid="img-sport-hero"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-8">
                <p className="text-white/70 text-sm font-semibold mb-1">Your Selected Discipline</p>
                <h2 className="text-4xl md:text-5xl font-black text-white font-display drop-shadow">{sport.name}</h2>
              </div>
            </div>

            <div className="p-8 md:p-10 grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold font-display mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" /> Why this sport?
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{sport.description}</p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Benefits</h4>
                    <ul className="space-y-2">
                      {sport.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold mt-0.5">✓</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {sport.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground mt-0.5">→</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="bg-secondary/30 rounded-2xl p-6 border border-border/40 self-start">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Your Profile
                </h4>
                <ul className="space-y-3 text-sm">
                  <ProfileRow label="Age"          value={`${questionnaire.age} years`} />
                  <ProfileRow label="Weight"        value={`${questionnaire.weight} kg`} />
                  <ProfileRow label="Height"        value={`${questionnaire.height} cm`} />
                  <ProfileRow label="Experience"    value={questionnaire.experience.charAt(0).toUpperCase() + questionnaire.experience.slice(1)} />
                  <ProfileRow label="Goals"         value={(questionnaire.goals ?? []).map(g => g.replace(/_/g, ' ')).join(', ')} />
                  <ProfileRow label="Training Days" value={`${questionnaire.daysPerWeek}×/week`} />
                </ul>

                {calculatedOrm && Object.values(calculatedOrm).some(v => v !== undefined) && (
                  <div className="mt-5 pt-5 border-t border-border/50">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> Est. 1RM
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {calculatedOrm.squat    && <ProfileRow label="Squat"    value={`${calculatedOrm.squat} kg`} />}
                      {calculatedOrm.bench    && <ProfileRow label="Bench"    value={`${calculatedOrm.bench} kg`} />}
                      {calculatedOrm.deadlift && <ProfileRow label="Deadlift" value={`${calculatedOrm.deadlift} kg`} />}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Generated Program ────────────────────────────────────────────── */}
        <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-black font-display">Your 12-Week Program</h2>
          </div>

          {isPending && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border/50 bg-card">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="font-bold text-lg">Building your personalised program...</p>
              <p className="text-sm text-muted-foreground mt-1">Applying sports science principles to your profile</p>
            </div>
          )}

          {isError && !localProgram && (
            <div className="text-center py-12 rounded-2xl border border-destructive/30 bg-destructive/5">
              <p className="text-destructive font-bold mb-2">Could not generate program</p>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
                data-testid="button-retry-generate"
              >
                Retry
              </button>
            </div>
          )}

          {localProgram && !isPending && (
            <ProgramDisplay
              programData={localProgram}
              calculatedOrm={calculatedOrm}
              onDeleteExercise={handleDeleteExercise}
              onAddExercise={handleAddExercise}
            />
          )}
        </motion.section>

        {/* ── Educational Videos ───────────────────────────────────────────── */}
        <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div className="mb-6">
            <h2 className="text-3xl font-black font-display mb-2">Learn Proper Technique</h2>
            <p className="text-muted-foreground">Master the fundamentals before you add load. Technique is the foundation of progress.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {educationalVideos.map((video) => (
              <div key={video.videoId} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                {activeVideo === video.videoId ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                      title={video.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveVideo(video.videoId)}
                    className="w-full aspect-video relative bg-secondary/40 group"
                    data-testid={`video-${video.videoId}`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-primary-foreground ml-1" />
                      </div>
                    </div>
                  </button>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{video.tag}</span>
                  </div>
                  <h3 className="font-bold font-display text-lg mb-1">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold capitalize">{value}</span>
    </li>
  );
}
