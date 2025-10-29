# AI Prompt Visualizer

**Visión:** Una experiencia interactiva donde cada palabra cobra vida. El usuario escribe un texto y la IA traduce su emoción en color, movimiento y ritmo visual.

### El objetivo:

conectar lenguaje, emoción y visualidad en tiempo real.

### **Stack:**

- React
- Framer Motion
- React Three Fiber
- ThreeJS
- OpenAI API

### **Rol:**

Creative Technologist — ideación, diseño, desarrollo y narrativa visual.

![image.png](attachment:05ef64cc-be2d-43bf-b4f7-fe2c3ff6e953:image.png)

### Concept & Ideation

El proyecto comenzó con una pregunta simple:

> **“¿Cómo se vería una emoción si pudiera ser un fondo animado?”**
> 

Inspiraciones:

- Visual poetry generativa (Refik Anadol, Obvious)
- Modelos de emoción (Plutchik, Valence–Arousal)
- Interfaces sensibles (Bloom, Calm, Human AI)
- Universo de emociones (**Eduard Punset)**

![image.png](attachment:177e80de-0e29-4da2-be25-430fe5e15777:image.png)

![image.png](attachment:bb5054eb-c43c-4a10-b832-7566f919aa01:image.png)

![image.png](attachment:e52df16a-44db-47a4-8974-78c7c7e28071:image.png)

![image.png](attachment:14b3ca26-80a2-4001-8d25-19f7d6b7589f:image.png)

### Boceto inicial:

![IMG_6457 (1).jpg](attachment:3c7be3fc-87d5-4ccf-8843-47ad79f7c163:IMG_6457_(1).jpg)

## **Emotion System Design**

El núcleo del proyecto es un motor de mapeo emocional que transforma el texto en señales de dominio y visuales, a través de EmotionServiceFactory (online/offline), normalización de grafo y clustering, y aplica presets en DOM/R3F.

- Emoción dominante
- Valence (positivo ↔ negativo)
- Arousal (energía)
- Color palette, motion profile, particle density

| Emotion | Palette | Motion | Keywords |
| --- | --- | --- | --- |
| Alegría | #FFD93D → #FF6B00 | Expansiva, suave | “alegría”, “feliz”, “sol”, “calor” |
| Calma | #2DD4BF → #3B82F6 | Flotante, lenta | “paz”, “quietud”, “sereno”, “still” |
| Ira | #FF2E63 → #D00000 | Pulsante, abrupta | “rabia”, “fuego”, “enfado”, “romper” |
| Tristeza | #60A5FA → #1E293B | Caída, densa | “triste”, “llanto”, “solo”, “vacío” |
| Miedo | #7C3AED → #111827 | Temblorosa, retraída | “miedo”, “pánico”, “sombra”, “amenaza” |
| Ansiedad | #06B6D4 → #7C3AED | Agitada, micro‑vibración | “ansiedad”, “nervioso”, “worry”, “estresado” |
| Amor | #FF4D6D → #F72585 | Latido, envolvente | “amor”, “cariño”, “abrazo”, “affection” |
| Esperanza | #A7F3D0 → #22C55E | Ascendente, ligera | “esperanza”, “luz”, “nuevo”, “brota” |
| Asombro | #FDE68A → #8B5CF6 | Explosiva, elástica | “wow”, “asombro”, “sorprende”, “maravilla” |
| Asco | #84CC16 → #4D7C0F | Ondulante, viscosa | “asco”, “repulsión”, “sucio”, “toxic” |
| Melancolía | #60A5FA → #94A3B8 | Mecida, nostálgica | “melancolía”, “recuerdo”, “nostalgia” |
| Enfoque | #38BDF8 → #10B981 | Estable, orbital | “focus”, “concentrar”, “flujo”, “profundo” |

![image.png](attachment:457b5ca9-9ace-4d17-ba47-bf92078e259f:image.png)

## **Technical Architecture**

Aplicación modular React + R3F centrada en un pipeline de análisis emocional que sincroniza DOM y WebGL con un único servicio de emociones.

