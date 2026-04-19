import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { GenerateProgramRequest, ProgramResponse } from "@shared/schema";
import { generateFitnessProgram } from "@/lib/programGenerator";

export function useGenerateProgram(
  options?: Omit<UseMutationOptions<ProgramResponse, Error, GenerateProgramRequest>, "mutationFn">
) {
  return useMutation<ProgramResponse, Error, GenerateProgramRequest>({
    mutationFn: async (data: GenerateProgramRequest) => {
      const payload: GenerateProgramRequest = {
        ...data,
        age: Number(data.age),
        weight: Number(data.weight),
        height: Number(data.height),
        daysPerWeek: Number(data.daysPerWeek),
      };
      // Run entirely in the browser — no server needed
      return generateFitnessProgram(payload);
    },
    ...options,
  });
}
