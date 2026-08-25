import { z } from "zod";

export const createAppointmentBodySchema = z.object({
  property_id: z.coerce.number({ message: "property_id è obbligatorio" }).int().positive(),
  slot_id: z.coerce.number({ message: "slot_id è obbligatorio" }).int().positive(),
  note: z.string().trim().optional().nullable(),
});

export const appointmentIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("L'id deve essere un numero positivo"),
});

export const appointmentStatusBodySchema = z.object({
  status: z.enum(["accepted", "declined"], {
    message: "Lo stato deve essere 'accepted' o 'declined'",
  }),
});