- Stack: React 19 + TypeScript + Vite 7 (SWC). Alias: @ → src.
- Entrypoint: main.tsx → src/App.tsx. Integración de la UI en ui/components/MainScreen.tsx.
- Input → análisis → mapeo → visualización:
    - features/prompt/PromptInput.tsx
    - hooks/useEmotionCoordinator (debounce 350–450 ms + cancelación) orquesta stores UI y dominio.
    - services/EmotionServiceFactory selecciona OpenIAAdapter (online) o ai/local-emotions (offline).
    - data/mappers.ts normaliza a grafo; systems/GraphBuilder + RuleEngine + ClusterEngine ajustan pesos, reglas y clusters.
    - DOM: scene/dom/Vizualizer.tsx aplica presets.
    - WebGL: scene/r3f/R3FCanvas.tsx + scene/r3f/ClustersScene.tsx renderizan planetas, enlaces y Planeta Blend.

### Estructura de carpetas principal

src/

- main.tsx
- App.tsx
- features/
    - prompt/
        - PromptInput.tsx
- hooks/
    - useEmotionCoordinator.ts
    - useEmotionVisuals2.ts
    - useBlendLeva.ts
    - useVisualLeva.ts
    - useAudioLeva.ts
- services/
    - EmotionServiceFactory.ts
    - OpenIAAdapter.ts
    - universeGraph.ts
- ai/
    - local-emotions.ts
- systems/
    - GraphBuilder.ts
    - RuleEngine.ts
    - ClusterEngine.ts
- data/
    - mappers.ts
- state/
    - universe.store.ts
- stores/
    - ...stores de UI y flags
- scene/
    - dom/
        - Vizualizer.tsx
    - r3f/
        - R3FCanvas.tsx
        - ClustersScene.tsx
        - UniverseScene.tsx (alternativa para grafo completo)
        - objects/
            - Planets.tsx (Planeta Blend)
        - utils/
            - ...helpers de geometría, materiales, layout
- config/
    - config.ts (AUDIO/TEXTURES/intro/flags)
    - emotion-presets.ts
    - emotion-clusters.ts
- utils/
    - validators.ts (Zod)
    - iaUtiils.ts (parser permisivo)
    - logger.ts
- ui/
    - components/
        - MainScreen.tsx
- assets/ (opcional; texturas/audio suelen referenciarse desde config)
- styles/ (si aplica)

### Servicios y contratos

- Modo de análisis: VITE_EMOTION_MODE=online|offline|auto (auto si hay VITE_OPENAI_API_KEY).
- EmotionServiceFactory expone:
    - emotionService.analyze, analyzeMulti, analyzeToGraph.
    - Re‑balanceo en cliente: sintetiza 1–2 enlaces cross‑cluster si falta cruce.
- Payload IA/local v1:
    - emotions[]: { id?, label, valence[-1..1], arousal[0..1], intensity|weight, colors?, relations? }
    - pairs[], global?
- data/mappers.ts → { emotions, links } para ClustersScene.
- Validación: Zod estricto + parser permisivo (utils/validators.ts, utils/iaUtiils.ts).

![image.png](attachment:adb3dd88-ce5a-4068-a3ac-6b64c1f6237f:image.png)

## Iteration Process

### 🧩 Fase 1 – Prompt → Color

- Primer prototipo: solo cambiaba el fondo según el tono.
- Aprendí sobre latencia IA y suavizado de transición.
    
    ![Fase 1](./docs/fase1.gif)
    

### ⚡ Fase 2 – Motion + Layers

- Agregué **Framer Motion** para simular ritmo emocional.
- Introduje **“motion profiles”** según la energía (Arousal).
    
    ![Fase 2](./docs/fase2.gif)
    

### 🌈 Fase 3 – Emotion Blending

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.
    
    ![Fase 3](./docs/fase3.gif)
    

### 🌈 Fase 4 – R3F introduccion

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.
    
    ![Screenshot 2025-10-23 001551.png](attachment:9b379652-47b5-480d-8957-894e1aae8876:Screenshot_2025-10-23_001551.png)
    

### 🌈 Fase 3 – Emotion Blending

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.

### 🌈 Fase 3 – Emotion Blending

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.
- 🌈 Fase 3 – Emotion Blending
- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.

### 🌈 Fase 3 – Emotion Blending

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.

### 🌈 Fase 3 – Emotion Blending

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.🌈 Fase 3 – Emotion Blending
- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.

### 🌈 Fase 3 – Emotion Blending

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.

