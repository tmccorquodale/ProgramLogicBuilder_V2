import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ProgramLogic, Aim, Need } from '../types';

interface LogicDiagramProps {
  data: ProgramLogic;
}

export interface LogicDiagramHandle {
  exportImage: () => Promise<void>;
  exportPDF: () => Promise<void>;
}

export const LogicDiagram = forwardRef<LogicDiagramHandle, LogicDiagramProps>(({ data }, ref) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportImage = async () => {
    if (!diagramRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(diagramRef.current, { 
        cacheBust: true, 
        backgroundColor: '#f9fafb',
        pixelRatio: 2 // High quality
      });
      const link = document.createElement('a');
      link.download = `Program_Logic_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!diagramRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(diagramRef.current, { 
        cacheBust: true, 
        backgroundColor: '#f9fafb',
        pixelRatio: 2
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [img.width, img.height]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`Program_Logic_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    exportImage,
    exportPDF
  }));

  const categories = [
    { title: 'Needs', key: 'needs' as const },
    { title: 'Aims', key: 'aims' as const },
    { title: 'Activities', key: 'activities' as const },
    { title: 'Inputs', key: 'inputs' as const },
    { title: 'Outputs', key: 'outputs' as const },
    { title: 'Short Term Impacts', key: 'shortTermImpacts' as const },
    { title: 'Long Term Impacts', key: 'longTermImpacts' as const },
  ];

  return (
    <div className="space-y-4">
      {isExporting && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-2xl border border-nsw-grey-300 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-nsw-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-nsw-blue uppercase tracking-widest text-sm">Preparing Export...</p>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto pb-6">
        <div 
          id="printable-diagram"
          ref={diagramRef} 
          className="min-w-[1600px] p-12 bg-nsw-grey-100 rounded-md border border-nsw-grey-300 shadow-inner"
        >
          {/* Goal Header */}
          <div className="w-full bg-nsw-blue text-white px-10 py-10 rounded-md shadow-xl text-center mb-16 border-t-8 border-white/20">
            <h3 className="text-3xl font-black uppercase tracking-widest mb-4">
              {data.programName || 'Logic Model'}
            </h3>
            <p className="text-xl font-medium opacity-90 max-w-5xl mx-auto italic leading-relaxed">
              {data.goal || 'Not Defined'}
            </p>
          </div>

          {/* Hierarchical Flow - Single Flat Grid for Perfect Alignment */}
          <div 
            className="grid grid-cols-[0.8fr_0.8fr_1.5fr_1fr_1fr_1fr_1fr] gap-x-4 gap-y-3"
            style={{ gridAutoRows: 'min-content' }}
          >
            {/* Headers Row */}
            {categories.map((cat, idx) => (
              <div 
                key={cat.title} 
                className="bg-white p-4 rounded-md shadow-sm border border-nsw-grey-300 text-center sticky top-0 z-20 mb-6"
                style={{ gridRow: 1, gridColumn: idx + 1 }}
              >
                <h4 className="text-[14px] font-black uppercase tracking-wider text-nsw-blue">{cat.title}</h4>
              </div>
            ))}

            {data.needs.length === 0 ? (
              <div className="col-span-7 p-20 text-center text-nsw-grey-400 font-bold italic bg-white rounded-md border border-dashed border-nsw-grey-300">
                No program logic data to display.
              </div>
            ) : (() => {
              const rows: React.ReactNode[] = [];
              let currentRow = 2; // Start after headers

              data.needs.forEach((need: Need) => {
                // Calculate total rows for this need
                const needRows = need.aims.length === 0 ? 1 : need.aims.reduce((acc: number, aim: Aim) => {
                  const maxItems = Math.max(
                    1,
                    aim.activities.length,
                    aim.inputs.length,
                    aim.outputs.length,
                    aim.shortTermImpacts.length,
                    aim.longTermImpacts.length
                  );
                  return acc + maxItems;
                }, 0);

                // Render Need Box
                rows.push(
                  <div 
                    key={`need-${need.id}`}
                    className="col-start-1 bg-white p-5 rounded-md shadow-sm border border-nsw-grey-300 text-[15px] font-bold text-center leading-relaxed flex items-center justify-center text-nsw-blue"
                    style={{ gridRow: `span ${needRows} / span ${needRows}`, gridRowStart: currentRow }}
                  >
                    {need.description}
                  </div>
                );

                if (need.aims.length === 0) {
                  rows.push(
                    <div 
                      key={`no-aim-${need.id}`} 
                      className="col-start-2 col-span-6 p-10 text-center text-nsw-grey-300 italic text-[15px] border border-dashed border-nsw-grey-300 rounded-md bg-nsw-grey-100"
                      style={{ gridRowStart: currentRow }}
                    >
                      No goals/aims defined for this need.
                    </div>
                  );
                  currentRow++;
                } else {
                  need.aims.forEach((aim: Aim) => {
                    const aimMaxItems = Math.max(
                      1,
                      aim.activities.length,
                      aim.inputs.length,
                      aim.outputs.length,
                      aim.shortTermImpacts.length,
                      aim.longTermImpacts.length
                    );

                    // Render Aim Box
                    rows.push(
                      <div 
                        key={`aim-${aim.id}`}
                        className="col-start-2 bg-nsw-blue text-white p-5 rounded-md shadow-sm border border-nsw-blue-hover text-[15px] font-bold text-center leading-relaxed flex items-center justify-center"
                        style={{ gridRow: `span ${aimMaxItems} / span ${aimMaxItems}`, gridRowStart: currentRow }}
                      >
                        {aim.description}
                      </div>
                    );

                    // Render Detail Rows
                    for (let i = 0; i < aimMaxItems; i++) {
                      const detailCols = [
                        { key: 'activities', color: 'bg-white text-nsw-black font-medium border-nsw-grey-300' },
                        { key: 'inputs', color: 'bg-white text-nsw-black font-medium border-nsw-grey-300' },
                        { key: 'outputs', color: 'bg-white text-nsw-black font-medium border-nsw-grey-300' },
                        { key: 'shortTermImpacts', color: 'bg-nsw-blue-light/20 text-nsw-blue font-bold border-nsw-blue/10' },
                        { key: 'longTermImpacts', color: 'bg-nsw-blue-light/20 text-nsw-blue font-bold border-nsw-blue/10' }
                      ];

                      detailCols.forEach((col, colIdx) => {
                        const items = (aim[col.key as keyof Aim] as string[]) || [];
                        const text = items[i];
                        
                        rows.push(
                          <div 
                            key={`detail-${aim.id}-${col.key}-${i}`}
                            className={`col-start-${colIdx + 3} p-4 rounded-md text-[14px] leading-tight flex items-center ${text ? `shadow-sm border ${col.color}` : 'opacity-0'}`}
                            style={{ gridRowStart: currentRow }}
                          >
                            {text || ''}
                          </div>
                        );
                      });
                      currentRow++;
                    }
                  });
                }
              });

              return rows;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
});
