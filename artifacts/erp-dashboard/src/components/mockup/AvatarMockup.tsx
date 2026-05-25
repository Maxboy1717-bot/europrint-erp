/**
 * AvatarMockup — SmartHR mockup style avatar.
 */

type Size = 'sm' | 'md' | 'lg' | 'xl';
type Color = 'orange' | 'dark' | 'blue' | 'pink' | 'purple' | 'red' | 'green';

const COLOR_BG: Record<Color, string> = {
  orange: 'var(--ep-primary)',
  dark: 'var(--ep-dark)',
  blue: '#3B82F6',
  pink: 'var(--ep-pink)',
  purple: 'var(--ep-purple)',
  red: 'var(--ep-red)',
  green: 'var(--ep-green)',
};

interface AvatarProps {
  name: string;
  size?: Size;
  color?: Color;
  showOnline?: boolean;
  src?: string;
}

export function AvatarMockup({ name, size = 'md', color = 'orange', showOnline, src }: AvatarProps) {
  const initials = (name ?? "")
    .split(/\s+/)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";

  const sizeClass = size === 'md' ? '' : `av-${size}`;

  return (
    <div className={`av-mockup ${sizeClass} relative`} style={{ background: COLOR_BG[color] }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
      {showOnline && (
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
          style={{
            background: 'var(--ep-green)',
            borderColor: 'hsl(var(--card))',
          }}
        />
      )}
    </div>
  );
}