### 🌈 Fase 3 – Emotion Blending

- Permitir mezcla entre emociones (alegría + nostalgia → cálido/sepia).
- Mejora del mapeo visual + inspector lateral.

### 🧠 Fase n – POC Final

- UI minimalista tipo “meditativa”.
- Modo oscuro, export PNG, explicación IA.

![Final POC](./docs/final_poc.gif)

## **AI Layer & Mapping Logic**

Capa IA y mapeo tal como la usamos: un único servicio selecciona online (OpenAI) u offline (heurística local), valida/normaliza el payload y lo mapea a grafo para R3F.

- Contratos: Zod estricto + parser permisivo.
- Servicio: EmotionServiceFactory con analyze, analyzeMulti y analyzeToGraph.
- Online: OpenIAAdapter (JSON estricto, temperatura baja).
- Offline: ai/local-emotions (keywords y pesos).
- Mapeo: data/mappers.ts → { emotions, links }.
- Re‑balance: 1–2 enlaces cross‑cluster si faltan cruces.

Ejemplos (extractos):

```tsx
export type Emotion = {
  id: string;
  label: string;
  valence: number;   // -1..1
  arousal: number;   // 0..1
  weight: number;    // 0..1 (intensity normalizada)
  colors?: string[]; // opcional, hex
  relations?: string[];
};

export type Link = {
  source: string;    // id/label
  target: string;
  weight: number;    // 0..1
  kind?: 'cooccur' | 'cross' | 'model';
};

export type AnalysisPayloadV1 = {
  version: 1;
  emotions: Array<Partial<Emotion> & { label: string }>;
  pairs?: Array<{ a: string; b: string; weight?: number }>;
  global?: { dominant?: string; sentiment?: number };
};

export type GraphData = { emotions: Emotion[]; links: Link[] };
```

```tsx
import { z } from 'zod';

export const emotionZ = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  valence: z.number().gte(-1).lte(1),
  arousal: z.number().gte(0).lte(1),
  weight: z.number().gte(0).lte(1),
  colors: z.array(z.string()).optional(),
  relations: z.array(z.string()).optional(),
});

export const payloadV1Z = z.object({
  version: z.literal(1),
  emotions: z.array(emotionZ.partial({ id: true, colors: true, relations: true }).extend({
    label: z.string().min(1),
  })),
  pairs: z.array(z.object({
    a: z.string().min(1),
    b: z.string().min(1),
    weight: z.number().gte(0).lte(1).optional(),
  })).optional(),
  global: z.object({
    dominant: z.string().optional(),
    sentiment: z.number().gte(-1).lte(1).optional(),
  }).optional(),
});

export function safeParsePayload(input: unknown) {
  const r = payloadV1Z.safeParse(input);
  if (r.success) return r.data;
  // parser permisivo: intenta rescatar campos típicos
  try {
    const j = typeof input === 'string' ? JSON.parse(input) : input;
    return payloadV1Z.parse({
      version: 1,
      emotions: (j.emotions ?? j.items ?? []).map((e: any) => ({
        label: String(e.label ?? e.name ?? 'unknown'),
        valence: Number(e.valence ?? e.sentiment ?? 0),
        arousal: Number(e.arousal ?? e.energy ?? 0.5),
        weight: Number(e.weight ?? e.intensity ?? 0.6),
        colors: e.colors,
        relations: e.relations,
      })),
      pairs: (j.pairs ?? j.links ?? []).map((p: any) => ({
        a: String(p.a ?? p.source),
        b: String(p.b ?? p.target),
        weight: Number(p.weight ?? p.confidence ?? 0.5),
      })),
      global: j.global,
    });
  } catch {
    throw r.error;
  }
}
```

```tsx
export type Emotion = {
  id: string;
  label: string;
  valence: number;   // -1..1
  arousal: number;   // 0..1
  weight: number;    // 0..1 (intensity normalizada)
  colors?: string[]; // opcional, hex
  relations?: string[];
};

export type Link = {
  source: string;    // id/label
  target: string;
  weight: number;    // 0..1
  kind?: 'cooccur' | 'cross' | 'model';
};

export type AnalysisPayloadV1 = {
  version: 1;
  emotions: Array<Partial<Emotion> & { label: string }>;
  pairs?: Array<{ a: string; b: string; weight?: number }>;
  global?: { dominant?: string; sentiment?: number };
};

export type GraphData = { emotions: Emotion[]; links: Link[] };
```

