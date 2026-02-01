import React, { useState } from 'react';
import { 
  Pointer, 
  Brush, 
  Eraser, 
  Square, 
  Circle,
  Triangle,
  MoveRight, 
  Type, 
  PaintBucket,
  Hand,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ activeTool, setActiveTool, color, setColor, strokeWidth, setStrokeWidth }) => {
  const [showShapes, setShowShapes] = useState(false);

  // Group: Primary Tools
  // Logic: If user selects 'circle' or 'triangle', the main icon might update or we just show them in valid state
  
  const handleShapeSelect = (toolId) => {
      setActiveTool(toolId);
      setShowShapes(false);
  };
  
  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-20 shadow-sm relative overflow-visible">
      {/* Core Tools */}
      <div className="flex flex-col gap-2 mb-4 w-full px-2">
         {/* Select */}
         <SidebarIcon 
            icon={Pointer} 
            active={activeTool === 'select'} 
            onClick={() => setActiveTool('select')} 
            label="Select (P)" 
         />
         
         {/* Brush */}
         <SidebarIcon 
            icon={Brush} 
            active={activeTool === 'brush'} 
            onClick={() => setActiveTool('brush')} 
            label="Brush (B)" 
         />

         {/* Eraser */}
         <SidebarIcon 
            icon={Eraser} 
            active={activeTool === 'eraser'} 
            onClick={() => setActiveTool('eraser')} 
            label="Eraser (E)" 
         />

         {/* Shapes Group */}
         <div className="relative group w-full flex justify-center">
            <button
               onClick={() => setShowShapes(!showShapes)}
               className={`p-2 rounded-lg transition-all duration-200 relative ${
                 ['rectangle', 'circle', 'triangle'].includes(activeTool)
                   ? 'bg-green-100 text-green-700 shadow-sm' 
                   : 'text-gray-500 hover:bg-gray-100'
               }`}
            >
               {activeTool === 'circle' ? <Circle size={22} /> : 
                activeTool === 'triangle' ? <Triangle size={22} /> : 
                <Square size={22} />}
               
               {/* Tiny indicator that menu exists */}
               <div className="absolute bottom-0 right-0 w-2 h-2 text-[8px] text-gray-400">▼</div>
            </button>

            {/* Shape Menu Popover */}
            {showShapes && (
               <div className="absolute left-full top-0 ml-2 bg-white border border-gray-200 shadow-xl rounded-lg p-2 flex flex-col gap-2 z-50">
                  <SidebarIcon icon={Square} active={activeTool === 'rectangle'} onClick={() => handleShapeSelect('rectangle')} label="Rectangle" />
                  <SidebarIcon icon={Circle} active={activeTool === 'circle'} onClick={() => handleShapeSelect('circle')} label="Circle" />
                  <SidebarIcon icon={Triangle} active={activeTool === 'triangle'} onClick={() => handleShapeSelect('triangle')} label="Triangle" />
               </div>
            )}
         </div>

         {/* Arrow */}
         <SidebarIcon 
            icon={MoveRight} 
            active={activeTool === 'arrow'} 
            onClick={() => setActiveTool('arrow')} 
            label="Arrow" 
         />

         {/* Text */}
         <SidebarIcon 
            icon={Type} 
            active={activeTool === 'text'} 
            onClick={() => setActiveTool('text')} 
            label="Text" 
         />

         {/* Fill */}
         <SidebarIcon 
            icon={PaintBucket} 
            active={activeTool === 'fill'} 
            onClick={() => setActiveTool('fill')} 
            label="Fill" 
         />

         {/* Pan */}
         <SidebarIcon 
            icon={Hand} 
            active={activeTool === 'pan'} 
            onClick={() => setActiveTool('pan')} 
            label="Pan" 
         />
      </div>
      
      <div className="w-10 h-px bg-gray-200 my-2"></div>

      {/* Properties */}
      <div className="flex flex-col items-center gap-4 mt-2">
         {/* Color */}
         <div className="relative group">
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: color }}
            >
               <input 
                 type="color" 
                 value={color}
                 onChange={(e) => setColor(e.target.value)}
                 className="opacity-0 w-full h-full cursor-pointer absolute top-0 left-0"
               />
            </div>
         </div>

         {/* Stroke */}
         <div className="w-8 flex flex-col items-center gap-1 group relative">
             <div className="text-[10px] text-gray-400 font-mono">{strokeWidth}px</div>
             <input 
               type="range" 
               min="1" max="20" 
               value={strokeWidth} 
               onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
               className="h-16 w-1 appearance-none bg-gray-200 rounded-lg outline-none slider-vertical"
               style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
             />
         </div>
      </div>
    </div>
  );
};

const SidebarIcon = ({ icon: Icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-2 rounded-lg transition-all duration-200 flex justify-center w-full ${
      active 
        ? 'bg-green-100 text-green-700 shadow-sm' 
        : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
  </button>
);

export default Sidebar;
