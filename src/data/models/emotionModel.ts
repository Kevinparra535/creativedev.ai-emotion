import { Emotion } from '@/domain/entities/emotion';

export type EmotionLabel = 'joy' | 'fear' | 'nostalgia' | string;

export interface ConstructorParams {
  label: EmotionLabel;
  score: number;
  valence: number; // -1..1
  arousal: number; // 0..1
  error?: string | null;
  [key: string]: any;
}

export class EmotionModel {
  public label: ConstructorParams['label'];
  public score: ConstructorParams['score'];
  public error?: ConstructorParams['error'];
  public valence: ConstructorParams['valence'];
  public arousal: ConstructorParams['arousal'];
  [key: string]: any;

  constructor(model: ConstructorParams) {
    this.label = model.label;
    this.score = model.score;
    this.error = model.error;
    this.arousal = model.arousal;
    this.valence = model.valence;
  }

  static fromJson(data: any): EmotionModel {
    return new EmotionModel({
      label: data.label,
      score: data.score,
      valence: data.valence,
      arousal: data.arousal,
      error: data.error ?? null
    });
  }

  static toDomain(data: any): Emotion {
    return new Emotion({
      label: data.label,
      score: data.score,
      valence: data.valence,
      arousal: data.arousal,
      error: data.error ?? null
    });
  }
}

declare module './emotionModel' {
  interface EmotionModel {
    toDomain(): Emotion;
  }
}

EmotionModel.prototype.toDomain = function () {
  return new Emotion({
    label: this.label,
    score: this.score,
    valence: this.valence,
    arousal: this.arousal,
    error: this.error ?? null
  });
};
