export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="p25-typing" role="status" aria-label={`${name} is typing`}>
      <span className="p25-typing__dot p25-typing__dot--1" />
      <span className="p25-typing__dot p25-typing__dot--2" />
      <span className="p25-typing__dot p25-typing__dot--3" />
    </div>
  );
}
