# Contratos de datos (IA ↔ dominio)

Este documento describe el payload esperado desde el motor de IA (o heurística local) y cómo se mapea al dominio que consume la escena R3F `ClustersScene`.

## Resumen

- Input IA (payload multi): `version`, `emotions[]`, `pairs[]`, `global?`.
- Cada emoción puede incluir: `id` (estable), `label`, `valence`, `arousal`, `intensity`, `weight|score`, `colors`, `relations`.
- `pairs` define enlaces explícitos entre `label`s presentes en `emotions`.
- `relations` define enlaces implícitos desde una emoción hacia otras por `label`.
- El mapper (`src/data/mappers.ts`) normaliza y construye `{ emotions: Emotion[]; links: Link[] }`.

## Esquema de entrada (TypeScript)

```ts
export interface AIEmotionNode {
  id?: string;              // opcional: id estable del backend
  label: string;            // "joy" | "fear" | ... (minúsculas consistente con clusters)
  score?: number;           // confianza/peso [0..1]
  valence?: number;         // [-1..1]
  arousal?: number;         // [0..1]
  colors?: string[];        // paleta sugerida (usamos colors[0] como colorHex)
  intensity?: number;       // [0..1] (pulso visual)
  relations?: string[];     // labels a conectar implícitamente
}

export interface AIEmotionPayload {
  nodes: AIEmotionNode[];
  edges?: Array<{ source: string; target: string; kind?: string; weight?: number; }>;
}
```

Validación estricta (Zod) usada en modo online:

```ts
const EmotionZ = z.object({
  id: z.string().optional(),
  label: z.string().regex(/^[a-z0-9_]+$/),
  weight: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
  arousal: z.number().min(0).max(1),
  intensity: z.number().min(0).max(1).optional(),
  colors: z.array(z.string().regex(/^#([0-9A-Fa-f]{6})$/)).optional(),
  relations: z.array(z.string()).optional()
});
```

## Ejemplo de payload

```json
{
  "version": 1,
  "emotions": [
    {
      "id": "sadness",
      "label": "sadness",
      "valence": -0.7,
      "arousal": 0.35,
      "intensity": 0.7,
      "weight": 0.65,
      "colors": ["#2196F3"],
      "relations": ["nostalgia", "loneliness"]
    },
    {
      "id": "nostalgia",
      "label": "nostalgia",
      "valence": -0.2,
      "arousal": 0.35,
      "intensity": 0.45,
      "weight": 0.35,
      "colors": ["#90CAF9"]
    }
  ],
  "pairs": [["sadness", "nostalgia"], ["sadness", "loneliness"]],
  "global": { "valence": -0.5, "arousal": 0.4 }
}
```

## Mapeo a dominio

- `src/data/mappers.ts` genera:
  - `Emotion[]` con:
    - `id = node.id || '${label}-${i}'`
    - `label`, `valence` (clamp a [-1,1] sólo si viene fuera de rango), `arousal` [0,1]
    - `intensity` (o `score` como fallback)
    - `colorHex = colors?.[0]`
    - `meta`: `{ score, colors, relations }`
  - `Link[]` con:
    - Explícitos: de `edges`/`pairs`
    - Implícitos: desde cada emoción a sus `meta.relations[]` si existe emoción destino

## Consumo en ClustersScene

- Satélites: 1 emoción = 1 satélite en el cluster correspondiente; pulso = `intensity`; color = `colorHex` o paleta del cluster.
- Planeta del cluster: color tiende hacia la emoción dominante del cluster; pulso global por peso agregado.
- Enlaces:
  - Por defecto entre primarias (energía): visibles solo cuando `!thinking` y no hay `links` del backend.
  - Corrientes efímeras por `links` (pairs/relations): visibles cuando `links.length > 0`.
  - Re-balance (cliente): si hay `links` pero ninguno cruza clusters, el cliente sintetiza 1–2 enlaces cruzados entre emociones con mayor `intensity`/`score` para mantener continuidad visual.

## Recomendaciones de backend

- Enviar `id` estable por emoción para minimizar re-montajes en animaciones.
- Mantener `label` consistente con `config/emotion-clusters`.
- Proveer `relations` siempre que tenga sentido; cuando no haya `pairs`, aún obtendrás conexiones implícitas.
- `valence` y `arousal` ya normalizados en su rango; el cliente no re-escala si están dentro del rango.
- Si tu modelo no devuelve `pairs`, considera incluir `relations` por emoción; de lo contrario, el cliente aplicará re-balance opcional para generar enlaces cruzados mínimos.
