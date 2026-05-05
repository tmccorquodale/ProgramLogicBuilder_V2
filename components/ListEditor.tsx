import React, { useState, useRef, useEffect } from 'react';

interface ListEditorProps {
  title: string;
  description: string;
  items: { id: string; text: string }[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  typeLabel: string;
}

const AutoResizeTextArea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`w-full bg-transparent resize-none overflow-hidden transition-all duration-200 focus:outline-none ${className}`}
    />
  );
};

export const ListEditor: React.FC<ListEditorProps> = ({ 
  title, description, items, onAdd, onRemove, onUpdate, typeLabel
}) => {
  const [newText, setNewText] = useState('');

  const handleAdd = () => {
    if (newText.trim()) {
      onAdd(newText);
      setNewText('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-md border border-nsw-grey-300 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-nsw-blue mb-1">{title}</h2>
            <p className="text-sm text-nsw-grey-400 font-medium">{description}</p>
          </div>
        </div>

        <div className="space-y-3 mb-8 mt-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="group flex items-start gap-4 p-4 bg-white rounded-md border border-nsw-grey-300 hover:border-nsw-blue hover:shadow-md transition-all sm:flex-row flex-col"
            >
              <div className="mt-2.5 w-2 h-2 rounded-full bg-nsw-blue-light flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <AutoResizeTextArea
                  className="text-nsw-black leading-relaxed font-medium text-sm"
                  value={item.text}
                  onChange={(val) => onUpdate(item.id, val)}
                  placeholder="Enter text here..."
                />
              </div>
              <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button 
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-nsw-danger hover:bg-nsw-danger/10 rounded-md transition-colors border border-transparent hover:border-nsw-danger/20"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-10 border border-dashed border-nsw-grey-300 rounded-md text-center text-nsw-grey-400 italic text-sm bg-nsw-grey-100">
              No {typeLabel.toLowerCase()}s added yet.
            </div>
          )}
        </div>

        <div className="flex gap-3 sm:flex-row flex-col">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Add a new ${typeLabel.toLowerCase()}...`}
            className="flex-1 p-3 bg-white border border-nsw-grey-300 rounded-md focus:border-nsw-blue focus:ring-1 focus:ring-nsw-blue outline-none transition-all text-sm font-medium"
          />
          <button 
            onClick={handleAdd}
            className="px-8 py-3 bg-nsw-blue text-white font-bold rounded-md hover:bg-nsw-blue-hover transition-all shadow-md active:scale-95 text-sm uppercase tracking-wider"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
