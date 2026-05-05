import React, { useRef, useEffect } from 'react';

interface GoalStepProps {
  programName: string;
  setProgramName: (name: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
}

export const GoalStep: React.FC<GoalStepProps> = ({ programName, setProgramName, goal, setGoal }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [goal]);

  return (
    <div className="max-w-4xl mx-auto py-10 fade-in">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-md border border-nsw-grey-300 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-nsw-blue" />
        
        <div className="mb-12">
          <label className="block text-sm font-bold text-nsw-blue uppercase tracking-widest mb-3">Program Name</label>
          <input
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="e.g. NSW Clinical Trials Capacity Building Program"
            className="w-full p-4 text-2xl font-bold border-b border-nsw-grey-300 focus:border-nsw-blue transition-all outline-none bg-transparent placeholder:text-nsw-grey-300 text-nsw-black"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-nsw-blue uppercase tracking-widest mb-3">Overarching Goal / Vision</label>
          <p className="text-nsw-grey-400 mb-6 text-base font-medium leading-relaxed">
            In one sentence, what is the ultimate goal of this program? (e.g. to increase the capacity and capability of the NSW Clinical Trials workforce)
          </p>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. To reduce healthcare inequality by providing affordable diagnostic tools to rural communities..."
              className="w-full min-h-[150px] p-6 text-xl font-medium border border-nsw-grey-300 rounded-md focus:ring-4 focus:ring-nsw-blue/5 focus:border-nsw-blue transition-all outline-none resize-none bg-nsw-grey-100/50 focus:bg-white placeholder:text-nsw-grey-300 text-nsw-black"
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-bold text-nsw-grey-300 uppercase tracking-widest pointer-events-none">
              Goal Definition
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
