import { z } from 'zod';

export const EmotionZ = z.object({
  label: z.string().regex(/^[a-z0-9_]+$/),
  weight: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
  arousal: z.number().min(0).max(1),
  intensity: z.number().min(0).max(1).optional(),
  colors: z.array(z.string().regex(/^#([0-9A-Fa-f]{6})$/)).optional(),
  relations: z.array(z.string()).optional()
});

export const PayloadZ = z
  .object({
    version: z.literal(1),
    emotions: z.array(EmotionZ).max(8),
    global: z.object({
      valence: z.number().min(-1).max(1),
      arousal: z.number().min(0).max(1)
    }),
    pairs: z
      .array(z.tuple([z.string(), z.string()]))
      .optional()
      .default([])
  })
  .superRefine((data, ctx) => {
    const labels = new Set(data.emotions.map((e) => e.label));
    (data.pairs || []).forEach(([a, b], i) => {
      if (!labels.has(a) || !labels.has(b)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `pairs[${i}] contiene labels no presentes en emotions: ${a}, ${b}`
        });
      }
    });
  });
