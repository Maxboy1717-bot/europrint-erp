/**
 * @module SheetTabs
 * @description P1-7 sheet tab bar for the Jadval editor (Excel-style multiple sheets). Switch
 * (click), rename (double-click → inline input), delete (× on the active tab, min 1 sheet kept),
 * and add (+). Purely presentational — the editor owns the Workbook state and CRUD handlers.
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tLabel } from '@/lib/i18n/tLabel';

export function SheetTabs({
  order, active, onSelect, onAdd, onRename, onDelete,
}: {
  order: string[];
  active: string;
  onSelect: (name: string) => void;
  onAdd: () => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const commitRename = () => {
    if (editing) {
      const name = draft.trim();
      if (name && name !== editing) onRename(editing, name);
    }
    setEditing(null);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-t border-[var(--ep-border)] bg-[var(--ep-surface)] overflow-x-auto">
      {order.map((name) => {
        const isActive = name === active;
        return (
          <div key={name}
            className={cn(
              'group inline-flex items-center gap-1 h-7 px-2 rounded-t-md text-[12px] font-medium cursor-pointer border border-b-0 whitespace-nowrap',
              isActive ? 'bg-white text-[var(--ep-text)] border-[var(--ep-border)]' : 'bg-[var(--ep-bg)] text-[var(--ep-muted)] border-transparent hover:bg-[var(--ep-surface)]',
            )}
            onClick={() => onSelect(name)}
            onDoubleClick={() => { setEditing(name); setDraft(name); }}
            title={tLabel('documents.sheetRenameHint', 'Ikki marta bosib nomini o\'zgartiring')}
          >
            {editing === name ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(null); }}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-24 text-[12px] px-1 rounded border border-[var(--ep-blue)] bg-white outline-none"
              />
            ) : (
              <span>{name}</span>
            )}
            {isActive && order.length > 1 && editing !== name && (
              <button type="button" title={tLabel('documents.sheetDelete', "Varaqni o'chirish")}
                onClick={(e) => { e.stopPropagation(); onDelete(name); }}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--ep-red)]/10 hover:text-[var(--ep-red)] opacity-0 group-hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
      <button type="button" title={tLabel('documents.sheetAdd', "Varaq qo'shish")} onClick={onAdd}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] text-[var(--ep-muted)] shrink-0">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
