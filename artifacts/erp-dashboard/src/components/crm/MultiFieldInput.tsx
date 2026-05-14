/**
 * @module MultiFieldInput
 * @description React UI component.
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface MultiFieldInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  label?: string;
}

export function MultiFieldInput({
  value = [],
  onChange,
  placeholder = "Qo'shish...",
  type = "text",
  label,
}: MultiFieldInputProps) {
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newValue.trim()) {
      onChange([...value, newValue.trim()]);
      setNewValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange((Array.isArray(value) ? value : []).filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      
      <div className="space-y-2">
        {(Array.isArray(value) ? value : []).map((item, index) => (
          <div key={`k-${index}`} className="flex items-center gap-2">
            <Input
              type={type}
              value={item}
              onChange={(e) => {
                const updated = [...value];
                updated[index] = e.target.value;
                onChange(updated);
              }}
              className="flex-1"
              data-testid={`input-multifield-${index}`}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleRemove(index)}
              data-testid={`button-remove-${index}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
            data-testid="input-multifield-new"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleAdd}
            disabled={!newValue.trim()}
            data-testid="button-add-multifield"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
