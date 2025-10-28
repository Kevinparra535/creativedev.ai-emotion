# AI Prompt Visualizer

**Visión:** Una experiencia interactiva donde cada palabra cobra vida.  
El usuario escribe un texto y la IA traduce su emoción en color, movimiento y ritmo visual.  
El objetivo: conectar lenguaje, emoción y visualidad en tiempo real.

**Stack:** React + Framer Motion + OpenAI API  
**Rol:** Creative Technologist — ideación, diseño, desarrollo y narrativa visual.

![Hero Screenshot](./docs/hero_final.png)

## Concept & Ideation

El proyecto comenzó con una pregunta simple:

> “¿Cómo se vería una emoción si pudiera ser un fondo animado?”

Inspiraciones:

- Visual poetry generativa (Refik Anadol, Obvious)
- Modelos de emoción (Plutchik, Valence–Arousal)
- Interfaces sensibles (Bloom, Calm, Human AI)

![Moodboard](./docs/moodboard.png)

Boceto inicial:
![Sketch](./docs/sketch_1.jpg)

## Emotion System Design

El núcleo del proyecto es un _emotion mapping engine_ que traduce el texto en:

- **Emoción dominante**
- **Valence** (positivo ↔ negativo)
- **Arousal** (energía)
- **Color palette**, **motion profile**, **particle density**

| Emotion | Palette           | Motion            | Keywords                  |
| ------- | ----------------- | ----------------- | ------------------------- |
| Joy     | #FFD93D → #FF6B00 | Expanding, smooth | “happy”, “sun”, “warm”    |
| Calm    | #2DD4BF → #3B82F6 | Floating, slow    | “peace”, “still”, “quiet” |
| Anger   | #FF2E63 → #D00000 | Pulsing, abrupt   | “rage”, “fire”, “broken”  |

![Mapping Diagram](./docs/emotion_mapping.png)

## Technical Architecture

La aplicación sigue una arquitectura modular y escalable:
rc/
├── core/ # lógica de análisis y mapping
│ ├── analyzePrompt.ts
│ ├── emotionMapping.ts
│ └── types.ts
├── ui/
│ ├── components/
│ │ ├── PromptInput.tsx
│ │ ├── Visualizer.tsx
│ │ └── EmotionPanel.tsx
│ ├── scenes/
│ │ └── SceneMain.tsx
│ └── styles/
├── assets/
│ └── palettes.json
├── hooks/
└── App.tsx

> Usé **Zustand** para el estado global y **Framer Motion** para animaciones reactivas.

![Architecture Diagram](./docs/architecture.png)

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

### 🧠 Fase 4 – POC Final

- UI minimalista tipo “meditativa”.
- Modo oscuro, export PNG, explicación IA.

![Final POC](./docs/final_poc.gif)

## AI Layer & Mapping Logic

Usé la API de OpenAI con un modelo ligero de texto para detectar emoción principal y secundaria:

```ts
async function analyzePrompt(prompt: string) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Analyze emotion from text' },
      { role: 'user', content: prompt }
    ]
  });

  return parseEmotion(res.choices[0].message.content);
}
```

---

### 7. 🌐 UX & Interaction Design

Describe el flujo desde la experiencia del usuario.

```markdown
## UX & Interaction Flow

1️⃣ Usuario escribe una frase.  
2️⃣ IA analiza emoción.  
3️⃣ Transición visual + feedback semántico.  
4️⃣ Usuario ajusta intensidad o guarda preset.  
5️⃣ Puede exportar imagen o compartir link.

![UX Flow](./docs/ux_flow.png)

## Results & Learnings

- 💡 Conecté emociones y código en un mismo flujo perceptivo.
- ⚙️ Implementé un pipeline IA + visual en <1s de respuesta.
- 🎨 Descubrí que la “explicabilidad visual” aumenta la empatía del usuario.
- 🧠 Aprendí sobre micro-latencias, interpolaciones de color y arousal mapping.

> Próximos pasos:
>
> - Integrar audio-reactividad.
> - Añadir blend entre emociones múltiples.
> - Publicar demo en Vercel con presets sociales.

![Showcase](./docs/showcase.png)
```

## Gallery

| Concept                              | Prototype                                | Final                            |
| ------------------------------------ | ---------------------------------------- | -------------------------------- |
| ![Concept](./docs/concept_thumb.jpg) | ![Prototype](./docs/prototype_thumb.gif) | ![Final](./docs/final_thumb.gif) |

Timeline visual:
![Evolution](./docs/evolution_timeline.png)

## Reflection as Creative Tech Lead

Este proyecto fue un ejercicio de:

- **Dirección creativa tecnológica:** balancear arte, emoción y rendimiento.
- **Prototipado iterativo:** evolucionar de una idea poética a un sistema visual funcional.
- **Storytelling interactivo:** transformar texto en emoción palpable.
- **Sistemas reusables:** diseñar un motor adaptable a futuros proyectos sensoriales.

> “La emoción se volvió código.  
> El código, una forma de sentir.”
