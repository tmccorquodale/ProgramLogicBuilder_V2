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
      <header className="bg-white border-b border-nsw-grey-200 shadow-sm py-4">
        <div className="container mx-auto px-4 max-w-[95%]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <a href="https://medicalresearch.nsw.gov.au/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                <div className="h-12 w-auto">
                  <svg viewBox="0 0 259 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
                    <path fillRule="evenodd" clipRule="evenodd" d="M24.208 270.207h-5.045v-4.277l11.15.054v13.676H26.08v-2.491c-.266.278-.553.556-.86.833-.673.585-1.49 1.07-2.433 1.434-.96.373-2.143.564-3.513.564-2.33 0-4.385-.539-6.109-1.6-1.727-1.065-3.073-2.594-4.007-4.538-.926-1.927-1.395-4.231-1.395-6.85 0-2.657.494-4.994 1.47-6.946.971-1.96 2.363-3.498 4.132-4.571 1.768-1.065 3.849-1.604 6.183-1.604 1.515 0 2.915.245 4.156.725 1.255.485 2.36 1.157 3.273 1.985a9.61 9.61 0 0 1 2.192 2.852 8.196 8.196 0 0 1 .872 3.319l.021.435h-6.038l-.062-.339a5.22 5.22 0 0 0-.814-1.981 4.562 4.562 0 0 0-1.537-1.43c-.614-.352-1.345-.531-2.175-.531-1.005 0-1.931.261-2.741.775-.806.51-1.458 1.351-1.935 2.495-.486 1.169-.731 2.74-.731 4.679 0 1.579.162 2.897.482 3.925.311 1.011.739 1.819 1.266 2.403.523.581 1.117.991 1.773 1.219a6.036 6.036 0 0 0 2.089.369c.669 0 1.27-.112 1.79-.328.523-.224.98-.514 1.354-.866.377-.356.676-.746.884-1.152.216-.41.349-.816.399-1.21l.14-1.028Zm20.878-16.312c2.354 0 4.435.534 6.179 1.587 1.752 1.061 3.13 2.59 4.086 4.546.947 1.935 1.428 4.281 1.428 6.967 0 2.648-.473 4.969-1.412 6.9-.946 1.948-2.317 3.469-4.073 4.521-1.744 1.053-3.837 1.583-6.212 1.583-2.396 0-4.502-.534-6.254-1.583-1.753-1.044-3.135-2.557-4.099-4.505-.947-1.927-1.428-4.252-1.428-6.912 0-2.673.486-5.015 1.449-6.954.968-1.956 2.355-3.486 4.12-4.551 1.764-1.061 3.853-1.599 6.216-1.599Zm0 21.185c1.117 0 2.093-.265 2.898-.787.802-.523 1.433-1.372 1.881-2.516.453-1.185.686-2.772.686-4.712 0-1.993-.237-3.618-.698-4.832-.444-1.181-1.08-2.056-1.885-2.603-.814-.543-1.782-.82-2.878-.82-1.1 0-2.072.277-2.886.82-.81.543-1.453 1.422-1.906 2.611-.47 1.223-.706 2.843-.706 4.82 0 1.944.237 3.531.702 4.712.452 1.148 1.092 1.997 1.902 2.515.81.527 1.781.792 2.89.792Zm23.764-2.93-6.162-17.829H57.09l8.654 25.251h6.195l8.73-25.251h-5.607L68.85 272.15Zm30.312-2.827H88.863v5.206l12.043.016v5.027H83.103v-25.251h17.632l-.016 4.99H88.892v5.089h10.27v4.923Zm22.482-1.529c.685-.613 1.246-1.401 1.678-2.341.419-.933.635-2.081.635-3.419 0-1.497-.311-2.835-.93-3.983-.619-1.169-1.599-2.093-2.919-2.756-1.3-.647-2.973-.974-4.975-.974h-10.738v25.243h5.759v-9.404h4.24l3.991 9.404h6.046l-4.651-10.456c.673-.357 1.3-.8 1.864-1.314Zm-3.513-5.64c0 .999-.336 1.79-1.025 2.428-.69.63-1.649.949-2.857.949h-4.095v-6.606h4.456c1.038 0 1.873.286 2.545.875.657.576.976 1.347.976 2.354Zm15.159-7.833 10.527 15.23v-15.23h5.776v25.251h-5.086l-10.98-15.86v15.86h-5.759v-25.251h5.522Zm33.949 16.461-5.29-16.461h-7.894v25.251h5.809v-16.266l5.124 16.266h4.485l5.162-16.357v16.357h5.826v-25.251h-7.878l-5.344 16.461Zm33.727-1.459h-10.298v5.206l12.046.016v5.027h-17.806v-25.251h17.636l-.021 4.99h-11.818v5.089h10.261v4.923Zm21.494.228-10.523-15.23h-5.527v25.251h5.756v-15.86l10.979 15.86h5.087v-25.251h-5.772v15.23Zm15.586-10.004h-7.388v-5.226h20.402v5.226h-7.217v20.025h-5.797v-20.025Z" fill="#002664"/><path fillRule="evenodd" clipRule="evenodd" d="M146.699 209.236c-1.482-2.395-3.717-4.571-6.64-6.465-2.919-1.894-6.897-3.34-11.81-4.297l-13.678-2.814c-4.132-.891-6.981-2.043-8.468-3.419-1.449-1.343-2.184-3.129-2.184-5.309 0-1.388.316-2.652.943-3.759.623-1.111 1.528-2.093 2.687-2.922 1.166-.828 2.616-1.483 4.306-1.943 1.711-.469 3.633-.705 5.714-.705 2.74 0 5.211.361 7.346 1.078 2.109.713 3.857 1.881 5.194 3.481 1.338 1.6 2.16 3.775 2.442 6.465l.038.373h16.971l-.008-.427c-.075-4.575-1.371-8.773-3.85-12.474-2.483-3.705-6.141-6.681-10.879-8.852-4.726-2.164-10.623-3.262-17.528-3.262-5.801 0-11.117 1.011-15.805 3.009-4.7 2.002-8.475 4.89-11.212 8.587-2.749 3.717-4.12 8.164-4.078 13.224.112 6.175 1.99 11.186 5.577 14.903 3.576 3.697 8.476 6.158 14.567 7.306l13.795 2.81c2.529.502 4.825 1.16 6.823 1.96 1.96.784 3.525 1.803 4.651 3.03 1.1 1.197 1.657 2.772 1.657 4.67 0 2.114-.694 3.9-2.06 5.301-1.4 1.434-3.301 2.515-5.643 3.224-2.388.721-5.058 1.086-7.936 1.086-2.807 0-5.394-.435-7.686-1.297-2.28-.85-4.194-2.093-5.689-3.693-1.491-1.591-2.513-3.585-3.04-5.918l-.075-.327H83.846l.045.46c.407 4.045 1.666 7.629 3.738 10.659 2.068 3.009 4.717 5.545 7.873 7.551 3.148 1.993 6.677 3.514 10.494 4.513a46.33 46.33 0 0 0 11.693 1.5c6.466 0 12.2-1.019 17.046-3.034 4.867-2.022 8.717-4.807 11.449-8.276 2.753-3.493 4.148-7.476 4.148-11.848 0-2.064-.232-4.36-.697-6.822-.478-2.482-1.466-4.948-2.936-7.327ZM25.937 191.763l36.916 53.312H77.87v-79.724H61.072v51.282L25.754 165.53l-.125-.179H9.19v79.724h16.748v-53.312Zm196.637 24.577 14.388-50.987h16.457l-23.587 79.724h-13.367l-14.554-50.469-14.659 50.469h-13.147l-23.533-79.724h16.511l14.384 50.979 14.389-50.979h12.167l14.551 50.987Z" fill="#002664"/><path d="M122.291 145.572c-19.75-2.424-38.934 3.904-72.69-5.263-3.447-.937-4.718 2.694-2.854 5.736 9.07 14.803 54.881 3.203 75.635 1.065.906-.095.814-1.426-.091-1.538ZM208.735 140.309c-33.756 9.167-52.941 2.839-72.691 5.263-.905.112-1 1.447-.091 1.538 20.759 2.138 66.566 13.738 75.635-1.065 1.864-3.042.594-6.673-2.853-5.736ZM59.882 119.132c-6.864-10.058-12.474-21.31-16.818-33.69-13.101 3.826-26.51 9.346-40.16 16.57a5.388 5.388 0 0 0-2.902 4.67 5.38 5.38 0 0 0 2.653 4.812c26.431 15.802 52.273 24.841 76.93 26.933-7.34-4.475-14.072-11.044-19.703-19.295ZM23.059 85.513a201.529 201.529 0 0 1 17.976-6.233c-2.126-6.896-3.87-14.12-5.249-21.658-6.827-.85-13.89-1.4-21.199-1.641-.062 0-.128-.004-.19-.004a5.391 5.391 0 0 0-4.647 2.602 5.383 5.383 0 0 0-.12 5.483c4.243 7.659 8.724 14.808 13.429 21.45ZM88.005 135.572c4.099 1.807 8.293 2.818 12.358 3.029-9.953-7.12-17.773-19.192-22.278-34.58-5.805-19.81-7.745-41.666-5.83-65.247-7.832-4.936-16.32-9.557-25.46-13.85a5.428 5.428 0 0 0-5.402.43 5.396 5.396 0 0 0-2.388 4.841c2.126 34.215 10.95 62.915 26.223 85.298 6.404 9.391 14.281 16.332 22.777 20.079ZM107.488 23.577A253.323 253.323 0 0 0 92.235 6.735c-1.063-1.078-2.433-1.65-3.85-1.65-.506 0-1.017.075-1.523.224-1.923.568-3.314 2.106-3.733 4.115-1.072 5.164-3.11 15.69-4.012 26.101 7.014 4.613 13.492 9.49 19.426 14.621 2.3-8.757 5.29-17.63 8.945-26.569ZM255.42 102.007c-13.65-7.223-27.058-12.744-40.16-16.569-4.343 12.38-9.953 23.631-16.818 33.689-5.63 8.255-12.362 14.82-19.708 19.296 24.658-2.093 50.5-11.132 76.931-26.934 1.715-1.024 2.707-2.822 2.653-4.811-.045-1.99-1.133-3.734-2.898-4.671ZM235.273 85.513c4.705-6.643 9.186-13.796 13.43-21.455.963-1.74.922-3.788-.121-5.483a5.4 5.4 0 0 0-4.837-2.598c-7.309.24-14.377.796-21.199 1.641-1.375 7.539-3.123 14.762-5.249 21.658a203.803 203.803 0 0 1 17.976 6.237ZM180.247 104.025c-4.505 15.384-12.329 27.46-22.278 34.58 4.065-.211 8.263-1.227 12.358-3.034 8.496-3.746 16.373-10.688 22.777-20.075 15.273-22.383 24.097-51.082 26.223-85.297a5.394 5.394 0 0 0-2.388-4.84 5.428 5.428 0 0 0-5.402-.432c-9.14 4.29-17.628 8.91-25.46 13.85 1.915 23.582-.029 45.434-5.83 65.248ZM179.214 35.52c-.901-10.406-2.94-20.932-4.011-26.1-.416-2.01-1.811-3.547-3.733-4.115a5.39 5.39 0 0 0-1.524-.224c-1.416 0-2.787.572-3.85 1.65-5.485 5.549-10.568 11.164-15.252 16.842 3.654 8.939 6.644 17.812 8.949 26.565 5.934-5.127 12.407-10.005 19.421-14.617ZM129.144 87.229c6.64-13.092 17.246-24.829 25.21-32.243-4.372-17.779-11.104-34.55-20.397-52.097C132.998 1.078 131.195 0 129.148 0s-3.845 1.082-4.808 2.889c-9.389 17.604-16.237 35.122-20.377 52.093 8.313 7.688 19.28 20.224 25.181 32.247Z" fill="#D7153A"/><path d="M153.541 133.686c6.885-4.833 13.77-13.254 18.139-24.97 8.458-22.681 9.334-47.945 8.122-65.823-15.331 10.215-39.665 31.55-47.975 54.36-3.911 10.734-5.734 25.355-2.72 33.511 1.259 3.411 3.401 5.997 6.345 7.227 4.46 1.865 11.312.456 18.089-4.305ZM125.713 95.261c-2.027-4.724-4.261-9.18-7.728-14.186-9.809-14.16-23.026-26.933-39.475-38.185-.17 2.652-2.57 31.297 5.851 59.304 6.408 21.302 17.354 29.98 23.354 33.333 6.038 3.369 11.561 4.165 18.039 2.557-6.565-8.935-5.747-27.27-.041-42.823Z" fill="#D7153A"/>
                  </svg>
                </div>
                <div className="flex flex-col border-l-2 border-nsw-grey-200 pl-4 py-0.5">
                  <span className="text-lg md:text-xl font-bold text-[#002664] tracking-tight leading-tight">
                    NSW Health and Medical Research
                  </span>
                  <span className="text-sm md:text-base font-normal text-[#002664]/80 leading-tight">
                    NSW Health
                  </span>
                </div>
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
