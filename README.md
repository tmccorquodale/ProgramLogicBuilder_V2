# NSW Health Program Logic Builder

## Objective
The NSW Health Program Logic Builder is a specialized tool designed for the NSW Health **Office for Health and Medical Research** to streamline the creation, visualization, and management of program logic models. It provides a structured, step-by-step workflow for health professionals to define program goals, identify community needs, establish strategic aims, and detail specific activities and outcomes.

The tool aims to bridge the gap between abstract planning and structured reporting by allowing users to export their logic models directly to Excel or visualize them through interactive diagrams and tables.

## 🛠 Tech Stack
- **Framework:** React 18+ with Vite
- **Language:** TypeScript (Strict typing for logic model structures)
- **Styling:** Tailwind CSS (following NSW Government Design System principles)
- **Animation:** Framer Motion (`motion/react`)
- **Icons:** Google Material Symbols
- **Build Tool:** Vite

## 🏗 Key Components & Architecture

### Data Structure (`/types.ts`)
The application is built around the `ProgramLogic` interface. All data is managed in a central state within `App.tsx` and passed down to specialized components.

### Visualizers
- **LogicDiagram.tsx:** A high-level visual representation of the flow from Needs → Aims → Activities → Outputs → Outcomes.
- **LogicTable.tsx:** A structured, document-style view of the program details, optimized for quick review and editing.

### Workflow Management
The app uses a state-driven step system (`StepType`):
1. **GOAL:** Define Program Name and overarching Goal.
2. **NEEDS:** List community/clinical needs.
3. **AIMS:** Establish strategic aims related to those needs.
4. **DETAILS:** Define inputs, activities, outputs, and outcomes.
5. **REVIEW:** Final visualization and Export.

## 💡 Notes for Future Programmers

### 1. Styling System
The app uses a custom NSW-themed Tailwind palette (defined in `tailwind.config.js`). Always use the `bg-nsw-*` and `text-nsw-*` utility classes to maintain brand consistency.

### 2. Excel Integration
The "Export to Excel" and "Import Excel" features use a specific JSON mapping. If you modify the `ProgramLogic` type, ensure you update the `handleExport` and `handleFileUpload` logic in `App.tsx` to maintain data integrity.

### 3. Responsive Constraints
The Logic Diagram is designed for a widescreen "dashboard" feel. When adding new elements to the diagram, use relative widths or overflow containers to ensure visibility on smaller screens.

### 4. Assets
- **Logo:** The NSW Government / Health and Medical Research logo is rendered as a raw SVG in `App.tsx` to avoid broken external dependencies.
- **Public Folder:** The `Public` folder (capital 'P') contains assets like `background.svg`, which is rendered via the `Background.tsx` component.

### 5. NSW Design System
While not using the full NPM package for performance reasons, the UI mimics the **NSW Design System** (typography, border-tops, and blue/red accents). Refer to the [Digital NSW Design System](https://www.digital.nsw.gov.au/design-system) for further UI inspiration.

### 6. Contact
This tool was designed by Thomas McCorquodale (Data Manager, OHMR) to assist teams with stress-free generation of Program Logic Models. You can reach out to him at mailto:Thomas.McCorquodale@health.nsw.gov.au for further information. 
