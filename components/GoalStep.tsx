
import React from 'react';

interface GoalStepProps {
  programName: string;
  setProgramName: (name: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
}

export const GoalStep: React.FC<GoalStepProps> = ({ programName, setProgramName, goal, setGoal }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-8 rounded-lg border border-nsw-grey-300 shadow-sm space-y-8 fade-in">
      <div className="space-y-4">
        <label className="block text-lg font-black text-nsw-blue uppercase tracking-widest">
          Program Name
        </label>
        <p className="text-sm text-nsw-grey-400 font-medium">
          A clear, concise name for the program or initiative.
        </p>
        <input
          type="text"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="Enter the name of your program..."
          className="w-full text-lg p-4 border border-nsw-grey-300 rounded-md focus:border-nsw-blue focus:ring-1 focus:ring-nsw-blue outline-none transition-all"
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-nsw-grey-200">
        <label className="block text-lg font-black text-nsw-blue uppercase tracking-widest">
          Program Goal
        </label>
        <p className="text-sm text-nsw-grey-400 font-medium leading-relaxed">
          In one sentence, what is the ultimate goal of this program? (e.g. to increase the capacity and capability of the NSW Clinical Trials workforce)
        </p>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What is the primary overarching goal of this program?"
          className="w-full h-40 text-lg p-4 border border-nsw-grey-300 rounded-md focus:border-nsw-blue focus:ring-1 focus:ring-nsw-blue outline-none transition-all resize-none"
        />
      </div>
    </div>
  );
};
