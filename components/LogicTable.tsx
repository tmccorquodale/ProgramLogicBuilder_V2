import React from 'react';
import { ProgramLogic } from '../types';

interface LogicTableProps {
  data: ProgramLogic;
  onJumpTo: (step: 'GOAL' | 'NEEDS' | 'AIMS' | 'DETAILS', needId?: string, aimId?: string) => void;
}

export const LogicTable: React.FC<LogicTableProps> = ({ data, onJumpTo }) => {
  return (
    <div className="w-full overflow-x-auto shadow-lg rounded-md border border-nsw-grey-300 bg-white">
      <table className="w-full border-collapse min-w-[1400px] text-xs">
        <thead>
          <tr className="bg-nsw-blue text-white">
            <th colSpan={7} className="p-6 text-left border-b border-nsw-blue-hover">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-widest text-2xl">
                    {data.programName || 'UNTITLED PROGRAM'}
                  </span>
                  <button onClick={() => onJumpTo('GOAL')} className="bg-white/10 hover:bg-white/20 text-[10px] px-3 py-1.5 rounded-md border border-white/20 uppercase font-bold tracking-wider transition-all">Edit Details</button>
                </div>
                <p className="text-sm font-medium opacity-90 leading-relaxed max-w-5xl italic">
                   {data.goal || 'NOT DEFINED'}
                </p>
              </div>
            </th>
          </tr>
          <tr className="bg-nsw-grey-100 text-nsw-grey-400 font-bold uppercase tracking-wider border-b border-nsw-grey-300">
            <th className="p-4 border-r border-nsw-grey-300 text-left w-[12%]">Needs</th>
            <th className="p-4 border-r border-nsw-grey-300 text-left w-[12%] bg-nsw-blue text-white">Aims</th>
            <th className="p-4 border-r border-nsw-grey-300 text-left w-[15%]">Activities</th>
            <th className="p-4 border-r border-nsw-grey-300 text-left w-[15%]">Inputs</th>
            <th className="p-4 border-r border-nsw-grey-300 text-left w-[15%]">Outputs</th>
            <th className="p-4 border-r border-nsw-grey-300 text-left w-[15%]">Short Term Impacts</th>
            <th className="p-4 text-left w-[16%]">Long Term Impacts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-nsw-grey-300">
          {data.needs.length === 0 ? (
            <tr><td colSpan={7} className="p-20 text-center text-nsw-grey-400 font-medium italic">No program logic data available. Use the wizard or import from Excel.</td></tr>
          ) : data.needs.map((need) => (
            <React.Fragment key={need.id}>
              {need.aims.length === 0 ? (
                <tr className="group">
                  <td className="p-4 border-r border-nsw-grey-300 align-top font-bold bg-nsw-grey-100/50 text-nsw-blue">
                    <div className="flex flex-col gap-2">
                      <span>{need.description}</span>
                      <button onClick={() => onJumpTo('NEEDS')} className="opacity-0 group-hover:opacity-100 text-nsw-danger font-bold uppercase text-[9px] text-left hover:underline">Edit Need</button>
                    </div>
                  </td>
                  <td colSpan={6} className="p-10 text-center text-nsw-grey-400 font-medium italic">No goals defined for this need. <button onClick={() => onJumpTo('AIMS', need.id)} className="text-nsw-blue font-bold hover:underline ml-2">Add Aims</button></td>
                </tr>
              ) : need.aims.map((aim, aIdx) => (
                <tr key={aim.id} className="hover:bg-nsw-grey-100/30 transition-colors group">
                  {aIdx === 0 && (
                    <td className="p-4 border-r border-nsw-grey-300 align-top font-bold bg-nsw-grey-100/20 text-nsw-blue" rowSpan={need.aims.length}>
                      <div className="flex flex-col gap-2">
                        <span className="leading-relaxed">{need.description}</span>
                        <button onClick={() => onJumpTo('NEEDS')} className="opacity-0 group-hover:opacity-100 text-nsw-danger font-bold uppercase text-[9px] text-left hover:underline">Edit</button>
                      </div>
                    </td>
                  )}
                  <td className="p-4 border-r border-nsw-grey-300 align-top bg-nsw-blue-light">
                    <div className="flex flex-col gap-2">
                      <span className="font-bold text-nsw-blue leading-tight">{aim.description}</span>
                      <button onClick={() => onJumpTo('AIMS', need.id)} className="opacity-0 group-hover:opacity-100 text-nsw-danger font-bold uppercase text-[9px] text-left hover:underline">Edit</button>
                    </div>
                  </td>
                  <td className="p-4 border-r border-nsw-grey-300 align-top bg-white relative">
                     <ul className="list-disc ml-4 space-y-1 text-nsw-black font-medium">
                       {aim.activities.map((it: any, i: number) => <li key={i}>{it.text}</li>)}
                     </ul>
                     <button onClick={() => onJumpTo('DETAILS', need.id, aim.id)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-nsw-blue-light text-nsw-blue p-1 rounded-md border border-nsw-blue/10 hover:bg-nsw-blue hover:text-white transition-all shadow-sm">✏️</button>
                  </td>
                  <td className="p-4 border-r border-nsw-grey-300 align-top bg-white relative">
                     <ul className="list-disc ml-4 space-y-1 text-nsw-black font-medium">
                       {aim.inputs.map((it: any, i: number) => <li key={i}>{it.text}</li>)}
                     </ul>
                     <button onClick={() => onJumpTo('DETAILS', need.id, aim.id)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-nsw-blue-light text-nsw-blue p-1 rounded-md border border-nsw-blue/10 hover:bg-nsw-blue hover:text-white transition-all shadow-sm">✏️</button>
                  </td>
                  <td className="p-4 border-r border-nsw-grey-300 align-top bg-white relative">
                     <ul className="list-disc ml-4 space-y-1 text-nsw-black font-medium">
                       {aim.outputs.map((it: any, i: number) => <li key={i}>{it.text}</li>)}
                     </ul>
                     <button onClick={() => onJumpTo('DETAILS', need.id, aim.id)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-nsw-blue-light text-nsw-blue p-1 rounded-md border border-nsw-blue/10 hover:bg-nsw-blue hover:text-white transition-all shadow-sm">✏️</button>
                  </td>
                  <td className="p-4 border-r border-nsw-grey-300 align-top bg-nsw-blue-light/20 relative">
                     <ul className="list-disc ml-4 space-y-1 text-nsw-blue font-bold">
                       {aim.shortTermImpacts.map((it: any, i: number) => <li key={i}>{it.text}</li>)}
                     </ul>
                     <button onClick={() => onJumpTo('DETAILS', need.id, aim.id)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-nsw-blue text-white p-1 rounded-md transition-all shadow-md">✏️</button>
                  </td>
                  <td className="p-4 align-top bg-nsw-blue-light/20 relative">
                     <ul className="list-disc ml-4 space-y-1 text-nsw-blue font-bold">
                       {aim.longTermImpacts.map((it: any, i: number) => <li key={i}>{it.text}</li>)}
                     </ul>
                     <button onClick={() => onJumpTo('DETAILS', need.id, aim.id)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-nsw-blue text-white p-1 rounded-md transition-all shadow-md">✏️</button>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
