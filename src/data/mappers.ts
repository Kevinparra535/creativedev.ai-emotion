import type { AIEmotionPayload } from './schemas';
import type { Emotion } from '@/domain/emotion';
import type { Link, LinkKind } from '@/domain/link';

export function mapAIToDomain(input: AIEmotionPayload): { emotions: Emotion[]; links: Link[] } {
  console.log('Mapping AI payload to domain model...', input);
  const emotions: Emotion[] = input.nodes.map((n, i) => ({
    id: n.id || `${n.label}-${i}`,
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
  for (const em of emotions) {
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
  }

  return { emotions, links: [...explicit, ...implicit] };
}

// helpers (clamp, normalize, resolveId)...
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const normalizeValence = (v?: number) => {
  if (v === undefined || Number.isNaN(v)) return 0;
  // Si ya está en el rango [-1,1], lo dejamos tal cual (evita doble normalización)
  if (v >= -1 && v <= 1) return v;
  // En cualquier otro caso, clampeamos a [-1,1]
  return Math.max(-1, Math.min(1, v));
};

const resolveId = (nodes: Emotion[], ref: string) => {
  // 1) exact id match
  const byId = nodes.find((n) => n.id === ref);
  if (byId) return byId.id;
  // 2) label match (case-insensitive)
  const byLabel = nodes.find((n) => n.label.toLowerCase() === ref.toLowerCase());
  return byLabel?.id ?? ref;
};
