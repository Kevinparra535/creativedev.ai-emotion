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

  useControls('Universe Dev', {
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
    })
  });
}
