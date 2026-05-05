import React from 'react';
import { StepType } from '../src/types';

interface StepIndicatorProps {
  currentStep: StepType;
  onStepClick: (step: StepType) => void;
}

const steps: { key: StepType; label: string }[] = [
  { key: 'GOAL', label: '1. Goal' },
  { key: 'NEEDS', label: '2. Needs' },
  { key: 'AIMS', label: '3. Aims' },
  { key: 'DETAILS', label: '4. Logic Details' },
  { key: 'REVIEW', label: '5. Review' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="flex items-center justify-between mb-16 px-4 max-w-4xl mx-auto overflow-x-auto pt-6 pb-10 no-scrollbar">
      {steps.map((step, index) => {
        const stepIndex = steps.findIndex(s => s.key === currentStep);
        const isActive = step.key === currentStep;
        const isPast = stepIndex > index;

        return (
          <React.Fragment key={step.key}>
            <button 
              onClick={() => onStepClick(step.key)}
              className="flex flex-col items-center group relative transition-all duration-300 outline-none focus:ring-0"
              aria-label={`Navigate to ${step.label}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110 active:scale-95 ${
                isActive ? 'bg-nsw-blue border-nsw-blue text-white ring-4 ring-nsw-teal/30' : 
                isPast ? 'bg-nsw-teal border-nsw-teal text-white hover:bg-nsw-blue hover:text-white' : 
                'bg-white border-nsw-grey-300 text-nsw-grey-400 group-hover:border-nsw-blue group-hover:text-nsw-blue'
              }`}>
                {isPast ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="font-black text-sm">{index + 1}</span>
                )}
              </div>
              <span className={`absolute -bottom-7 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${
                isActive ? 'text-nsw-blue font-bold' : isPast ? 'text-nsw-teal font-bold' : 'text-nsw-grey-400 group-hover:text-nsw-blue'
              }`}>
                {step.label.split('. ')[1]}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 min-w-[30px] transition-colors duration-700 ${isPast ? 'bg-nsw-teal' : 'bg-nsw-grey-300'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
