import React, { useState } from 'react';
import { AutoTextarea } from './AutoTextarea';

interface ListEditorProps {
  title: string;
  description: string;
  items: { id: string; text: string }[];
  typeLabel: string;
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

export const ListEditor: React.FC<ListEditorProps> = ({
  title,
  description,
  items,
  typeLabel,
  onAdd,
  onRemove,
  onUpdate
}) => {
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(newValue.trim());
      setNewValue('');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-8 rounded-lg border border-nsw-grey-300 shadow-sm space-y-6 fade-in">
      <div className="space-y-2">
        <h3 className="text-xl font-black text-nsw-blue uppercase tracking-widest leading-none">{title}</h3>
        <p className="text-sm text-nsw-grey-400 font-medium leading-relaxed">{description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Add a new ${typeLabel.toLowerCase()}...`}
            className="flex-1 p-4 border border-nsw-grey-300 rounded-md focus:border-nsw-blue focus:ring-1 focus:ring-nsw-blue outline-none transition-all font-medium"
          />
          <button
            onClick={handleAdd}
            disabled={!newValue.trim()}
            className="bg-nsw-blue text-white px-8 rounded-md font-bold hover:bg-nsw-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 uppercase tracking-wider text-xs"
          >
            <span className="material-symbols-outlined">add</span>
            Add
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 items-start group animation-slide-up">
              <AutoTextarea
                value={item.text}
                onChange={(v) => onUpdate(item.id, v)}
                className="flex-1 p-4 border border-nsw-grey-200 rounded-md bg-nsw-grey-50/50 hover:bg-white focus:bg-white focus:border-nsw-blue focus:ring-1 focus:ring-nsw-blue outline-none transition-all overflow-hidden resize-none h-auto min-h-[60px] font-medium leading-relaxed"
              />
              <button
                onClick={() => onRemove(item.id)}
                className="p-4 text-nsw-grey-300 hover:text-nsw-danger transition-colors"
                title="Remove Item"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-nsw-grey-200 rounded-md text-nsw-grey-300 font-bold italic">
              No {typeLabel.toLowerCase()}s added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
