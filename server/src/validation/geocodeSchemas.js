import { z } from "zod";

export const geocodeQuerySchema = z.object({
  q: z
    .string({ message: "Il parametro q è obbligatorio" })
    .trim()
    .min(1, "Il parametro q è obbligatorio"),
});
