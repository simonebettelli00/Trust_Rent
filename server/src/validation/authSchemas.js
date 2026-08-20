import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ message: "L'email è obbligatoria" })
    .trim()
    .min(1, "L'email è obbligatoria")
    .email("Email non valida"),
  password: z
    .string({ message: "La password è obbligatoria" })
    .min(8, "La password deve avere almeno 8 caratteri"),
  full_name: z
    .string({ message: "Il nome completo è obbligatorio" })
    .trim()
    .min(1, "Il nome completo è obbligatorio"),
  phone: z.string().trim().optional().nullable(),
  role: z.enum(["tenant", "owner"], { message: "Il ruolo deve essere 'tenant' o 'owner'" }),
});

export const loginSchema = z.object({
  email: z
    .string({ message: "L'email è obbligatoria" })
    .trim()
    .min(1, "L'email è obbligatoria")
    .email("Email non valida"),
  password: z.string({ message: "La password è obbligatoria" }).min(1, "La password è obbligatoria"),
});
