export interface LogicItem {
  id: string;
  text: string;
  span?: number;
}

export interface Aim {
  id: string;
  description: string;
  inputs: LogicItem[];
  activities: LogicItem[];
  outputs: LogicItem[];
  shortTermImpacts: LogicItem[];
  longTermImpacts: LogicItem[];
}

export interface Need {
  id: string;
  description: string;
  aims: Aim[];
}

export interface ProgramLogic {
  programName: string;
  goal: string;
  needs: Need[];
}

export type StepType = 'GOAL' | 'NEEDS' | 'AIMS' | 'DETAILS' | 'REVIEW';
