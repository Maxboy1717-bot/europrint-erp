interface Props {
  typingUsers: Set<string>;
}

export function TypingIndicator({ typingUsers }: Props) {
  if (typingUsers.size === 0) return null;
  const names = Array.from(typingUsers);

  let text = "";
  if (names.length === 1) text = `${names[0]} yozmoqda`;
  else if (names.length === 2) text = `${names[0]} va ${names[1]} yozmoqda`;
  else text = `${names.length} kishi yozmoqda`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
      <span className="flex gap-0.5 items-center">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
      <span className="italic">{text}...</span>
    </div>
  );
}
