import { z } from "zod";

export const notificationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("L'id deve essere un numero positivo"),
});