```tsx
import { GraphData, AnalysisPayloadV1, Emotion, Link } from '@/core/types';
import { mapToGraph } from '@/data/mappers';
import { safeParsePayload } from '@/utils/validators';
import { OpenIAAdapter } from './OpenIAAdapter';
import { localAnalyze } from '@/ai/local-emotions';

export type EmotionService = {
  analyze(prompt: string, signal?: AbortSignal): Promise<AnalysisPayloadV1>;
  analyzeMulti(prompts: string[], signal?: AbortSignal): Promise<AnalysisPayloadV1[]>;
  analyzeToGraph(prompt: string, signal?: AbortSignal): Promise<GraphData>;
};

function synthesizeCrossLinks(graph: GraphData): GraphData {
  if (graph.links.length >= 2 || graph.emotions.length < 2) return graph;
  const sorted = [...graph.emotions].sort((a, b) => b.weight - a.weight);
  const a = sorted[0], b = sorted[1];
  const exists = graph.links.some(l =>
    (l.source === a.label && l.target === b.label) || (l.source === b.label && l.target === a.label),
  );
  if (!exists) {
    graph.links.push({ source: a.label, target: b.label, weight: 0.35, kind: 'cross' });
  }
  return graph;
}

export function EmotionServiceFactory(): EmotionService {
  const mode = (import.meta.env.VITE_EMOTION_MODE ?? 'auto') as 'online' | 'offline' | 'auto';
  const hasKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  const online = mode === 'online' || (mode === 'auto' && hasKey);
  const adapter = online ? OpenIAAdapter() : null;

  return {
    async analyze(prompt, signal) {
      const raw = online ? await adapter!.analyze(prompt, signal) : await localAnalyze(prompt);
      return safeParsePayload(raw) as AnalysisPayloadV1;
    },
    async analyzeMulti(prompts, signal) {
      const res = await Promise.all(prompts.map(p => this.analyze(p, signal)));
      return res;
    },
    async analyzeToGraph(prompt, signal) {
      const payload = await this.analyze(prompt, signal);
      const graph = mapToGraph(payload);
      return synthesizeCrossLinks(graph);
    },
  };
}
```

```tsx
import OpenAI from 'openai';

const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

export function OpenIAAdapter() {
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
    dangerouslyAllowBrowser: true,
  });

  const system = [
    'Eres un analizador emocional.',
    'Responde SÓLO JSON válido con schema {version:1, emotions[], pairs[], global?}.',
    'Emoción: {label, valence[-1..1], arousal[0..1], weight[0..1], colors?}.',
  ].join(' ');

  function buildUser(prompt: string) {
    return [
      'Texto:',
      prompt,
      '',
      'Devuelve 3–6 emociones. Incluye pairs si hay co-ocurrencias claras.',
      'Ejemplo:',
      JSON.stringify({
        version: 1,
        emotions: [
          { label: 'joy', valence: 0.8, arousal: 0.6, weight: 0.7, colors: ['#FFD93D', '#FF6B00'] },
          { label: 'calm', valence: 0.4, arousal: 0.2, weight: 0.5 },
        ],
        pairs: [{ a: 'joy', b: 'calm', weight: 0.4 }],
      }),
    ].join('\n');
  }

  return {
    async analyze(prompt: string, signal?: AbortSignal) {
      const resp = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: buildUser(prompt) },
        ],
        // @ts-ignore
        signal,
      });
      const content = resp.choices[0]?.message?.content ?? '{}';
      return JSON.parse(content);
    },
  };
}
```

