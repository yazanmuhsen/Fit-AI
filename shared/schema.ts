import { z } from "zod";

export const experienceEnum = z.enum(["beginner", "intermediate", "advanced", "elite"]);
export type Experience = z.infer<typeof experienceEnum>;

export const goalEnum = z.enum(["strength", "muscle_size", "endurance", "weight_loss", "general_health"]);
export type Goal = z.infer<typeof goalEnum>;

export const sportIdEnum = z.enum(["bodybuilding", "powerlifting", "powerbuilding", "calisthenics", "general_health"]);
export type SportId = z.infer<typeof sportIdEnum>;

export const oneRepMaxSchema = z.object({
  squat: z.number().positive().optional(),
  bench: z.number().positive().optional(),
  deadlift: z.number().positive().optional(),
});

export const ormInputSchema = z.object({
  squat: z.object({ weight: z.number(), reps: z.number() }).optional(),
  bench: z.object({ weight: z.number(), reps: z.number() }).optional(),
  deadlift: z.object({ weight: z.number(), reps: z.number() }).optional(),
});

export type OrmInput = z.infer<typeof ormInputSchema>;

// goals is now an array — user selects all that apply
export const questionnaireSchema = z.object({
  age: z.number().min(16).max(100),
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  experience: experienceEnum,
  goals: z.array(goalEnum).min(1, "Select at least one goal"),
  daysPerWeek: z.number().min(1).max(7),
  equipment: z.array(z.enum(["barbell", "dumbbell", "kettlebell", "machines", "bodyweight", "cables"])),
  environment: z.enum(["home", "gym", "both"]),
  preference: z.enum(["bodyweight", "weights", "mixed"]),
  ormInput: ormInputSchema.optional(),
});

export type QuestionnaireRequest = z.infer<typeof questionnaireSchema>;

export const sportSchema = z.object({
  id: sportIdEnum,
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  videoUrl: z.string(),
  benefits: z.array(z.string()),
  requirements: z.array(z.string()),
});

export type Sport = z.infer<typeof sportSchema>;

export const sportSuggestionSchema = z.object({
  sport: sportSchema,
  matchScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type SportSuggestion = z.infer<typeof sportSuggestionSchema>;

export const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.string(),
  rpe: z.number().optional(),
  percentage: z.number().optional(),
  technique: z.string(),
  keyCues: z.array(z.string()),
  muscles: z.array(z.string()),
  notes: z.string().optional(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const workoutDaySchema = z.object({
  day: z.number(),
  focus: z.string(),
  phase: z.string(),
  exercises: z.array(exerciseSchema),
});

export const workoutWeekSchema = z.object({
  week: z.number(),
  phaseLabel: z.string(),
  days: z.array(workoutDaySchema),
});

export const programResponseSchema = z.object({
  sport: z.string(),
  experience: experienceEnum,
  totalWeeks: z.number(),
  program: z.array(workoutWeekSchema),
});

export type ProgramResponse = z.infer<typeof programResponseSchema>;

export const generateProgramSchema = z.object({
  age: z.number().min(16).max(100),
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  experience: experienceEnum,
  sport: sportIdEnum,
  daysPerWeek: z.number().min(1).max(7),
  goals: z.array(goalEnum).min(1).optional(),
  equipment: z.array(z.enum(["barbell", "dumbbell", "kettlebell", "machines", "bodyweight", "cables"])).optional(),
  environment: z.enum(["home", "gym", "both"]).optional(),
  preference: z.enum(["bodyweight", "weights", "mixed"]).optional(),
  calculatedOrm: oneRepMaxSchema.optional(),
});

export type GenerateProgramRequest = z.infer<typeof generateProgramSchema>;

export interface StoredProfile {
  questionnaire: QuestionnaireRequest;
  sport: Sport;
  calculatedOrm?: { squat?: number; bench?: number; deadlift?: number };
}
