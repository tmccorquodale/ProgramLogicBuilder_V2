import React from 'react';
import { StepType } from '../types';

interface StepIndicatorProps {
  currentStep: StepType;
  onStepClick: (step: StepType) => void;
}

const STEPS: { id: StepType; label: string; icon: string }[] = [
  { id: 'GOAL', label: 'Goal', icon: 'flag' },
  { id: 'NEEDS', label: 'Needs', icon: 'crisis_alert' },
  { id: 'AIMS', label: 'Aims', icon: 'target' },
  { id: 'DETAILS', label: 'Details', icon: 'list_alt' },
  { id: 'REVIEW', label: 'Review', icon: 'preview' }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-md border border-nsw-grey-300 shadow-sm overflow-x-auto">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const iconColor = isActive ? 'bg-nsw-blue text-white' : 'bg-nsw-grey-100 text-nsw-grey-400';
        const labelColor = isActive ? 'text-nsw-blue font-black' : 'text-nsw-grey-400 font-bold';

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onStepClick(step.id)}
              className="flex flex-col items-center gap-2 group transition-all min-w-[80px]"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${iconColor} group-hover:scale-110`}>
                <span className="material-symbols-outlined text-xl">{step.icon}</span>
              </div>
              <span className={`text-[10px] uppercase tracking-widest ${labelColor}`}>
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] bg-nsw-grey-200 mx-4 mt-[-20px] hidden sm:block"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
