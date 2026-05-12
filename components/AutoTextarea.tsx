import React, { useRef, useEffect } from 'react';

export type AutoTextareaProps = {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  minHeight?: string;
};

export const AutoTextarea: React.FC<AutoTextareaProps> = ({ 
  value, 
  onChange, 
  className, 
  placeholder,
  minHeight = '60px'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const target = textareaRef.current;
    if (target) {
      target.style.height = 'inherit';
      target.style.height = `${target.scrollHeight}px`;
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
      onInput={adjustHeight}
      placeholder={placeholder}
      className={`${className} overflow-hidden resize-none`}
      style={{ minHeight }}
      rows={1}
    />
  );
};

export default AutoTextarea;
