
import React, { useState } from 'react';

interface ListItem {
  id: string;
  text: string;
}

interface ListEditorProps {
  title: string;
  description: string;
  items: ListItem[];
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
  const [newItemText, setNewItemText] = useState('');

  const handleAdd = () => {
    if (newItemText.trim()) {
      onAdd(newItemText.trim());
      setNewItemText('');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-8 rounded-lg border border-nsw-grey-300 shadow-sm space-y-6 fade-in h-full flex flex-col">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-black text-nsw-blue tracking-tight uppercase">{title}</h2>
        </div>
        <p className="text-sm text-nsw-grey-400 font-medium leading-relaxed">{description}</p>
      </div>

      <div className="flex-grow space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-2 group">
            <textarea
              value={item.text}
              onChange={(e) => onUpdate(item.id, e.target.value)}
              className="flex-grow p-3 bg-white border border-nsw-grey-300 rounded-md font-bold text-base focus:border-nsw-blue focus:ring-1 focus:ring-nsw-blue outline-none transition-all resize-none min-h-[60px]"
            />
            <button
              onClick={() => onRemove(item.id)}
              className="p-2 text-nsw-grey-300 hover:text-nsw-danger transition-colors self-start"
              title={`Remove ${typeLabel}`}
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-nsw-grey-200 mt-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Add a new ${typeLabel.toLowerCase()}...`}
            className="flex-grow p-4 bg-nsw-grey-100 border border-nsw-grey-300 rounded-md font-bold focus:border-nsw-blue focus:ring-1 focus:ring-nsw-blue outline-none transition-all"
          />
          <button
            onClick={handleAdd}
            className="bg-nsw-blue text-white px-6 py-2 rounded-md font-black uppercase tracking-widest hover:bg-nsw-blue-hover transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
