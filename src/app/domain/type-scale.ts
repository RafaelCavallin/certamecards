const LONG_FRONT_THRESHOLD = 280;

export type FrontSizeClass = 'text-front' | 'text-front-long';

/** Lei seca longa pede um degrau menor para caber sem rolagem horizontal. */
export function frontSizeClass(text: string): FrontSizeClass {
  return text.length > LONG_FRONT_THRESHOLD ? 'text-front-long' : 'text-front';
}
