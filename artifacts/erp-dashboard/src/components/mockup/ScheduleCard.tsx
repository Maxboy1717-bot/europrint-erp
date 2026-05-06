/**
 * ScheduleCard — kalendardagi event yoki vazifa kartasi (mockup uslubi).
 */
import { Clock, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";

interface ScheduleCardProps {
  tag?: string;
  tagColor?: 'orange' | 'green' | 'blue' | 'purple' | 'pink' | 'red';
  title: string;
  time?: string;
  location?: string;
  attendees?: number;
  bottom?: ReactNode;
}

export function ScheduleCard({
  tag,
  tagColor = 'orange',
  title,
  time,
  location,
  attendees,
  bottom,
}: ScheduleCardProps) {
  const tagBg: Record<string, string> = {
    orange: 'var(--ep-primary)',
    green: 'var(--ep-green)',
    blue: '#3B82F6',
    purple: 'var(--ep-purple)',
    pink: 'var(--ep-pink)',
    red: 'var(--ep-red)',
  };

  return (
    <div className="sched-card">
      {tag && (
        <span
          className="sc-tag"
          style={{ background: tagBg[tagColor] }}
        >
          {tag}
        </span>
      )}
      <div className="sc-title">{title}</div>
      <div className="sc-meta">
        {time && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {time}
          </span>
        )}
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {location}
          </span>
        )}
        {attendees !== undefined && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {attendees}
          </span>
        )}
      </div>
      {bottom && <div className="mt-2.5">{bottom}</div>}
    </div>
  );
}
