# CREATIVE_VISION.md

## 1) Visión y propósito
“Lo que sientes al escribir, lo ves moverse.” La experiencia busca que el usuario sienta que su tono emocional se manifiesta en el espacio: colores que respiran, gradientes que cambian con suavidad, texturas con grano que recuerdan a película, y transiciones que responden a la intensidad emocional. Es un espejo emocional en tiempo real, un poema visual guiado por IA donde escribir se convierte en una acción performativa: la emoción deja rastro en la luz y el movimiento.

Esta obra explora el cruce entre IA, diseño y emoción como experimento de tecnología creativa. El objetivo no es solo clasificar sentimientos, sino traducirlos a lenguaje visual y cinético, invitando a la reflexión: ¿cómo se ve mi voz interior cuando se vuelve materia?

## 2) Enfoque de Creative Tech Lead
El proyecto demuestra dirección creativa y engineering integrados:
- Fusión AI + datos + sistemas visuales + UX: del análisis de texto (valence/arousal) a reglas visuales consistentes.
- Diseño de sistemas: presets de emoción, mapeos, y contratos de datos listos para escalar a escenas R3F y grafos.
- Implementación pragmática: MVP DOM fluido con Framer Motion + styled-components, y camino claro a 3D (R3F, PBR, PostFX).
- Balance arte/sistema: decisiones de performance (debounce, cancelación, single-layer DOM), con sensibilidad artística (paletas, micro-movimiento, grano).

## 3) Narrativa de experiencia de usuario
1. Escribes un pensamiento. El texto se ilumina con acentos cromáticos según palabras clave emocionales.
2. La app “escucha”: aparece “Leyendo tu tono…”. Se percibe calma o tensión en micro-animaciones.
3. La emoción se materializa: el fondo respira (expand/sway/fall/tremble/pulse), el grano flota, las transiciones son expresivas pero suaves.
4. Ajustas controles (Leva) para explorar intensidad, velocidad y textura; compartes un estado visual. La pieza te invita a observar cómo cambia tu paisaje interior con tus palabras.

Momentos clave: fades serenos para calma, pulsos cálidos para alegría, vibración sutil para tensión/miedo, caída lenta para tristeza, y un toque de “grain” cinematográfico para nostalgia/recuerdo.

## 4) Panorama técnico (resumen)
- Stack actual: React 19 + TypeScript + Vite 7 (SWC), Framer Motion, styled-components, (deps listas para R3F: three, @react-three/*), Leva, Zustand.
- Flujo de datos (rama DOM-first):
  - `features/prompt/PromptInput.tsx` (overlay de highlights + sincronización de scroll/altura)
  - `hooks/useEmotionEngine.ts` (debounce ~350–400 ms, AbortController)
  - `services/openIAService.ts` (`analyzeText`: heurística local por defecto; parser OpenAI listo)
  - `config/emotion-presets.ts` (label → `{ colors, motion, particles }`)
  - `scene/dom/Vizualizer.tsx` (gradiente + motion según preset; overlay de grano)
  - Orquestación: `ui/components/Canvas.tsx` (intro animada, loader “Leyendo tu tono…”, Leva)
- Arquitectura extendida (v2 / roadmap):
  - Factory IA: `EmotionServiceFactory` con modos `online|offline|auto` (OpenAI o heurística), payload multi: `{ version: 1, emotions[], pairs[], global? }`.
  - Mapeo a grafo: `data/mappers.ts` → `{ emotions: Emotion[]; links: Link[] }` para escenas R3F (clusters, enlaces energéticos, Planeta Blend).

Notas de integración:
- Env: usa `import.meta.env.VITE_*` (ver `src/config/config.ts`), no expongas `process.env`.
- Vite está fijado a `rolldown-vite@7.1.14`.
- Dev scripts: `npm run dev | build | preview | lint | format`.

## 5) Roadmap
Implementado ahora (DOM-first):
- Input con resaltado emocional (overlay HTML seguro) y ajuste auto de altura.
- Motor de emoción con debounce/cancelación y heurística local robusta (fallback offline).
- Presets visuales por emoción: colores + estilo de movimiento + grano.
- Panel Leva (intensity, speed, grain) con acciones de Save/Share.

Próximas fases (R3F y narrativa):
- Escenas R3F: un único `R3FCanvas` con `ClustersScene` (planetas/satélites/órbitas) y corrientes/enlaces.
- Planeta Blend (PBR + shaders Watercolor/Oil/Holographic/Voronoi) con calidad controlada (Leva).
- Audio-reactive (WebAudio API): sincronizar pulsos/partículas con energía sonora.
- Multi-emotion blending: interpolación continua en un plano valence/arousal, transiciones temporales (timeline narrativa).
- PostFX ligero (Bloom, Noise, Vignette, Chromatic Aberration) centralizado.
- Integraciones: WebGPU (cuando sea estable), export/share de presets y snapshots.

## 6) Vocabulario creativo
- Planeta Blend: núcleo que mezcla los tonos emocionales activos; su superficie refleja la paleta y la energía (pinceladas acuarela/óleo).
- Enlaces energéticos: corrientes de energía entre emociones relacionadas; aparecen cuando hay vínculos significativos.
- Clusters emocionales: agrupaciones de planetas/emociones; el centroide representa el estado global.
- Corrientes efímeras: visualizaciones temporales que sugieren pensamiento en movimiento (solo visibles cuando hay `links.length > 0`).

## 7) Intención de showcase
- Forma: pieza interactiva de portafolio/instalación digital y demo de creative coding.
- Relato: la unión de sensibilidad artística y rigor técnico; un instrumento para observar la resonancia emocional de nuestras palabras.
- Objetivo para la audiencia: inspirar exploración (jugar con el texto, los controles, y oír/ver la emoción), y comprender cómo la IA puede ser un material expresivo, no solo utilitario.

---

Sugerencia de navegación del repo:
- Entradas: `src/main.tsx` → `src/App.tsx` → `ui/components/Canvas.tsx`.
- Núcleo UX: `features/prompt/PromptInput.tsx`, `hooks/useEmotionEngine.ts`, `scene/dom/Vizualizer.tsx`.
- Configuración: `src/config/config.ts`, `vite.config.ts`, `package.json`.
- Expansión R3F (siguiente fase): `scene/r3f/*` (clusters, objetos y utils) y `data/mappers.ts`.
