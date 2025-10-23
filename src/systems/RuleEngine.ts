import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import type { RuleSet } from '@/domain/rules';

export class RuleEngine {
  constructor(private ruleSet: RuleSet) {}

  apply(emotions: Emotion[]): Link[] {
    return this.ruleSet.rules.flatMap((rule) =>
      emotions.filter((e) => rule.appliesTo(e, emotions)).flatMap((e) => rule.linkify(e, emotions))
    );
  }
}
