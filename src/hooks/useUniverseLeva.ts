import { useControls, button } from 'leva';
import { mapAIToDomain } from '@/data/mappers';
import { GraphBuilder } from '@/systems/GraphBuilder';
import { RuleEngine } from '@/systems/RuleEngine';
import { EnergyRules } from '@/systems/rules/EnergyRules';
import { useUniverse } from '@/state/universe.store';

// Temporary mock payload to simulate backend/OpenIAAdapter response
const MOCK_RESPONSE = {
  version: 1,
  emotions: [
    {
      label: 'joy',
      weight: 0.8,
      valence: 0.85,
      arousal: 0.6,
      intensity: 0.7,
      colors: ['#FFD54F'],
      relations: ['love', 'gratitude', 'surprise']
    },
    { label: 'nostalgia', weight: 0.5, valence: -0.2, arousal: 0.3 },
    { label: 'gratitude', weight: 0.4, valence: 0.7, arousal: 0.4 }
  ],
  global: { valence: 0.34, arousal: 0.46 },
  pairs: [
    ['joy', 'gratitude'],
    ['joy', 'nostalgia']
  ]
} as const;

export function useUniverseLeva() {
  const setData = useUniverse((s) => s.setData);
  const setLayout = useUniverse((s) => s.setLayout);

  const controls = useControls('Universe Dev', {
    'Inject Mock Response': button(() => {
      // 1) Mapeo: convertir payload externo a AIEmotionPayload compatible
      const payload = {
        nodes: MOCK_RESPONSE.emotions.map((e) => ({
          label: e.label,
          score: e.weight, // map weight -> score
          valence: e.valence,
          arousal: e.arousal,
          intensity: 'intensity' in e ? (e as any).intensity : undefined,
          colors: 'colors' in e ? (e as any).colors : undefined,
          relations: 'relations' in e ? (e as any).relations : undefined
        })),
        edges: (MOCK_RESPONSE.pairs ?? []).map(([a, b]) => ({
          source: a,
          target: b,
          kind: 'cooccurrence',
          weight: 0.5
        }))
      };

      const { emotions, links } = mapAIToDomain(payload);

      // 2) Clusterización por valencia
      const galaxies = GraphBuilder.clusterByValence(emotions);

      // 3) Reglas de energía
      const ruleLinks = new RuleEngine({ id: 'energies', rules: EnergyRules }).apply(emotions);

      // 4) Merge de links
      const mergedLinks = GraphBuilder.mergeLinks(...links, ...ruleLinks);

      // 5) Layout: configurar modo (sphericalVA)
      setLayout({ mode: 'sphericalVA' });

      // 6) Estado global
      setData({ emotions, galaxies, links: mergedLinks });
    }),
    'Reset Universe': button(() => {
      setData({ emotions: [], galaxies: [], links: [] });
    }),
    'New Label': { value: 'admiration' },
    'Valence [-1..1]': { value: 0.2, min: -1, max: 1, step: 0.01 },
    'Arousal [0..1]': { value: 0.5, min: 0, max: 1, step: 0.01 },
    'Intensity [0..1]': { value: 0.6, min: 0, max: 1, step: 0.01 },
    'Color Hex': { value: '#8ecae6' },
    'Add New Emotion': button(() => {
      const label = String((controls as any)['New Label'] || 'emotion').trim();
      const val = Number((controls as any)['Valence [-1..1]'] ?? 0);
      const aro = Number((controls as any)['Arousal [0..1]'] ?? 0.5);
      const inten = Number((controls as any)['Intensity [0..1]'] ?? 0.6);
      const colorHex = String((controls as any)['Color Hex'] || '#8ecae6');

      // Fetch the latest state at click time to avoid stale closures
      const st = useUniverse.getState();
      const currentEmotions = st.emotions;
      const currentLinks = st.links;

      // Ensure unique id for the new emotion
      const baseId = `${label.toLowerCase()}-${Date.now()}`;
      const newEmotion = {
        id: baseId,
        label,
        valence: Math.max(-1, Math.min(1, val)),
        arousal: Math.max(0, Math.min(1, aro)),
        intensity: Math.max(0, Math.min(1, inten)),
        colorHex,
        meta: { relations: ['awe', 'respect', 'inspiration', 'gratitude', 'pride'] }
      } as const;

      const nextEmotions = [...currentEmotions, newEmotion as any];
      const galaxies = GraphBuilder.clusterByValence(nextEmotions);

      // Compute rule links only for the new emotion to avoid duplicating existing weights
      const newRuleLinks = EnergyRules.flatMap((rule) =>
        (rule as any).appliesTo(newEmotion, nextEmotions)
          ? (rule as any).linkify(newEmotion, nextEmotions)
          : []
      );
      const mergedLinks = GraphBuilder.mergeLinks(...currentLinks, ...newRuleLinks);

      st.setData({ emotions: nextEmotions, galaxies, links: mergedLinks });
    })
  });
}
