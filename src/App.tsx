import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ProgramLogic, StepType, Need, Aim } from './types';
import { StepIndicator } from './components/StepIndicator';
import { GoalStep } from './components/GoalStep';
import { ListEditor } from './components/ListEditor';
import { LogicTable } from './components/LogicTable';
import { LogicDiagram, LogicDiagramHandle } from './components/LogicDiagram';
import { Background } from './components/Background';

const STORAGE_KEY = 'logic_builder_data_standalone_v2';

const initialLogic: ProgramLogic = {
  programName: '',
  goal: '',
  needs: []
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<StepType>('GOAL');
  const [logic, setLogic] = useState<ProgramLogic>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialLogic;
  });
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [selectedAimId, setSelectedAimId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'TABLE' | 'DIAGRAM'>('TABLE');
  const diagramRef = React.useRef<LogicDiagramHandle>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logic));
  }, [logic]);

  const updateLogic = (updater: (prev: ProgramLogic) => ProgramLogic) => {
    setLogic(prev => updater(prev));
  };

  const nextStep = () => {
    if (currentStep === 'GOAL') setCurrentStep('NEEDS');
    else if (currentStep === 'NEEDS') {
      if (logic.needs.length > 0) {
        if (!selectedNeedId) setSelectedNeedId(logic.needs[0].id);
        setCurrentStep('AIMS');
      } else {
        alert("Please add at least one need.");
      }
    } else if (currentStep === 'AIMS') {
      const allNeedsHaveAims = logic.needs.every(n => n.aims.length > 0);
      if (allNeedsHaveAims) {
        let targetNeed = logic.needs.find(n => n.id === selectedNeedId);
        if (!targetNeed) {
          targetNeed = logic.needs[0];
          setSelectedNeedId(targetNeed.id);
        }
        
        if (!selectedAimId || !targetNeed.aims.find(a => a.id === selectedAimId)) {
          setSelectedAimId(targetNeed.aims[0].id);
        }
        setCurrentStep('DETAILS');
      } else {
        alert("Each need must have at least one aim before proceeding.");
      }
    } else if (currentStep === 'DETAILS') {
      setCurrentStep('REVIEW');
    }
  };

  const prevStep = () => {
    if (currentStep === 'NEEDS') setCurrentStep('GOAL');
    else if (currentStep === 'AIMS') setCurrentStep('NEEDS');
    else if (currentStep === 'DETAILS') setCurrentStep('AIMS');
    else if (currentStep === 'REVIEW') setCurrentStep('DETAILS');
  };

  const jumpTo = (step: StepType, needId?: string, aimId?: string) => {
    setCurrentStep(step);
    if (needId) setSelectedNeedId(needId);
    if (aimId) setSelectedAimId(aimId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      try {
        const importedGoal = data[0]?.[1] || '';
        const importedNeeds: Need[] = [];
        
        for (let i = 4; i < data.length; i++) {
          const [needTxt, aimTxt, actTxt, inpTxt, outTxt, shortTxt, longTxt] = data[i];
          if (!needTxt && !aimTxt) continue;

          let targetNeed = importedNeeds[importedNeeds.length - 1];
          if (needTxt || !targetNeed) {
            targetNeed = { id: crypto.randomUUID(), description: needTxt || 'Unspecified Need', aims: [] };
            importedNeeds.push(targetNeed);
          }

          if (aimTxt) {
            targetNeed.aims.push({
              id: crypto.randomUUID(),
              description: aimTxt,
              activities: actTxt ? (typeof actTxt === 'string' ? actTxt.split('\n') : [actTxt.toString()]) : [],
              inputs: inpTxt ? (typeof inpTxt === 'string' ? inpTxt.split('\n') : [inpTxt.toString()]) : [],
              outputs: outTxt ? (typeof outTxt === 'string' ? outTxt.split('\n') : [outTxt.toString()]) : [],
              shortTermImpacts: shortTxt ? (typeof shortTxt === 'string' ? shortTxt.split('\n') : [shortTxt.toString()]) : [],
              longTermImpacts: longTxt ? (typeof longTxt === 'string' ? longTxt.split('\n') : [longTxt.toString()]) : []
            });
          }
        }

        setLogic({ programName: '', goal: importedGoal, needs: importedNeeds });
        alert("Excel data imported successfully!");
      } catch (err) {
        alert("Error parsing Excel. Use the exported template format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Program Logic');

    // 1. Program Name & Goal Row
    const titleRow = worksheet.addRow([logic.programName || 'UNTITLED PROGRAM']);
    worksheet.mergeCells('A1:G1');
    titleRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002664' } };
    titleRow.height = 40;
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

    const goalRow = worksheet.addRow([logic.goal || 'NOT DEFINED']);
    worksheet.mergeCells('A2:G2');
    goalRow.font = { italic: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    goalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002664' } };
    goalRow.height = 30;
    goalRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 2. Headers
    const headers = ['Needs', 'Aims', 'Activities', 'Inputs', 'Outputs', 'Short Term Impacts', 'Long Term Impacts'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FF6B7280' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    headerRow.height = 30;
    headerRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    // 3. Data Rows
    let currentRow = 4;

    if (logic.needs.length === 0) {
      const emptyRow = worksheet.addRow(['Upload an Excel file or use the wizard to build your logic.', '', '', '', '', '', '']);
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      emptyRow.font = { italic: true, color: { argb: 'FF9CA3AF' } };
      emptyRow.alignment = { vertical: 'middle', horizontal: 'center' };
      emptyRow.height = 60;
    } else {
      logic.needs.forEach((need) => {
        const startRow = currentRow;

        if (need.aims.length === 0) {
          const row = worksheet.addRow([need.description, 'No Aims defined.', '', '', '', '', '']);
          worksheet.mergeCells(`B${currentRow}:G${currentRow}`);
          row.alignment = { vertical: 'top', wrapText: true, indent: 1 };
          row.getCell(1).font = { bold: true };
          row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
          row.getCell(2).font = { italic: true, color: { argb: 'FF9CA3AF' } };
          currentRow++;
        } else {
          need.aims.forEach((aim, aIdx) => {
            const row = worksheet.addRow([
              aIdx === 0 ? need.description : '',
              aim.description,
              aim.activities.map(a => `• ${a}`).join('\n'),
              aim.inputs.map(i => `• ${i}`).join('\n'),
              aim.outputs.map(o => `• ${o}`).join('\n'),
              aim.shortTermImpacts.map(s => `• ${s}`).join('\n'),
              aim.longTermImpacts.map(l => `• ${l}`).join('\n')
            ]);

            row.alignment = { vertical: 'top', wrapText: true, indent: 1 };
            
            // Need column styling
            const needCell = row.getCell(1);
            needCell.font = { bold: true };
            needCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };

            // Aim column styling
            const aimCell = row.getCell(2);
            aimCell.font = { bold: true, color: { argb: 'FF002664' } };

            // Short Term Impacts styling
            const stCell = row.getCell(6);
            stCell.font = { color: { argb: 'FF002664' } };
            stCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4FAFD' } };

            // Long Term Impacts styling
            const ltCell = row.getCell(7);
            ltCell.font = { bold: true, color: { argb: 'FF002664' } };
            ltCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4FAFD' } };

            currentRow++;
          });
        }

        // Merge Need cells if there are multiple aims
        if (need.aims.length > 1) {
          worksheet.mergeCells(`A${startRow}:A${currentRow - 1}`);
        }
      });
    }

    // Set column widths
    worksheet.columns = [
      { width: 25 }, // Needs
      { width: 25 }, // Aims
      { width: 30 }, // Inputs
      { width: 35 }, // Activities
      { width: 35 }, // Outputs
      { width: 35 }, // Short Term
      { width: 35 }  // Long Term
    ];

    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    // Generate and save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Program_Logic_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadAll = async () => {
    // Start Excel download
    await exportToExcel();
    
    // Start Image and PDF downloads if in DIAGRAM mode, or briefly switch to DIAGRAM mode if needed
    // However, it's better to just ensure we can call them even if not visible if the ref is stable
    // But standard React pattern is that refs are null if not rendered.
    // If we're in TABLE view, we might need a hidden LogicDiagram to do this, or just warn/switch.
    // The user said "if you're on table view you see the 'Download Excel' button and if you're in diagram view you see 'Download Image' and 'Download PDF'"
    // But the footer button downloads ALL 3.
    // To download all 3, we need the diagram to be rendered at least once.
    
    if (viewMode === 'DIAGRAM' && diagramRef.current) {
      await diagramRef.current.exportImage();
      await diagramRef.current.exportPDF();
    } else {
      // If we are in TABLE view, we can temporarily switch or just download Excel.
      // But the request says "download all 3". 
      // I'll make the Diagram render hidden if needed or just switch.
      // Easiest is to switch to DIAGRAM, trigger downloads, then switch back if they really want.
      // But better yet: Render both but hide one.
      alert("Preparing all formats (Excel, Image, PDF). Please stay on this page.");
      const currentMode = viewMode;
      if (currentMode === 'TABLE') {
        setViewMode('DIAGRAM');
        // Give it a tiny bit of time to render
        setTimeout(async () => {
          if (diagramRef.current) {
            await diagramRef.current.exportImage();
            await diagramRef.current.exportPDF();
            setViewMode('TABLE');
          }
        }, 100);
      } else if (diagramRef.current) {
        await diagramRef.current.exportImage();
        await diagramRef.current.exportPDF();
      }
    }
  };

  const handleCellUpdate = (needId: string, aimId: string, field: keyof Aim, value: string | string[]) => {
    updateLogic(l => ({
      ...l,
      needs: l.needs.map(n => n.id === needId ? {
        ...n,
        aims: n.aims.map(a => a.id === aimId ? { ...a, [field]: value } : a)
      } : n)
    }));
  };

  const currentNeed = logic.needs.find(n => n.id === selectedNeedId);
  const currentAim = currentNeed?.aims.find(a => a.id === selectedAimId);

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Background />
      {/* NSW Government Masterbrand Header */}
      <header className="bg-white border-t-4 border-nsw-blue shadow-sm py-4">
        <div className="container mx-auto px-4 max-w-[95%]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col">
              <a 
                href="https://medicalresearch.nsw.gov.au/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-nsw-grey-400 font-bold text-xs uppercase tracking-tight hover:text-nsw-blue transition-colors"
              >
                Office for Health and Medical Research
              </a>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-nsw-grey-100 hover:bg-nsw-grey-200 px-4 py-2 rounded-md border border-nsw-grey-300 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 text-nsw-blue">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Import Excel
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
              </label>
              <button 
                onClick={() => { if(confirm("Clear all current data?")) setLogic(initialLogic); }}
                className="bg-white hover:bg-nsw-danger/5 border border-nsw-danger text-nsw-danger px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-nsw-blue/90 backdrop-blur-md py-6">
        <div className="container mx-auto px-4 max-w-[95%]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-white inline-block -scale-x-100">square_foot</span>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Program Logic Builder</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-[95%] flex-grow">
        <StepIndicator currentStep={currentStep} onStepClick={(step) => jumpTo(step)} />

        <div className="min-h-[500px] mt-4">
          {currentStep === 'GOAL' && (
            <GoalStep 
              programName={logic.programName}
              setProgramName={(name) => updateLogic(l => ({ ...l, programName: name }))}
              goal={logic.goal} 
              setGoal={(g) => updateLogic(l => ({ ...l, goal: g }))} 
            />
          )}

          {currentStep === 'NEEDS' && (
            <ListEditor
              title="Identify Needs"
              description="What needs to be addressed in order achieve the goal?"
              items={logic.needs.map(n => ({ id: n.id, text: n.description }))}
              typeLabel="Need"
              onAdd={(text) => updateLogic(l => ({ 
                ...l, 
                needs: [...l.needs, { id: crypto.randomUUID(), description: text, aims: [] }] 
              }))}
              onRemove={(id) => updateLogic(l => ({ ...l, needs: l.needs.filter(n => n.id !== id) }))}
              onUpdate={(id, text) => updateLogic(l => ({
                ...l,
                needs: l.needs.map(n => n.id === id ? { ...n, description: text } : n)
              }))}
            />
          )}

          {currentStep === 'AIMS' && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4 space-y-2">
                <h3 className="font-bold text-nsw-blue text-sm uppercase tracking-widest px-2 mb-3">Select Need</h3>
                {logic.needs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNeedId(n.id)}
                    className={`w-full text-left p-4 rounded-md border text-base font-bold transition-all ${
                      selectedNeedId === n.id 
                        ? 'bg-nsw-blue border-nsw-blue text-white shadow-md' 
                        : 'bg-white/70 backdrop-blur-sm border-nsw-grey-300 text-nsw-black hover:border-nsw-blue/50 hover:bg-nsw-grey-100'
                    }`}
                  >
                    {n.description.substring(0, 80)}{n.description.length > 80 ? '...' : ''}
                  </button>
                ))}
              </div>
              <div className="flex-1">
                {selectedNeedId ? (
                  <ListEditor
                    title="Aims"
                    description="How are you going to address the needs?"
                    items={currentNeed?.aims.map(a => ({ id: a.id, text: a.description })) || []}
                    typeLabel="Aim"
                    onAdd={(text) => updateLogic(l => ({
                      ...l,
                      needs: l.needs.map(n => n.id === selectedNeedId ? {
                        ...n,
                        aims: [...n.aims, { id: crypto.randomUUID(), description: text, inputs: [], activities: [], outputs: [], shortTermImpacts: [], longTermImpacts: [] }]
                      } : n)
                    }))}
                    onRemove={(id) => updateLogic(l => ({
                      ...l,
                      needs: l.needs.map(n => n.id === selectedNeedId ? { ...n, aims: n.aims.filter(a => a.id !== id) } : n)
                    }))}
                    onUpdate={(id, text) => updateLogic(l => ({
                      ...l,
                      needs: l.needs.map(n => n.id === selectedNeedId ? {
                        ...n,
                        aims: n.aims.map(a => a.id === id ? { ...a, description: text } : a)
                      } : n)
                    }))}
                  />
                ) : (
                  <div className="p-12 text-center text-nsw-grey-400 bg-white/80 backdrop-blur-md rounded-md border-2 border-dashed border-nsw-grey-300 h-full flex flex-col items-center justify-center font-bold italic leading-relaxed">
                    Select a program need from the left to define its aims.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'DETAILS' && (
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-1/4 space-y-2 md:sticky md:top-6">
                <h3 className="font-bold text-nsw-blue text-sm uppercase tracking-widest px-2 mb-3">Select Aim</h3>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {logic.needs.flatMap(n => n.aims.map(a => ({ needId: n.id, aim: a })))
                    .map(({ needId, aim }) => (
                    <button
                      key={aim.id}
                      onClick={() => { setSelectedNeedId(needId); setSelectedAimId(aim.id); }}
                      className={`w-full text-left px-5 py-4 rounded-md text-base font-bold border transition-all leading-relaxed ${
                        selectedAimId === aim.id 
                          ? 'bg-nsw-blue text-white border-nsw-blue shadow-md scale-[1.02]' 
                          : 'bg-white/70 backdrop-blur-sm border-nsw-grey-300 hover:border-nsw-blue/50 hover:bg-nsw-grey-100 text-nsw-black'
                      }`}
                    >
                      {aim.description}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-6">
                {currentAim ? (
                  <div className="flex flex-col gap-6 relative">
                    <ListEditor
                      title="Activities"
                      description="What activities need to be undertaken to deliver the outputs? (e.g. develop fact sheets, develop and promote training for clinical trial managers, etc)"
                      items={currentAim.activities.map((t, i) => ({ id: i.toString(), text: t }))}
                      typeLabel="Activity"
                      onAdd={(t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'activities', [...currentAim.activities, t])}
                      onRemove={(i) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'activities', currentAim.activities.filter((_, idx) => idx !== parseInt(i)))}
                      onUpdate={(i, t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'activities', currentAim.activities.map((old, idx) => idx === parseInt(i) ? t : old))}
                    />
                    <ListEditor
                      title="Inputs"
                      description="What resources are needed to conduct the activities? (e.g. staff, funding, partnerships, etc)"
                      items={currentAim.inputs.map((t, i) => ({ id: i.toString(), text: t }))}
                      typeLabel="Input"
                      onAdd={(t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'inputs', [...currentAim.inputs, t])}
                      onRemove={(i) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'inputs', currentAim.inputs.filter((_, idx) => idx !== parseInt(i)))}
                      onUpdate={(i, t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'inputs', currentAim.inputs.map((old, idx) => idx === parseInt(i) ? t : old))}
                    />
                    <ListEditor
                      title="Outputs"
                      description="What products and services need to be delivered to achieve the impacts? (e.g. fact sheets distributed, clinical trial managers attend training, etc)"
                      items={currentAim.outputs.map((t, i) => ({ id: i.toString(), text: t }))}
                      typeLabel="Output"
                      onAdd={(t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'outputs', [...currentAim.outputs, t])}
                      onRemove={(i) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'outputs', currentAim.outputs.filter((_, idx) => idx !== parseInt(i)))}
                      onUpdate={(i, t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'outputs', currentAim.outputs.map((old, idx) => idx === parseInt(i) ? t : old))}
                    />
                    <ListEditor
                      title="Short Term Impacts"
                      description="What short-term outcomes are required in order to achieve the long-term outcomes, and demonstrate measurable progress against your activities?"
                      items={currentAim.shortTermImpacts.map((t, i) => ({ id: i.toString(), text: t }))}
                      typeLabel="Impact"
                      onAdd={(t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'shortTermImpacts', [...currentAim.shortTermImpacts, t])}
                      onRemove={(i) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'shortTermImpacts', currentAim.shortTermImpacts.filter((_, idx) => idx !== parseInt(i)))}
                      onUpdate={(i, t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'shortTermImpacts', currentAim.shortTermImpacts.map((old, idx) => idx === parseInt(i) ? t : old))}
                    />
                    <ListEditor
                      title="Long Term Impacts"
                      description="What are the long-term outcomes of the program, and demonstrate measurable progress against your aims?"
                      items={currentAim.longTermImpacts.map((t, i) => ({ id: i.toString(), text: t }))}
                      typeLabel="Impact"
                      onAdd={(t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'longTermImpacts', [...currentAim.longTermImpacts, t])}
                      onRemove={(i) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'longTermImpacts', currentAim.longTermImpacts.filter((_, idx) => idx !== parseInt(i)))}
                      onUpdate={(i, t) => handleCellUpdate(selectedNeedId!, selectedAimId!, 'longTermImpacts', currentAim.longTermImpacts.map((old, idx) => idx === parseInt(i) ? t : old))}
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center text-nsw-grey-400 bg-white/80 backdrop-blur-md rounded-md border-2 border-dashed border-nsw-grey-300 h-full flex flex-col items-center justify-center font-bold italic leading-relaxed">
                    Select an Aim from the left to define its activities and impacts.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'REVIEW' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/80 backdrop-blur-md p-8 rounded-md border border-nsw-grey-300 shadow-md gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-nsw-black tracking-tight tracking-[-0.02em]">Review & Results</h2>
                  <div className="flex items-center gap-2 bg-nsw-grey-100 p-1.5 rounded-md self-start border border-nsw-grey-200">
                    <button 
                      onClick={() => setViewMode('TABLE')}
                      className={`px-5 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'TABLE' ? 'bg-white text-nsw-blue shadow-sm border border-nsw-grey-200' : 'text-nsw-grey-400 hover:text-nsw-blue'}`}
                    >
                      Table View
                    </button>
                    <button 
                      onClick={() => setViewMode('DIAGRAM')}
                      className={`px-5 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'DIAGRAM' ? 'bg-white text-nsw-blue shadow-sm border border-nsw-grey-200' : 'text-nsw-grey-400 hover:text-nsw-blue'}`}
                    >
                      Diagram View
                    </button>
                  </div>
                </div>
                {viewMode === 'TABLE' ? (
                  <button onClick={exportToExcel} className="bg-nsw-blue text-white px-8 py-3 rounded-md font-bold hover:bg-nsw-blue-hover transition-all text-sm flex items-center gap-2 shadow-md uppercase tracking-wider">
                    <span className="material-symbols-outlined text-lg">download</span>
                    Export Excel
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => diagramRef.current?.exportImage()} 
                      className="bg-white text-nsw-blue border border-nsw-blue px-6 py-3 rounded-md font-bold hover:bg-nsw-blue/5 transition-all text-sm flex items-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">image</span>
                      Download Image
                    </button>
                    <button 
                      onClick={() => diagramRef.current?.exportPDF()} 
                      className="bg-nsw-blue text-white px-6 py-3 rounded-md font-bold hover:bg-nsw-blue-hover transition-all text-sm flex items-center gap-2 shadow-md"
                    >
                      <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                      Download PDF
                    </button>
                  </div>
                )}
              </div>
              
              {viewMode === 'TABLE' ? (
                <LogicTable data={logic} onJumpTo={jumpTo} />
              ) : (
                <LogicDiagram data={logic} ref={diagramRef} />
              )}
            </div>
          )}
        </div>

        <footer className="mt-12 flex items-center justify-between border-t border-nsw-grey-300 pt-8 pb-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 'GOAL'}
            className="px-6 py-2 border border-nsw-blue text-nsw-blue rounded-md font-bold hover:bg-nsw-blue/5 disabled:opacity-30 disabled:border-nsw-grey-300 disabled:text-nsw-grey-300 transition-all text-sm"
          >
            ← Previous
          </button>
          <button
            onClick={currentStep === 'REVIEW' ? downloadAll : nextStep}
            className="px-10 py-2 bg-nsw-blue text-white font-bold rounded-md hover:bg-nsw-blue-hover transition-all shadow-md text-sm flex items-center gap-2"
          >
            {currentStep === 'REVIEW' ? (
              <>
                <span className="material-symbols-outlined text-lg">download</span>
                Download Result
              </>
            ) : 'Continue →'}
          </button>
        </footer>

        <div className="mt-8 py-10 border-t border-nsw-grey-300 flex flex-col items-center">
          <p className="text-[12px] text-nsw-grey-400 max-w-2xl mx-auto leading-relaxed text-center">
            This Program Logic Builder was developed by Thomas McCorquodale for use with The Office for Health and Medical Research's program management. 
            <br />
            For assistance, contact <a href="mailto:thomas.mccorquodale@health.nsw.gov.au" className="text-nsw-blue hover:underline font-bold">thomas.mccorquodale@health.nsw.gov.au</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
