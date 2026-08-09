import type { ComponentType } from 'react';

type LetterGlitchProps = {
  glitchColors?: string[];
  className?: string;
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
};

declare const LetterGlitch: ComponentType<LetterGlitchProps>;

export default LetterGlitch;
