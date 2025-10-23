export type EmotionLabel = 'joy' | 'fear' | 'nostalgia' | string;

export interface ConstructorParams {
  label: EmotionLabel;
  score: number;
  valence: number; // -1..1
  arousal: number; // 0..1
  error?: string | null;
  [key: string]: any;
}

export class Emotion {
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
}
