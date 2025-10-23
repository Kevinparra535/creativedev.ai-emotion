import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import { AFFECT_DEFAULTS } from '@/systems/ClusterEngine';

function idFor(kind: Link['kind'], a: Emotion, b: Emotion) {
  return `${kind}|${a.id}->${b.id}`;
}

function has(all: Emotion[], label: string) {
  const l = label.toLowerCase();
  return all.find((e) => e.label.toLowerCase() === l) ?? null;
}

function weightFrom(a: Emotion, b: Emotion, base = 0.6): number {
  const va = typeof a.valence === 'number' ? a.valence : (AFFECT_DEFAULTS[a.label]?.valence ?? 0);
  const vb = typeof b.valence === 'number' ? b.valence : (AFFECT_DEFAULTS[b.label]?.valence ?? 0);
  const aa =
    typeof a.arousal === 'number' ? a.arousal : (AFFECT_DEFAULTS[a.label]?.arousal ?? 0.5);
  const ab =
    typeof b.arousal === 'number' ? b.arousal : (AFFECT_DEFAULTS[b.label]?.arousal ?? 0.5);
  const dv = 1 - Math.min(1, Math.abs(va - vb));
  const da = 1 - Math.min(1, Math.abs(aa - ab));
  // Combine similarity with base (favor closer emotions)
  const sim = dv * 0.6 + da * 0.4;
  const intensity = Math.max(
    0.4,
    Math.min(1, (a.intensity ?? 0.6) * 0.5 + (b.intensity ?? 0.6) * 0.5)
  );
  return Math.max(0.2, Math.min(0.95, base * (0.5 + 0.5 * sim) * intensity));
}

export const EnergyPolarityRule = {
  id: 'energy:polarity',
  name: 'Energy Polarity Connections',

  appliesTo(e: Emotion) {
    return [
      'love',
      'joy',
      'calm',
      'sadness',
      'fear',
      'anger',
      'surprise',
      'nostalgia',
      'gratitude',
      'curiosity',
      'pride'
    ].includes(e.label.toLowerCase());
  },

  linkify(e: Emotion, all: Emotion[]): Link[] {
    const pairs: Array<[string, string]> = [
      // Expansivas
      ['joy', 'love'],
      ['love', 'gratitude'],
      ['joy', 'curiosity'],
      // Contractivas
      ['sadness', 'nostalgia'],
      ['fear', 'anger'],
      ['sadness', 'fear'],
      // Puente
      ['surprise', 'joy'],
      ['surprise', 'fear']
    ];
    const my = e.label.toLowerCase();
    const edges: Link[] = [];
    for (const [a, b] of pairs) {
      if (a !== my && b !== my) continue;
      const other = has(all, a === my ? b : a);
      if (!other) continue;
      const src = a === my ? e : other;
      const dst = a === my ? other : e;
      const w = weightFrom(src, dst, 0.55);
      edges.push({
        id: idFor('polarity', src, dst),
        source: src.id,
        target: dst.id,
        weight: w,
        kind: 'polarity'
      });
    }
    return edges;
  }
};

export const EnergyTransitionRule = {
  id: 'energy:transition',
  name: 'Energy Transition Paths',
  appliesTo() {
    return true;
  },
  linkify(e: Emotion, all: Emotion[]): Link[] {
    const L = (s: string) => s.toLowerCase();
    const my = L(e.label);
    const edges: Link[] = [];

    const emit = (from: string, to: string, base = 0.5) => {
      if (my !== L(from)) return;
      const dst = has(all, to);
      if (!dst) return;
      const w = weightFrom(e, dst, base);
      edges.push({
        id: idFor('transition', e, dst),
        source: e.id,
        target: dst.id,
        weight: w,
        kind: 'transition'
      });
    };

    // fear → calm/curiosity (respeto/cautela ~ calma; curiosidad como apertura)
    emit('fear', 'calm', 0.5);
    emit('fear', 'curiosity', 0.45);
    // anger → pride/confidence (determinación)
    emit('anger', 'pride', 0.48);
    emit('anger', 'confidence', 0.48);
    // sadness → empathy/calm (aceptación)
    emit('sadness', 'empathy', 0.46);
    emit('sadness', 'calm', 0.48);
    // surprise → joy/fear (borde)
    emit('surprise', 'joy', 0.52);
    emit('surprise', 'fear', 0.52);

    return edges;
  }
};

export const EnergyCauseRule = {
  id: 'energy:cause',
  name: 'Energy Cause-Reaction',
  appliesTo() {
    return true;
  },
  linkify(e: Emotion, all: Emotion[]): Link[] {
    const edges: Link[] = [];
    const my = e.label.toLowerCase();

    const link = (src: Emotion, tgtLabel: string, base = 0.45) => {
      const t = has(all, tgtLabel);
      if (!t) return;
      const w = weightFrom(src, t, base);
      edges.push({
        id: idFor('cause', src, t),
        source: src.id,
        target: t.id,
        weight: w,
        kind: 'cause'
      });
    };

    if (my === 'fear' || my === 'love') {
      // culpa emerge de miedo + amor
      link(e, 'guilt', 0.44);
    }
    if (my === 'sadness' || my === 'love') {
      // compasión desde dolor compartido
      link(e, 'compassion', 0.46);
    }
    if (my === 'fear') {
      // orgullo como respuesta a inseguridad (aproximación)
      link(e, 'pride', 0.4);
    }
    return edges;
  }
};

export const EnergyFunctionRule = {
  id: 'energy:function',
  name: 'Energy Functional Links',
  appliesTo() {
    return true;
  },
  linkify(e: Emotion, all: Emotion[]): Link[] {
    const edges: Link[] = [];

    const connect = (a: string, b: string, base = 0.5) => {
      const la = a.toLowerCase();
      const lb = b.toLowerCase();
      if (e.label.toLowerCase() !== la) return;
      const dst = has(all, lb);
      if (!dst) return;
      const w = weightFrom(e, dst, base);
      edges.push({
        id: idFor('function', e, dst),
        source: e.id,
        target: dst.id,
        weight: w,
        kind: 'function'
      });
    };

    // Propósito adaptativo
    connect('fear', 'anger', 0.5); // protege ↔ defiende
    connect('sadness', 'calm', 0.52); // sana ↔ calma
    connect('joy', 'curiosity', 0.5); // expande ↔ explora
    connect('love', 'gratitude', 0.54); // expande ↔ aprecia
    connect('curiosity', 'surprise', 0.48); // explora → descubre

    return edges;
  }
};

export const EnergyRules = [
  EnergyPolarityRule,
  EnergyTransitionRule,
  EnergyCauseRule,
  EnergyFunctionRule
];
