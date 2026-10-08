export interface MatchStickerProps {
  tag: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
}

/** White tilted card with the pink "STRINGS ATTACHED" tag. */
export function MatchSticker({ tag, titleLine1, titleLine2, subtitle }: MatchStickerProps) {
  return (
    <div className="p24-sticker">
      <div className="p24-sticker-tag">{tag}</div>
      <div className="p24-sticker-title">
        {titleLine1}
        <br />
        <span className="p24-sticker-accent">{titleLine2}</span>
      </div>
      <div className="p24-sticker-sub">{subtitle}</div>
    </div>
  );
}