```tsx
import { AnalysisPayloadV1 } from '@/core/types';

const LEX = [
  { label: 'joy', valence: 0.8, arousal: 0.6, kw: ['feliz','alegr','sonr','sun','luz','logré'] },
  { label: 'calm', valence: 0.4, arousal: 0.2, kw: ['paz','calma','quiet','sereno','respirar'] },
  { label: 'anger', valence: -0.7, arousal: 0.8, kw: ['enojo','rabia','ira','molest','romper'] },
  { label: 'sadness', valence: -0.6, arousal: 0.4, kw: ['triste','lloro','perdí','vacío','solo'] },
  { label: 'fear', valence: -0.8, arousal: 0.9, kw: ['miedo','pánico','temor','sombra','amenaza'] },
  { label: 'love', valence: 0.7, arousal: 0.5, kw: ['amor','cariño','abraz','querer','te amo'] },
];

export async function localAnalyze(prompt: string): Promise<AnalysisPayloadV1> {
  const text = prompt.toLowerCase();
  const hits = LEX.map(e => {
    const score = e.kw.reduce((s, k) => s + (text.includes(k) ? 1 : 0), 0);
    return score > 0 ? { ...e, weight: Math.min(0.35 + score * 0.15, 1) } : null;
  }).filter(Boolean) as any[];

  const emotions = (hits.length ? hits : [{ label: 'calm', valence: 0.2, arousal: 0.2, weight: 0.4 }])
    .map(e => ({ label: e.label, valence: e.valence, arousal: e.arousal, weight: e.weight }));

  const pairs = emotions.length >= 2 ? [{ a: emotions[0].label, b: emotions[1].label, weight: 0.35 }] : [];

  return { version: 1, emotions, pairs };
}
```

```tsx
import { AnalysisPayloadV1, Emotion, GraphData, Link } from '@/core/types';

export function mapToGraph(payload: AnalysisPayloadV1): GraphData {
  const emotions: Emotion[] = payload.emotions.map((e, i) => ({
    id: e.id ?? `${e.label}-${i}`,
    label: e.label,
    valence: clamp(e.valence ?? 0, -1, 1),
    arousal: clamp(e.arousal ?? 0.5, 0, 1),
    weight: clamp(e.weight ?? e['intensity'] ?? 0.6, 0, 1),
    colors: e.colors,
    relations: e.relations,
  }));

  const links: Link[] = (payload.pairs ?? []).map(p => ({
    source: p.a,
    target: p.b,
    weight: clamp(p.weight ?? 0.4, 0, 1),
    kind: 'model',
  }));

  // normalización simple de pesos relativos
  const maxW = Math.max(...emotions.map(e => e.weight), 0.001);
  emotions.forEach(e => (e.weight = clamp(e.weight / maxW, 0.05, 1)));

  return { emotions, links };
}

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
```

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { EmotionServiceFactory } from '@/services/EmotionServiceFactory';
import { useUniverseStore } from '@/state/universe.store';

export function useEmotionCoordinator() {
  const service = useMemo(() => EmotionServiceFactory(), []);
  const setGraph = useUniverseStore(s => s.setGraph);
  const [thinking, setThinking] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  async function analyze(prompt: string) {
    ctl.current?.abort();
    ctl.current = new AbortController();
    setThinking(true);
    try {
      const graph = await service.analyzeToGraph(prompt, ctl.current.signal);
      setGraph(graph);
    } finally {
      setThinking(false);
    }
  }

  // debounce 400ms (ejemplo de uso)
  function debouncedAnalyze(prompt: string) {
    let t: any;
    return (value: string) => {
      clearTimeout(t);
      t = setTimeout(() => analyze(value), 400);
    };
  }

  return { analyze, debouncedAnalyze, thinking };
}
```

Ejemplo de uso directo (desde PromptInput o pruebas rápidas):

```tsx
// sin filepath (uso de ejemplo)
import { EmotionServiceFactory } from '@/services/EmotionServiceFactory';

const emotionService = EmotionServiceFactory();

const res = await emotionService.analyze('Me siento en paz pero con un nudo en el estómago.');
// -> payload v1 validado

const graph = await emotionService.analyzeToGraph('Una mezcla de alegría y miedo por lo que viene.');
// -> { emotions, links } listo para ClustersScene
```

---

### 7. 🌐 UX & Interaction Design

Describe el flujo desde la experiencia del usuario.

```tsx
## UX & Interaction Flow

