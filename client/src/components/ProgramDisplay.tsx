import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Dumbbell, Activity, ChevronRight, Info, Target,
  Trash2, Plus, X, Check
} from "lucide-react";
import type { ProgramResponse, Exercise } from "@shared/schema";

interface ProgramDisplayProps {
  programData: ProgramResponse;
  calculatedOrm?: { squat?: number; bench?: number; deadlift?: number };
  onDeleteExercise?: (weekIndex: number, dayIndex: number, exIndex: number) => void;
  onAddExercise?: (weekIndex: number, dayIndex: number, ex: Exercise) => void;
}

const PHASE_COLORS: Record<string, string> = {
  'Volume Accumulation':    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Strength Development':   'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'High Intensity / Peaking': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  'Deload':                 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
};

function rpeToPercent(rpe?: number): number | null {
  if (!rpe) return null;
  const map: Record<number, number> = { 6:78, 7:83, 7.5:85, 8:87, 8.5:89, 9:92, 9.5:95, 10:100 };
  return map[rpe] ?? null;
}

function getOrmSuggestion(name: string, rpe?: number, orm?: { squat?: number; bench?: number; deadlift?: number }): string | null {
  if (!rpe || !orm) return null;
  const pct = rpeToPercent(rpe);
  if (!pct) return null;
  const lower = name.toLowerCase();
  let max: number | undefined;
  if (lower.includes('squat') && !lower.includes('pause') && !lower.includes('hack') && !lower.includes('goblet') && !lower.includes('split')) max = orm.squat;
  else if (lower.includes('bench') && lower.includes('barbell')) max = orm.bench;
  else if (lower.includes('deadlift') && !lower.includes('pause') && !lower.includes('deficit') && !lower.includes('romanian')) max = orm.deadlift;
  if (!max) return null;
  const suggested = Math.round((pct / 100) * max / 2.5) * 2.5;
  return `~${suggested} kg (${pct}% of your ${max} kg 1RM)`;
}

// ─── Add Exercise Form ────────────────────────────────────────────────────────
interface AddFormState { name: string; sets: string; reps: string; rpe: string; muscles: string; technique: string }
const BLANK_FORM: AddFormState = { name:'', sets:'3', reps:'8–12', rpe:'', muscles:'', technique:'' };

