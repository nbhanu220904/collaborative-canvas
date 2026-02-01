import React from 'react';
import { Plus, LayoutTemplate, Copy } from 'lucide-react';

const BottomBar = ({ pages, activePageId, onPageAdd, onPageSelect }) => {
  return (
    <div className="h-40 bg-gray-50 border-t border-gray-200 flex items-center px-6 overflow-x-auto shadow-inner">
      
      {pages.map((page) => (
         <div 
           key={page.id}
           onClick={() => onPageSelect(page.id)}
           className={`relative group min-w-[200px] h-[140px] border-2 rounded-lg overflow-hidden mr-6 cursor-pointer shadow-sm transition-transform hover:-translate-y-1 ${
             activePageId === page.id ? 'border-green-600 ring-2 ring-green-100' : 'border-gray-200 bg-white'
           }`}
         >
           <div className={`absolute top-0 left-0 right-0 px-3 py-2 flex justify-between items-center border-b ${
             activePageId === page.id ? 'bg-green-50 border-green-100 text-green-800' : 'bg-gray-50 border-gray-100 text-gray-600'
           }`}>
              <span className="text-xs font-semibold">{page.name}</span>
              <LayoutTemplate size={14} className={activePageId === page.id ? "text-green-600" : "text-gray-400"}/>
           </div>
           <div className="w-full h-full bg-white flex items-center justify-center">
               {/* <div className={`text-6xl font-light ${
                  activePageId === page.id ? 'text-gray-800' : 'text-gray-200'
               }`}>{page.id}</div> */}
           </div>
         </div>
      ))}

      {/* Add Page Button */}
      <div 
        onClick={onPageAdd}
        className="min-w-[100px] h-[100px] bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col gap-2 items-center justify-center hover:border-green-400 hover:bg-green-50 cursor-pointer transition-all text-gray-400 hover:text-green-600"
        title="New Canvas"
      >
        <Plus size={32} />
        <span className="text-xs font-medium">New Canvas</span>
      </div>
    </div>
  );
};

export default BottomBar;