1️⃣ El usuario escribe una frase en PromptInput (features/prompt/PromptInput.tsx).
2️⃣ useEmotionCoordinator (hooks/useEmotionCoordinator) aplica debounce 350–450 ms y cancelación (AbortController), muestra estado thinking y envía el texto al servicio.
3️⃣ EmotionServiceFactory decide modo online (OpenIAAdapter) u offline (ai/local-emotions); valida con Zod y normaliza a payload v1 → mapToGraph.
4️⃣ Se publica { emotions, links } en state/universe.store.ts; DOM y R3F reaccionan en paralelo:
   - DOM: scene/dom/Vizualizer.tsx aplica presets de config/emotion-presets (gradiente, micro-interacciones).
   - R3F: scene/r3f/R3FCanvas.tsx + scene/r3f/ClustersScene.tsx actualizan planetas, enlaces energéticos y Planeta Blend.
5️⃣ Transición visual: se interpolan colores/valores (valence/arousal→paleta/motion) y se re-equilibran enlaces cross-cluster en cliente si faltan cruces.
6️⃣ El usuario ajusta intensidad/efectos desde Leva:
   - useEmotionVisuals2 (efecto/estética), useVisualLeva (PostFX), useBlendLeva (calidad del Planeta Blend), useAudioLeva (parámetros de audio).
   - Puede aplicar presets desde config/emotion-presets (guardar preset: pendiente).
7️⃣ Estados de UX:
   - thinking: suaviza animaciones, oculta enlaces largos, muestra corrientes efímeras.
   - error/timeout: fallback a heurística local (ai/local-emotions) y notificación discreta en UI.
   - vacío: preset neutro (calm) y guía contextual en MainScreen.

![UX Flow](./docs/ux_flow.png)

## Results & Learnings

- 💡 Un único servicio IA simplifica el flujo: input → payload v1 → grafo → DOM/R3F sincronizados.
- ⚙️ Latencias reales: offline 50–120 ms (+ render), online 600–1200 ms según red; debounce + cancelación evitan “rebotes” visuales.
- 🎨 Valence/arousal controlan paleta y motion; el re-balance de enlaces mejora cohesión percibida entre múltiples emociones.
- 🧠 Un solo canvas WebGL reduce jank; normalización de pesos estabiliza el layout ante ruido del modelo.

> Próximos pasos:
>
> - Audio-reactividad más profunda (enlace directo de weights/arousal a FFT/parametría shader).
> - Blend multi-emoción más rico (morphs ponderados y cross-fades en Planeta Blend).
> - Exportar captura y compartir estado por URL (querystring + presets sociales).
> - Mejores mensajes de error/estado y onboarding corto en MainScreen.

![Showcase](./docs/showcase.png)
```

## Gallery

Timeline visual:

![Screenshot 2025-10-23 013755.png](attachment:a1011954-fb4b-4281-9018-b5228e8b3bc2:Screenshot_2025-10-23_013755.png)

![Screenshot 2025-10-23 002303.png](attachment:a5764156-e9e1-4d14-b167-d72382a3e26f:Screenshot_2025-10-23_002303.png)

![Screenshot 2025-10-23 001551.png](attachment:9408004f-f9a0-41f8-94e8-04f3e4484236:Screenshot_2025-10-23_001551.png)

![Screenshot 2025-10-23 172002.png](attachment:56f14065-45e7-43c7-9331-60c5a069fa39:Screenshot_2025-10-23_172002.png)

![Screenshot 2025-10-27 224415.png](attachment:1da7a350-7d41-4a65-b033-3a7464b23e7c:Screenshot_2025-10-27_224415.png)

![Screenshot 2025-10-28 024201.png](attachment:8edaf1cb-c536-4419-acd2-2520b67b88a9:Screenshot_2025-10-28_024201.png)

![Screenshot 2025-10-29 122358.png](attachment:7b32fc06-c4b4-4ec5-90ad-35a7183e1222:Screenshot_2025-10-29_122358.png)

![image.png](attachment:da2e78b1-46cb-49ad-9311-9fef3bbe7b10:image.png)

## Reflection as Creative Tech Lead

Este proyecto fue un ejercicio de:

- **Dirección creativa tecnológica:** balancear arte, emoción y rendimiento.
- **Prototipado iterativo:** evolucionar de una idea poética a un sistema visual funcional.
- **Storytelling interactivo:** transformar texto en emoción palpable.
- **Sistemas reusables:** diseñar un motor adaptable a futuros proyectos sensoriales.

> “La emoción se volvió código.
> 
> 
> El código, una forma de sentir.”
>
