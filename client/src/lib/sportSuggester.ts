import type { QuestionnaireRequest, Sport, SportId } from "@shared/schema";

const sports: Record<SportId, Sport> = {
  bodybuilding: {
    id: "bodybuilding",
    name: "Bodybuilding",
    description: "Training focused on maximising muscle size, symmetry, and aesthetics through high-volume resistance work. Rep ranges typically 8–15, with emphasis on mind-muscle connection and progressive overload.",
    imageUrl: "/bodybuilding.jpeg",
    videoUrl: "https://www.youtube.com/embed/R6gZoAzAhCg",
    benefits: ["Significant muscle growth", "Improved body composition", "Increased metabolic rate", "Aesthetic physique development"],
    requirements: ["Gym access (dumbbells, barbells, machines)", "4–6 days/week training", "Disciplined nutrition", "Consistent progressive overload"],
  },
  powerlifting: {
    id: "powerlifting",
    name: "Powerlifting",
    description: "A strength sport focused on maximising your 1RM in the Squat, Bench Press, and Deadlift. Programming uses block periodisation (Volume → Strength → Peaking → Deload) with RPE-based loading.",
    imageUrl: "/powerlifting.jpeg",
    videoUrl: "https://www.youtube.com/embed/ultWZbUMPL8",
    benefits: ["Exceptional absolute strength", "Improved bone density", "Neurological adaptations", "Competitive opportunities"],
    requirements: ["Barbell + rack + bench", "3–4 days/week", "Technical coaching recommended", "Structured periodisation"],
  },
  powerbuilding: {
    id: "powerbuilding",
    name: "Powerbuilding",
    description: "A hybrid approach combining low-rep strength work with moderate-rep hypertrophy work. You develop both muscle size and real strength simultaneously.",
    imageUrl: "/powerbuilding.jpeg",
    videoUrl: "https://www.youtube.com/embed/OsQMM7GG_A4",
    benefits: ["Balanced strength and size", "Injury resilience", "Functional strength", "Less prone to plateaus"],
    requirements: ["Gym equipment access", "4–5 days/week", "Mixed rep range programming", "Adequate recovery"],
  },
  calisthenics: {
    id: "calisthenics",
    name: "Calisthenics",
    description: "Build relative strength, body control, and functional fitness using bodyweight exercises. Progress from fundamentals toward advanced skill movements like muscle-ups, handstands, and the planche.",
    imageUrl: "/calisthenics.jpeg",
    videoUrl: "https://www.youtube.com/embed/sSUJcMI1qLA",
    benefits: ["Minimal equipment needed", "Excellent bodyweight control", "Strong connective tissue", "Impressive skill movements"],
    requirements: ["Pullup bar or rings", "Parallel bars (optional)", "3–4 days/week", "Progressive skill development"],
  },
  general_health: {
    id: "general_health",
    name: "General Health & Fitness",
    description: "Balanced full-body programming designed to improve overall health, functional strength, and quality of life. Ideal for beginners or anyone who values health over specialisation.",
    imageUrl: "/general-health.png",
    videoUrl: "https://www.youtube.com/embed/3p8EBPVZ2Iw",
    benefits: ["Improved overall health markers", "Balanced strength and endurance", "Sustainable long-term approach", "Reduced injury risk"],
    requirements: ["Minimal equipment (dumbbells or bodyweight)", "2–4 days/week", "Consistency over intensity", "Enjoyment of the process"],
  },
};

const GOAL_SCORES: Record<string, Partial<Record<SportId, number>>> = {
  strength:       { powerlifting: 60, powerbuilding: 35, bodybuilding: 10 },
  muscle_size:    { bodybuilding: 60, powerbuilding: 35, calisthenics: 10 },
  weight_loss:    { general_health: 60, calisthenics: 40, bodybuilding: 20 },
  endurance:      { general_health: 60, calisthenics: 45, bodybuilding: 10 },
  general_health: { general_health: 60, calisthenics: 30, bodybuilding: 15 },
};

export async function suggestSport(q: QuestionnaireRequest): Promise<{
  sport: Sport;
  matchScore: number;
  reasoning: string;
}> {
  const scores: Record<SportId, number> = {
    bodybuilding: 0, powerlifting: 0, powerbuilding: 0, calisthenics: 0, general_health: 0,
  };

  for (const goal of q.goals) {
    const bonus = GOAL_SCORES[goal] ?? {};
    for (const [sport, pts] of Object.entries(bonus)) {
      scores[sport as SportId] += pts!;
    }
  }

  const hasBarbell = q.equipment.includes("barbell");
  const hasBodyweightOnly = q.equipment.length === 0 || q.equipment.every((e) => e === "bodyweight");

  if (!hasBarbell) {
    scores.powerlifting = -9999;
    scores.powerbuilding -= 30;
  }
  if (hasBodyweightOnly) {
    scores.calisthenics += 20;
    scores.general_health += 10;
    scores.bodybuilding -= 30;
  }

  const bmi = q.weight / ((q.height / 100) ** 2);
  if (bmi > 28 && q.experience === "beginner") {
    scores.calisthenics -= 25;
    scores.general_health += 15;
  }
  if (q.age >= 50) {
    scores.general_health += 20;
    scores.powerlifting -= 10;
  } else if (q.age >= 40) {
    scores.general_health += 10;
  }
  if (q.experience === "beginner") {
    scores.powerlifting -= 15;
    scores.general_health += 10;
  }
  if (q.experience === "advanced" || q.experience === "elite") {
    scores.powerlifting += 5;
    scores.powerbuilding += 5;
  }
  if (q.daysPerWeek < 3) {
    scores.bodybuilding -= 15;
    scores.powerbuilding -= 10;
    scores.general_health += 15;
  }

  const validEntries = Object.entries(scores).filter(([, v]) => v > -9000);
  const [bestId] = validEntries.reduce((prev, cur) => (cur[1] > prev[1] ? cur : prev));
  const sportId = bestId as SportId;
  const primaryGoal = q.goals[0] ?? "general_health";

  const reasoningMap: Record<string, string> = {
    strength: `Your goal of building strength makes ${sports[sportId].name} the ideal fit — it's built around progressive overload and maximising your lifts.`,
    muscle_size: `For building muscle, ${sports[sportId].name} is the top pick — its volume and rep ranges are optimised for hypertrophy.`,
    weight_loss: `To lose weight while staying active, ${sports[sportId].name} offers the best balance of calorie burn and muscle retention.`,
    endurance: `Given your endurance goal, ${sports[sportId].name} will build your cardiovascular capacity while keeping you strong.`,
    general_health: `For overall health and longevity, ${sports[sportId].name} gives you a balanced, sustainable training foundation.`,
  };

  return {
    sport: sports[sportId],
    matchScore: 78,
    reasoning: reasoningMap[primaryGoal] ?? `Based on your profile, ${sports[sportId].name} is the best match for your goals.`,
  };
}
