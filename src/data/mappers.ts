import type { Emotion } from '@/domain/emotion';
import type { Link, LinkKind } from '@/domain/link';
import type { AIEmotionPayload } from './schemas';

export function mapAIToDomain(input: AIEmotionPayload): { emotions: Emotion[]; links: Link[] } {
  const emotions: Emotion[] = input.nodes.map((n, i) => ({
    id: `${n.label}-${i}`,
    label: n.label,
    valence: normalizeValence(n.valence), // asegura rango [-1,1]
    arousal: clamp01(n.arousal ?? 0.5),
    intensity: clamp01(n.intensity ?? n.score ?? 0.6),
    colorHex: n.colors?.[0],
    meta: { score: n.score, colors: n.colors, relations: n.relations }
  }));

  // Links explícitos si hay
  const explicit: Link[] = (input.edges ?? []).map((e, i) => ({
    id: `e${i}`,
    source: resolveId(emotions, e.source),
    target: resolveId(emotions, e.target),
    kind: (e.kind as LinkKind) ?? 'semantic',
    weight: e.weight ?? 0.5
  }));

  // Links implícitos por "relations" textuales
  const implicit: Link[] = [];
  emotions.forEach((em) => {
    const rels = (em.meta?.relations as string[]) || [];
    rels.forEach((r, idx) => {
      const target = emotions.find((x) => x.label.toLowerCase() === r.toLowerCase());
      if (target) {
        implicit.push({
          id: `r-${em.id}-${idx}`,
          source: em.id,
          target: target.id,
          kind: 'semantic',
          weight: 0.4
        });
      }
    });
  });

  return { emotions, links: [...explicit, ...implicit] };
}

// helpers (clamp, normalize, resolveId)...
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const normalizeValence = (v?: number) => {
  if (v === undefined) return 0;
  // Si viniera 0..1, lo mapeamos a -1..1
  return v > 1 || v < -1 ? Math.max(-1, Math.min(1, v)) : v * 2 - 1;
};

const resolveId = (nodes: Emotion[], label: string) =>
  nodes.find((n) => n.label.toLowerCase() === label.toLowerCase())?.id ?? label;
