import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ProgramLogic, Aim, Need } from '../types';

interface LogicDiagramProps {
  data: ProgramLogic;
  onUpdate?: (newData: ProgramLogic) => void;
}

export interface LogicDiagramHandle {
  exportImage: () => Promise<void>;
  exportPDF: () => Promise<void>;
}

export const LogicDiagram = forwardRef<LogicDiagramHandle, LogicDiagramProps>(({ data, onUpdate }, ref) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const exportImage = async () => {
    if (!diagramRef.current) return;
    setIsExporting(true);
    const prevControlsState = showControls;
    setShowControls(false); // Hide controls for export
    
    // Tiny delay to ensure React renders without controls
    await new Promise(r => setTimeout(r, 50));

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
      setShowControls(prevControlsState);
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!diagramRef.current) return;
    setIsExporting(true);
    const prevControlsState = showControls;
    setShowControls(false); // Hide controls for export
    
    // Tiny delay to ensure React renders without controls
    await new Promise(r => setTimeout(r, 50));

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
      setShowControls(prevControlsState);
      setIsExporting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    exportImage,
    exportPDF
  }));

  const handleMoveNeed = (index: number, direction: 'up' | 'down') => {
    if (!onUpdate) return;
    const newNeeds = [...data.needs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newNeeds.length) return;
    [newNeeds[index], newNeeds[targetIndex]] = [newNeeds[targetIndex], newNeeds[index]];
    onUpdate({ ...data, needs: newNeeds });
  };

  const handleMoveAim = (needIndex: number, aimIndex: number, direction: 'up' | 'down') => {
    if (!onUpdate) return;
    const newNeeds = [...data.needs];
    const newAims = [...newNeeds[needIndex].aims];
    const targetIndex = direction === 'up' ? aimIndex - 1 : aimIndex + 1;
    if (targetIndex < 0 || targetIndex >= newAims.length) return;
    [newAims[aimIndex], newAims[targetIndex]] = [newAims[targetIndex], newAims[aimIndex]];
    newNeeds[needIndex] = { ...newNeeds[needIndex], aims: newAims };
    onUpdate({ ...data, needs: newNeeds });
  };

  const handleMoveItem = (needIndex: number, aimIndex: number, field: keyof Aim, itemId: string, direction: 'up' | 'down') => {
    if (!onUpdate) return;
    const newNeeds = [...data.needs];
    const newAim = { ...newNeeds[needIndex].aims[aimIndex] };
    const items = [...(newAim[field] as any[])];
    const itemIndex = items.findIndex(it => it.id === itemId);
    if (itemIndex === -1) return;
    
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
    (newAim[field] as any[]) = items;
    
    const newAims = [...newNeeds[needIndex].aims];
    newAims[aimIndex] = newAim;
    newNeeds[needIndex] = { ...newNeeds[needIndex], aims: newAims };
    onUpdate({ ...data, needs: newNeeds });
  };

  const handleSpanChange = (needIndex: number, aimIndex: number, field: keyof Aim, itemId: string, delta: number) => {
    if (!onUpdate) return;
    const newNeeds = [...data.needs];
    const newAim = { ...newNeeds[needIndex].aims[aimIndex] };
    
    const getColTotalRows = (f: keyof Aim) => {
      const items = (newAim[f] as any[]) || [];
      return items.reduce((sum, item) => sum + (item.span || 1), 0);
    };

    const currentHeight = getColTotalRows(field);
    const detailCols = ['activities', 'inputs', 'outputs', 'shortTermImpacts', 'longTermImpacts'] as (keyof Aim)[];
    const otherColsHeights = detailCols
      .filter(f => f !== field)
      .map(f => getColTotalRows(f));
    const maxOtherHeight = Math.max(1, ...otherColsHeights);

    const items = [...(newAim[field] as any[])];
    const itemIndex = items.findIndex(it => it.id === itemId);
    if (itemIndex === -1) return;
    
    const currentItemSpan = items[itemIndex].span || 1;
    const newSpan = currentItemSpan + delta;

    if (newSpan < 1) return;
    
    // Constraint: Do not allow increasing the span if it would push the Aim's total height 
    // beyond what is already defined by the tallest other column in the same Aim.
    if (delta > 0 && currentHeight >= maxOtherHeight) {
      return; 
    }

    items[itemIndex] = { ...items[itemIndex], span: newSpan };
    (newAim[field] as any[]) = items;
    
    const newAims = [...newNeeds[needIndex].aims];
    newAims[aimIndex] = newAim;
    newNeeds[needIndex] = { ...newNeeds[needIndex], aims: newAims };
    onUpdate({ ...data, needs: newNeeds });
  };

  const ControlButtons = ({ onUp, onDown, onPlus, onMinus, isFirst, isLast, isPlusDisabled, isMinusDisabled, vertical = false, horizontal = false }: { 
    onUp?: () => void, 
    onDown?: () => void,
    onPlus?: () => void,
    onMinus?: () => void,
    isFirst?: boolean, 
    isLast?: boolean,
    isPlusDisabled?: boolean,
    isMinusDisabled?: boolean,
    vertical?: boolean,
    horizontal?: boolean
  }) => {
    if (!showControls) return null;
    return (
      <div className={`flex ${vertical ? 'flex-col -translate-x-full pr-1' : 'flex-row -translate-y-full pb-1'} absolute items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30`}>
        {onUp && (
          <button 
            onClick={(e) => { e.stopPropagation(); onUp(); }} 
            disabled={isFirst}
            className="bg-white text-nsw-blue hover:bg-nsw-blue hover:text-white p-1 rounded-full shadow-md border border-nsw-grey-200 disabled:opacity-0 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_{vertical ? 'upward' : 'back'}</span>
          </button>
        )}
        {onDown && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDown(); }} 
            disabled={isLast}
            className="bg-white text-nsw-blue hover:bg-nsw-blue hover:text-white p-1 rounded-full shadow-md border border-nsw-grey-200 disabled:opacity-0 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_{vertical ? 'downward' : 'forward'}</span>
          </button>
        )}
        {onPlus && (
          <button 
            onClick={(e) => { e.stopPropagation(); onPlus(); }} 
            disabled={isPlusDisabled}
            title={isPlusDisabled ? "Locked: Cannot extend beyond Aim boundaries" : "Increase Span"}
            className="bg-white text-nsw-teal hover:bg-nsw-teal hover:text-white p-1 rounded-full shadow-md border border-nsw-grey-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
          </button>
        )}
        {onMinus && (
          <button 
            onClick={(e) => { e.stopPropagation(); onMinus(); }} 
            disabled={isMinusDisabled}
            title="Decrease Span"
            className="bg-white text-nsw-danger hover:bg-nsw-danger hover:text-white p-1 rounded-full shadow-md border border-nsw-grey-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">remove</span>
          </button>
        )}
      </div>
    );
  };

  const handleResetLayout = () => {
    if (!onUpdate) return;
    if (!confirm("This will reset all box sizes (spans) back to their default size. Continue?")) return;
    
    const newNeeds = data.needs.map((need: Need) => ({
      ...need,
      aims: need.aims.map((aim: Aim) => ({
        ...aim,
        activities: (aim.activities || []).map(i => ({ ...i, span: 1 })),
        inputs: (aim.inputs || []).map(i => ({ ...i, span: 1 })),
        outputs: (aim.outputs || []).map(i => ({ ...i, span: 1 })),
        shortTermImpacts: (aim.shortTermImpacts || []).map(i => ({ ...i, span: 1 })),
        longTermImpacts: (aim.longTermImpacts || []).map(i => ({ ...i, span: 1 }))
      }))
    }));
    
    onUpdate({ ...data, needs: newNeeds });
  };

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

      {onUpdate && (
        <div className="flex items-center justify-end px-2 gap-3">
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-nsw-grey-300 shadow-sm hover:bg-nsw-danger/5 hover:border-nsw-danger/50 hover:text-nsw-danger transition-all group"
          >
            <span className="material-symbols-outlined text-[14px] text-nsw-grey-400 group-hover:text-nsw-danger">settings_backup_restore</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-nsw-grey-400 group-hover:text-nsw-danger">Reset Layout</span>
          </button>
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-nsw-grey-300 shadow-sm hover:bg-nsw-grey-50 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-wider text-nsw-grey-400">Reordering Controls</span>
            <input 
              type="checkbox" 
              checked={showControls} 
              onChange={(e) => setShowControls(e.target.checked)} 
              className="w-4 h-4 rounded border-nsw-grey-300 text-nsw-blue focus:ring-nsw-blue"
            />
          </label>
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

              data.needs.forEach((need: Need, needIdx: number) => {
                // Calculate total rows for this need
                const needRows = need.aims.length === 0 ? 1 : need.aims.reduce((acc: number, aim: Aim) => {
                  const getColTotalRows = (field: keyof Aim) => {
                    const items = (aim[field] as any[]) || [];
                    return items.reduce((sum, item) => sum + (item.span || 1), 0);
                  };

                  const maxItems = Math.max(
                    1,
                    getColTotalRows('activities'),
                    getColTotalRows('inputs'),
                    getColTotalRows('outputs'),
                    getColTotalRows('shortTermImpacts'),
                    getColTotalRows('longTermImpacts')
                  );
                  return acc + maxItems;
                }, 0);

                // Render Need Box
                rows.push(
                  <div 
                    key={`need-${need.id}`}
                    className="col-start-1 bg-white p-5 rounded-md shadow-sm border border-nsw-grey-300 text-[15px] font-bold text-center leading-relaxed flex items-center justify-center text-nsw-blue relative group"
                    style={{ gridRow: `span ${needRows} / span ${needRows}`, gridRowStart: currentRow }}
                  >
                    <ControlButtons 
                      vertical 
                      onUp={() => handleMoveNeed(needIdx, 'up')} 
                      onDown={() => handleMoveNeed(needIdx, 'down')} 
                      isFirst={needIdx === 0} 
                      isLast={needIdx === data.needs.length - 1} 
                    />
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
                  need.aims.forEach((aim: Aim, aimIdx: number) => {
                    const getColTotalRows = (field: keyof Aim) => {
                      const items = (aim[field] as any[]) || [];
                      return items.reduce((sum, item) => sum + (item.span || 1), 0);
                    };

                    const aimMaxItems = Math.max(
                      1,
                      getColTotalRows('activities'),
                      getColTotalRows('inputs'),
                      getColTotalRows('outputs'),
                      getColTotalRows('shortTermImpacts'),
                      getColTotalRows('longTermImpacts')
                    );

                    // Render Aim Box
                    rows.push(
                      <div 
                        key={`aim-${aim.id}`}
                        className="col-start-2 bg-nsw-blue text-white p-5 rounded-md shadow-sm border border-nsw-blue-hover text-[15px] font-bold text-center leading-relaxed flex items-center justify-center relative group"
                        style={{ gridRow: `span ${aimMaxItems} / span ${aimMaxItems}`, gridRowStart: currentRow }}
                      >
                        <ControlButtons 
                          vertical 
                          onUp={() => handleMoveAim(needIdx, aimIdx, 'up')} 
                          onDown={() => handleMoveAim(needIdx, aimIdx, 'down')} 
                          isFirst={aimIdx === 0} 
                          isLast={aimIdx === need.aims.length - 1} 
                        />
                        {aim.description}
                      </div>
                    );

                    // Render Detail Rows for each category
                    const detailCols = [
                      { key: 'activities', color: 'bg-white text-nsw-black font-medium border-nsw-grey-300' },
                      { key: 'inputs', color: 'bg-white text-nsw-black font-medium border-nsw-grey-300' },
                      { key: 'outputs', color: 'bg-white text-nsw-black font-medium border-nsw-grey-300' },
                      { key: 'shortTermImpacts', color: 'bg-nsw-blue-light/20 text-nsw-blue font-bold border-nsw-blue/10' },
                      { key: 'longTermImpacts', color: 'bg-nsw-blue-light/20 text-nsw-blue font-bold border-nsw-blue/10' }
                    ];

                    detailCols.forEach((col, colIdx) => {
                      const items = (aim[col.key as keyof Aim] as any[]) || [];
                      let itemCurrentRow = currentRow;
                      
                      items.forEach((item, i) => {
                        const itemSpan = item.span || 1;
                        const currentColTotal = items.reduce((sum, it) => sum + (it.span || 1), 0);
                        const otherHeights = detailCols
                          .filter(c => c.key !== col.key)
                          .map(c => getColTotalRows(c.key as keyof Aim));
                        const maxOther = Math.max(1, ...otherHeights);

                        rows.push(
                          <div 
                            key={`detail-${aim.id}-${col.key}-${item.id}`}
                            className={`p-4 rounded-md text-[14px] leading-tight flex items-center relative group shadow-sm border ${col.color}`}
                            style={{ 
                              gridRow: `span ${itemSpan} / span ${itemSpan}`,
                              gridRowStart: itemCurrentRow,
                              gridColumnStart: colIdx + 3
                            }}
                          >
                            <ControlButtons 
                              vertical 
                              onUp={() => handleMoveItem(needIdx, aimIdx, col.key as keyof Aim, item.id, 'up')} 
                              onDown={() => handleMoveItem(needIdx, aimIdx, col.key as keyof Aim, item.id, 'down')} 
                              onPlus={() => handleSpanChange(needIdx, aimIdx, col.key as keyof Aim, item.id, 1)}
                              onMinus={() => handleSpanChange(needIdx, aimIdx, col.key as keyof Aim, item.id, -1)}
                              isFirst={i === 0} 
                              isLast={i === items.length - 1} 
                              isPlusDisabled={currentColTotal >= maxOther}
                              isMinusDisabled={itemSpan <= 1}
                            />
                            {item.text}
                          </div>
                        );
                        itemCurrentRow += itemSpan;
                      });

                      // Optional: Render placeholder for empty space in columns shorter than aimMaxItems
                      const currentColRows = items.reduce((sum, item) => sum + (item.span || 1), 0);
                      if (currentColRows < aimMaxItems) {
                        rows.push(
                          <div 
                            key={`placeholder-${aim.id}-${col.key}`}
                            className="opacity-0"
                            style={{ 
                              gridRow: `span ${aimMaxItems - currentColRows} / span ${aimMaxItems - currentColRows}`,
                              gridRowStart: itemCurrentRow,
                              gridColumnStart: colIdx + 3
                            }}
                          />
                        );
                      }
                    });

                    currentRow += aimMaxItems;
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
