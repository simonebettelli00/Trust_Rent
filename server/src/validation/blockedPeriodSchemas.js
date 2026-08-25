import { z } from "zod";

const isoDate = z
  .string({ message: "La data è obbligatoria" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (atteso YYYY-MM-DD)");

export const blockedPeriodBodySchema = z
  .object({
    start_date: isoDate,
    end_date: isoDate,
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "La data di fine deve essere successiva alla data di inizio",
    path: ["end_date"],
  });

export const blockedPeriodParamsSchema = z.object({
  id: z.coerce.number().int().positive("L'id deve essere un numero positivo"),
  blockedPeriodId: z.coerce.number().int().positive("L'id deve essere un numero positivo"),
});
