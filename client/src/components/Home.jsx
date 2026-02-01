import React, { useState, useEffect } from 'react';
import { 
  FilePlus, Upload, Grid, List, MoreVertical, 
  Search, Filter, ChevronDown, Clock, MousePointer2,
  DraftingCompass, FolderPlus, FileUp
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/drawings');
        const data = await res.json();
        setDrawings(data);
      } catch (err) {
        console.error('Failed to fetch drawings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrawings();
  }, []);

  const handleNewCanvas = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    navigate(`/canvas/${newId}`);
  };

  const handleOpenCanvas = (roomId) => {
    navigate(`/canvas/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 bg-green-700 px-3 py-1.5 rounded-lg text-white">
            <DraftingCompass size={20} />
            <span className="font-bold text-sm tracking-tight">Canvas</span>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search your artworks..." 
              className="bg-gray-100 border border-transparent rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-green-500 w-72 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors text-gray-600">
            <FolderPlus size={16} />
            <span>New folder</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors text-gray-600 mr-2">
            <FileUp size={16} />
            <span>Import</span>
          </button>
          
          <button 
            onClick={handleNewCanvas}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
          >
            <FilePlus size={18} />
            <span>New canvas</span>
          </button>
          
          <div className="ml-4 pl-4 border-l border-gray-200">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        {/* Title & Stats */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My artworks</h1>
          <p className="text-sm text-gray-500">You have {drawings.length} drawings saved in your library.</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
              Sort by: <span className="text-green-700 font-bold">Recently Modified</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
             <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 font-medium">Loading your artworks...</p>
          </div>
        ) : drawings.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <DraftingCompass className="text-green-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start your first masterpiece</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Create a collaborative canvas and invite your team to draw together in real-time.</p>
            <button 
              onClick={handleNewCanvas}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-200"
            >
              Create New Canvas
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* New Canvas Card */}
            <div 
              onClick={handleNewCanvas}
              className="group cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-green-400 hover:bg-green-50 transition-all aspect-16/10"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <FilePlus className="text-gray-400 group-hover:text-green-600" size={24} />
              </div>
              <span className="font-bold text-sm text-gray-500 group-hover:text-green-700">New Artwork</span>
            </div>

            {drawings.map((drawing) => (
              <div 
                key={drawing.roomId}
                onClick={() => handleOpenCanvas(drawing.roomId)}
                className="group cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-green-300 transition-all"
              >
                <div className="aspect-16/10 bg-gray-100 relative overflow-hidden">
                  {drawing.thumbnail ? (
                    <img
                      src={drawing.thumbnail}
                      alt={drawing.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 transition-opacity">
                      <MousePointer2 size={64} />
                    </div>
                  )}
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-600 transform -translate-y-1 group-hover:translate-y-0 transition-transform" />
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 truncate pr-4">{drawing.name}</h3>
                    <button className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center border border-white">
                          <span className="text-[10px] font-bold text-green-700">
                            {drawing.name.charAt(0).toUpperCase()}
                          </span>
                       </div>
                       <span className="text-[10px] text-gray-500 font-medium">
                         Edited {new Date(drawing.lastModified).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Title</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Last Modified</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drawings.map((drawing) => (
                  <tr 
                    key={drawing.roomId}
                    onClick={() => handleOpenCanvas(drawing.roomId)}
                    className="hover:bg-green-50/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                           {drawing.thumbnail ? (
                             <img
                               src={drawing.thumbnail}
                               alt={drawing.name}
                               className="w-full h-full object-cover"
                               loading="lazy"
                             />
                           ) : (
                             <DraftingCompass size={14} className="text-gray-300" />
                           )}
                        </div>
                        <span className="font-bold text-gray-900">{drawing.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                         <Clock size={14} />
                         <span>{new Date(drawing.lastModified).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-green-600 hover:shadow-sm">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
