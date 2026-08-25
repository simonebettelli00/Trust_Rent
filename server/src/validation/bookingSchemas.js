import { z } from "zod";

const isoDate = z
  .string({ message: "La data è obbligatoria" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (atteso YYYY-MM-DD)");

function today() {
  return new Date().toISOString().slice(0, 10);
}

export const createBookingBodySchema = z
  .object({
    property_id: z.coerce.number({ message: "property_id è obbligatorio" }).int().positive(),
    check_in: isoDate,
    check_out: isoDate,
    note: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.check_in >= today(), {
    message: "La data di check-in non può essere nel passato",
    path: ["check_in"],
  })
  .refine((data) => data.check_out > data.check_in, {
    message: "Il check-out deve essere successivo al check-in",
    path: ["check_out"],
  });

export const bookingIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("L'id deve essere un numero positivo"),
});

export const bookingStatusBodySchema = z.object({
  status: z.enum(["accepted", "declined"], {
    message: "Lo stato deve essere 'accepted' o 'declined'",
  }),
});
