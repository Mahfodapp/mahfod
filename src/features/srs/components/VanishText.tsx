/**
 * VanishText — renders text with deterministically-randomised word obscuring.
 * Used by the 'words' vanish mode. Images & audio are never affected.
 */
import React, { useMemo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors } from '@/shared/theme';

/** Simple djb2 hash — deterministic, no external deps. */
function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

interface VanishTextProps {
  text: string;
  /** Memo ID used as seed so the same words are always hidden for the same memo. */
  memoId: string;
  style?: StyleProp<TextStyle>;
  /** Fraction of words to hide (0–1). Default: 0.45 */
  vanishRatio?: number;
}

export function VanishText({ text, memoId, style, vanishRatio = 0.45 }: VanishTextProps) {
  const parts = useMemo(() => {
    const seed = djb2(memoId);
    // split preserving whitespace tokens
    const tokens = text.match(/\S+|\s+/g) ?? [text];
    let wordIdx = 0;
    return tokens.map(token => {
      const isSpace = /^\s+$/.test(token);
      if (isSpace) return { token, hidden: false };
      // deterministic per-word: combine seed with position
      const h = djb2(`${seed}-${wordIdx}`);
      wordIdx++;
      const hidden = (h % 1000) / 1000 < vanishRatio;
      return { token, hidden };
    });
  }, [text, memoId, vanishRatio]);

  return (
    // Outer MText inherits fontSize / fontFamily / lineHeight from `style`
    <MText style={style}>
      {parts.map((part, idx) =>
        part.hidden ? (
          // Nested MText for inline override — colour matches surface so it looks like a block
          <MText
            key={idx}
            style={[style, {
              color: colors.surfaceHigh,
              backgroundColor: colors.surfaceHigh,
              borderRadius: 3,
            }]}
          >
            {part.token}
          </MText>
        ) : (
          // Plain string child is valid inside React Native Text
          part.token
        )
      )}
    </MText>
  );
}
