import { z } from "zod";

export const createConversationBodySchema = z.object({
  property_id: z.coerce
    .number({ message: "property_id è obbligatorio" })
    .int()
    .positive("property_id è obbligatorio"),
});

export const conversationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("L'id deve essere un numero positivo"),
});
