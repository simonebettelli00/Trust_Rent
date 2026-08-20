import { z } from "zod";

const idParam = z.coerce.number().int().positive("L'id deve essere un numero positivo");

export const propertyIdParamsSchema = z.object({ id: idParam });

export const propertyImageParamsSchema = z.object({
  id: idParam,
  imageId: idParam,
});

export const propertySlotParamsSchema = z.object({
  id: idParam,
  slotId: idParam,
});

export const propertyBodySchema = z.object({
  title: z.string({ message: "Il titolo è obbligatorio" }).trim().min(1, "Il titolo è obbligatorio"),
  description: z.string().trim().optional().nullable(),
  rental_type: z.enum(["long", "short"], {
    message: "Il tipo di affitto deve essere 'long' o 'short'",
  }),
  address: z
    .string({ message: "L'indirizzo è obbligatorio" })
    .trim()
    .min(1, "L'indirizzo è obbligatorio"),
  city: z.string({ message: "La città è obbligatoria" }).trim().min(1, "La città è obbligatoria"),
  postal_code: z.string().trim().optional().nullable(),
  floor: z.string().trim().optional().nullable(),
  sqm: z.coerce.number().int().positive().optional().nullable(),
  num_rooms: z.coerce.number().int().positive().optional().nullable(),
  num_bathrooms: z.coerce.number().int().positive().optional().nullable(),
  furnishings: z.array(z.string()).optional(),
  monthly_price: z.coerce.number({ message: "Il canone mensile è obbligatorio" }).positive(
    "Il canone mensile deve essere un numero positivo"
  ),
  deposit: z.coerce.number().nonnegative().optional().nullable(),
  available_from: z.string().trim().optional().nullable(),
  is_published: z.boolean().optional(),
});

export const propertyPublishBodySchema = z.object({
  is_published: z.boolean({ message: "is_published deve essere un booleano" }),
});

export const propertyImageOrderBodySchema = z.object({
  order: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        sort_order: z.coerce.number().int().nonnegative(),
      })
    )
    .min(1, "L'ordine deve contenere almeno un'immagine"),
});

const boundCoordinate = (name) =>
  z.coerce.number({ message: `${name} è obbligatorio ed è numerico` });

export const propertySearchQuerySchema = z.object({
  north: boundCoordinate("north"),
  south: boundCoordinate("south"),
  east: boundCoordinate("east"),
  west: boundCoordinate("west"),
  minPrice: z.coerce.number().positive("minPrice deve essere un numero positivo").optional(),
  maxPrice: z.coerce.number().positive("maxPrice deve essere un numero positivo").optional(),
  rooms: z.coerce.number().int().positive("rooms deve essere un numero intero positivo").optional(),
});

export const slotBodySchema = z
  .object({
    date: z.string({ message: "La data è obbligatoria" }).trim().min(1, "La data è obbligatoria"),
    start_time: z
      .string({ message: "L'ora di inizio è obbligatoria" })
      .trim()
      .min(1, "L'ora di inizio è obbligatoria"),
    end_time: z
      .string({ message: "L'ora di fine è obbligatoria" })
      .trim()
      .min(1, "L'ora di fine è obbligatoria"),
  })
  .refine((data) => data.start_time < data.end_time, {
    message: "L'ora di fine deve essere successiva all'ora di inizio",
    path: ["end_time"],
  });
