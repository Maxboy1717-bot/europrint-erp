/**
 * @module TypingIndicator
 * @description React UI component.
 */

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
    <div className="flex items-center gap-2 px-4 sm:px-[10%] lg:px-[15%] py-1.5 bg-[var(--tg-chat-bg)]">
      <span className="flex gap-[3px] items-center">
        <span className="w-[5px] h-[5px] bg-[var(--tg-sidebar-active)] rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-[5px] h-[5px] bg-[var(--tg-sidebar-active)] rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-[5px] h-[5px] bg-[var(--tg-sidebar-active)] rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
      <span className="text-[13px] text-[var(--tg-sidebar-active)] italic">{text}...</span>
    </div>
  );
}