function AddExerciseForm({ onAdd, onCancel }: { onAdd: (ex: Exercise) => void; onCancel: () => void }) {
  const [form, setForm] = useState<AddFormState>(BLANK_FORM);
  const [error, setError] = useState('');

  function set(field: keyof AddFormState, val: string) {
    setForm(f => ({ ...f, [field]: val }));
    setError('');
  }

  function submit() {
    if (!form.name.trim()) { setError('Exercise name is required'); return; }
    const sets = parseInt(form.sets);
    if (isNaN(sets) || sets < 1) { setError('Sets must be a positive number'); return; }
    if (!form.reps.trim()) { setError('Reps are required (e.g. 8–12 or 10)'); return; }

    const rpe = form.rpe ? parseFloat(form.rpe) : undefined;
    const muscles = form.muscles.trim()
      ? form.muscles.split(',').map(m => m.trim()).filter(Boolean)
      : ['Custom'];

    onAdd({
      name: form.name.trim(),
      sets,
      reps: form.reps.trim(),
      rpe: (rpe && !isNaN(rpe)) ? rpe : undefined,
      technique: form.technique.trim() || 'Perform with full range of motion and controlled tempo.',
      keyCues: ['Full range of motion', 'Controlled movement', 'Squeeze at peak'],
      muscles,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Add Custom Exercise</p>

      {/* Name */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Exercise Name *</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Barbell Bench Press"
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50"
          data-testid="input-add-exercise-name"
        />
      </div>

      {/* Sets / Reps / RPE in a row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sets *</label>
          <input
            type="number"
            min={1}
            max={10}
            value={form.sets}
            onChange={e => set('sets', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50"
            data-testid="input-add-exercise-sets"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reps *</label>
          <input
            value={form.reps}
            onChange={e => set('reps', e.target.value)}
            placeholder="8–12"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50"
            data-testid="input-add-exercise-reps"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">RPE (optional)</label>
          <input
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={form.rpe}
            onChange={e => set('rpe', e.target.value)}
            placeholder="e.g. 8"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50"
            data-testid="input-add-exercise-rpe"
          />
        </div>
      </div>

      {/* Muscles */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Muscles worked (optional, comma-separated)</label>
        <input
          value={form.muscles}
          onChange={e => set('muscles', e.target.value)}
          placeholder="e.g. Chest, Triceps"
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50"
          data-testid="input-add-exercise-muscles"
        />
      </div>

      {/* Technique notes */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Technique notes (optional)</label>
        <textarea
          value={form.technique}
          onChange={e => set('technique', e.target.value)}
          placeholder="Brief coaching note or cue..."
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50 resize-none"
          data-testid="input-add-exercise-technique"
        />
      </div>

      {error && <p className="text-xs text-destructive font-semibold">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={submit}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
          data-testid="button-add-exercise-submit"
        >
          <Check className="w-3.5 h-3.5" /> Add Exercise
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg hover:bg-secondary transition-colors"
          data-testid="button-add-exercise-cancel"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
interface ExCardProps {
  ex: Exercise;
  orm?: { squat?: number; bench?: number; deadlift?: number };
  onDelete?: () => void;
  isCustom?: boolean;
}

function ExerciseCard({ ex, orm, onDelete, isCustom }: ExCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ormSuggestion = getOrmSuggestion(ex.name, ex.rpe, orm);

  function handleDelete() {
    if (confirmDelete) { onDelete?.(); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
  }

  return (
    <div className={`bg-background rounded-xl border overflow-hidden transition-colors ${
      isCustom ? 'border-primary/30 hover:border-primary/50' : 'border-border/40 hover:border-primary/30'
    }`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h5 className="font-bold text-foreground leading-tight">{ex.name}</h5>
              {isCustom && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">Custom</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex flex-wrap gap-1">
              {ex.muscles.map((m, i) => (
                <span key={i} className="bg-secondary px-1.5 py-0.5 rounded">{m}</span>
              ))}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-primary/5 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{ex.sets}×{ex.reps}</span>
            </div>
            {ex.rpe && (
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold">RPE {ex.rpe}</span>
              </div>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete exercise'}
                className={`p-1.5 rounded-lg transition-all ${
                  confirmDelete
                    ? 'bg-destructive text-destructive-foreground'
                    : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                }`}
                data-testid="button-delete-exercise"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 1RM suggestion */}
        {ormSuggestion && (
          <p className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg mt-2">
            Target load: {ormSuggestion}
          </p>
        )}

        {/* Technique toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          {expanded ? 'Hide' : 'Show'} technique
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Technique panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3 bg-secondary/20">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Technique</p>
                <p className="text-sm leading-relaxed">{ex.technique}</p>
              </div>
              {ex.keyCues.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Key Cues</p>
                  <ul className="space-y-1">
                    {ex.keyCues.map((cue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-bold mt-0.5 shrink-0">›</span>
                        <span className="font-medium">"{cue}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ex.notes && (
                <p className="text-xs text-muted-foreground italic bg-background rounded-lg px-3 py-2 border border-border/40">
                  Note: {ex.notes}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ProgramDisplay ──────────────────────────────────────────────────────
export function ProgramDisplay({ programData, calculatedOrm, onDeleteExercise, onAddExercise }: ProgramDisplayProps) {
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [addingAt, setAddingAt] = useState<{ weekIdx: number; dayIdx: number } | null>(null);

  if (!programData?.program || programData.program.length === 0) return null;

  const isEditable = !!(onDeleteExercise && onAddExercise);

  function handleAdd(weekIdx: number, dayIdx: number, ex: Exercise) {
    onAddExercise?.(weekIdx, dayIdx, ex);
    setAddingAt(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Periodisation overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { weeks:'Weeks 1–4',  label:'Volume Accumulation',    desc:'Build work capacity' },
          { weeks:'Weeks 5–8',  label:'Strength Development',   desc:'Increase intensity' },
          { weeks:'Weeks 9–11', label:'High Intensity / Peaking', desc:'Near-maximal effort' },
          { weeks:'Week 12',    label:'Deload',                 desc:'Recovery & supercompensation' },
        ].map((p, i) => (
          <div key={i} className={`rounded-xl border px-4 py-3 ${PHASE_COLORS[p.label] ?? 'bg-card border-border/50'}`}>
            <p className="text-xs font-bold opacity-70 mb-0.5">{p.weeks}</p>
            <p className="font-bold text-sm leading-tight">{p.label}</p>
            <p className="text-xs opacity-70 mt-0.5">{p.desc}</p>
          </div>
        ))}
      </div>

      {isEditable && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <Plus className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Program is editable.</span>{' '}
            Use the <Trash2 className="w-3 h-3 inline-block text-destructive mx-0.5" /> button on any exercise to remove it, or "+ Add Exercise" to insert a custom one. Changes are saved automatically.
          </p>
        </div>
      )}

      {/* Weekly accordion */}
      <div className="space-y-3">
        {programData.program.map((weekData, weekIdx) => {
          const isExpanded = expandedWeek === weekData.week;
          const phaseColor = PHASE_COLORS[weekData.phaseLabel] ?? '';

          return (
            <div
              key={`week-${weekData.week}`}
              className={`rounded-2xl border transition-all duration-200 bg-card ${
                isExpanded ? 'border-primary/25 shadow-lg' : 'border-border/50 hover:border-border'
              }`}
            >
              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? 0 : weekData.week)}
                className="w-full px-6 py-4 flex items-center justify-between focus:outline-none"
                data-testid={`button-week-${weekData.week}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl font-display font-black text-lg flex items-center justify-center transition-colors ${
                    isExpanded ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {weekData.week}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold font-display">Week {weekData.week}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${phaseColor}`}>
                        {weekData.phaseLabel}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {weekData.days.length} training {weekData.days.length === 1 ? 'session' : 'sessions'}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Week content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-6 pb-6 pt-2 space-y-8">
                      {weekData.days.map((dayData, dayIdx) => {
                        const isAddingHere = addingAt?.weekIdx === weekIdx && addingAt?.dayIdx === dayIdx;

                        return (
                          <div key={`w${weekData.week}-d${dayData.day}`}>
                            {/* Day header */}
                            <div className="flex items-center justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Activity className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Day {dayData.day}</p>
                                  <h4 className="font-bold font-display text-base leading-tight">{dayData.focus}</h4>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {dayData.exercises.length} exercise{dayData.exercises.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* RPE legend */}
                            {dayData.exercises.some(e => e.rpe) && (
                              <div className="flex items-center gap-2 mb-3 p-3 bg-secondary/40 rounded-lg">
                                <Target className="w-4 h-4 text-muted-foreground shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                  <strong>RPE guide:</strong> 7 = 2–3 reps left · 8 = 1–2 reps left · 9 = 1 rep left · 10 = absolute max
                                </p>
                              </div>
                            )}

                            {/* Exercise list */}
                            <div className="space-y-2">
                              {dayData.exercises.map((ex, exIdx) => (
                                <ExerciseCard
                                  key={`${ex.name}-${exIdx}`}
                                  ex={ex}
                                  orm={calculatedOrm}
                                  isCustom={(ex as any).__custom === true}
                                  onDelete={isEditable ? () => onDeleteExercise!(weekIdx, dayIdx, exIdx) : undefined}
                                />
                              ))}
                            </div>

                            {/* Add exercise form or button */}
                            <AnimatePresence>
                              {isAddingHere ? (
                                <AddExerciseForm
                                  key="form"
                                  onAdd={ex => handleAdd(weekIdx, dayIdx, ex)}
                                  onCancel={() => setAddingAt(null)}
                                />
                              ) : isEditable ? (
                                <motion.button
                                  key="btn"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  onClick={() => setAddingAt({ weekIdx, dayIdx })}
                                  className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-all"
                                  data-testid={`button-add-exercise-w${weekIdx}-d${dayIdx}`}
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Exercise
                                </motion.button>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
