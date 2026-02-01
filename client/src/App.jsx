import React, { useState, useEffect, useRef } from 'react';
import NavBar from './components/NavBar';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import BottomBar from './components/BottomBar';
import Home from './components/Home';
import { socket } from './socket';
import { useUser } from '@clerk/clerk-react';
import { Shield } from 'lucide-react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';

const CanvasRoom = ({ user, isLoaded }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState('brush');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [pages, setPages] = useState([{ id: 1 }]);
  const [activePageId, setActivePageId] = useState(1);
  const [activeUsers, setActiveUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [drawingName, setDrawingName] = useState('Untitled Drawing');
  const [roomSettings, setRoomSettings] = useState({ isPublic: true, password: null });

  useEffect(() => {
    document.title = `${drawingName} | Collaborative Canvas`;
  }, [drawingName]);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const canvasRef = useRef(null);

  const handleExport = (format) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `${drawingName}.${format === 'selection' ? 'png' : format}`;
      
      if (format === 'selection') {
          alert("To post a selection, please use the Select tool to highlight an area first.");
          return;
      }

      if (format === 'jpeg') {
         const tempCanvas = document.createElement('canvas');
         tempCanvas.width = canvas.width;
         tempCanvas.height = canvas.height;
         const ctx = tempCanvas.getContext('2d');
         ctx.fillStyle = '#ffffff';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.drawImage(canvas, 0, 0);
         link.href = tempCanvas.toDataURL('image/jpeg');
      } else {
         link.href = canvas.toDataURL('image/png');
      }
      link.click();
  };

  useEffect(() => {
    if (isLoaded && user && roomId) {
        const userData = {
            name: user.fullName || user.username || 'Guest',
            avatar: user.imageUrl,
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            password: passwordInput,
            roomId: roomId // Pass roomId to server
        };
        socket.emit('join_room', userData);
    }
  }, [isLoaded, user, passwordInput, roomId]);

  useEffect(() => {
      socket.on('room_users', setActiveUsers);
      socket.on('room_settings', setRoomSettings);
      socket.on('drawing_name', setDrawingName);
      socket.on('comments_update', setComments);
      socket.on('comment_added', (newComment) => setComments(prev => [...prev, newComment]));
      socket.on('comment_resolved', (commentId) => setComments(prev => prev.filter(c => c._id !== commentId)));
      socket.on('access_denied', (data) => {
          if (data?.reason === 'password_required') setPasswordRequired(true);
          else setAccessDenied(true);
      });

      return () => {
          socket.off('room_users');
          socket.off('room_settings');
          socket.off('drawing_name');
          socket.off('comments_update');
          socket.off('comment_added');
          socket.off('comment_resolved');
          socket.off('access_denied');
      };
  }, []);

  const handlePageAdd = () => {
    const newId = pages.length + 1;
    setPages([...pages, { id: newId, name: `Canvas ${newId}` }]);
    setActivePageId(newId);
  };

  const handleUndo = React.useCallback(() => socket.emit('undo'), []);
  const handleRedo = React.useCallback(() => socket.emit('redo'), []);
  const handleInvite = (email) => {
    if (email) {
      socket.emit('invite_user', email);
      alert(`Invited ${email}`);
    }
  };
  
  const handleUpdateSettings = (settings) => socket.emit('update_settings', settings);
  const handleRenameDrawing = (newName) => socket.emit('rename_drawing', newName);
  const handleGoHome = () => navigate('/');

  useEffect(() => {
    const handleDuplicate = () => {
      const newId = Math.random().toString(36).substring(2, 9);
      socket.emit('duplicate_drawing', newId);
    };

    const handleDelete = () => {
      if (window.confirm('Are you sure you want to move this drawing to the bin?')) {
        socket.emit('delete_drawing');
      }
    };

    window.addEventListener('canvas:duplicate', handleDuplicate);
    window.addEventListener('canvas:move-to-bin', handleDelete);

    socket.on('drawing_deleted', () => {
      alert('Drawing moved to bin');
      navigate('/');
    });

    socket.on('drawing_duplicated', (newRoomId) => {
      alert('Drawing duplicated!');
      navigate(`/canvas/${newRoomId}`);
    });

    return () => {
      window.removeEventListener('canvas:duplicate', handleDuplicate);
      window.removeEventListener('canvas:move-to-bin', handleDelete);
      socket.off('drawing_deleted');
      socket.off('drawing_duplicated');
    };
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden text-gray-800 font-sans">
      {passwordRequired && !activeUsers.find(u => u.id === user?.id) ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 z-50 absolute inset-0">
             <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center w-96">
                <Shield size={48} className="text-orange-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Protected</h1>
                <p className="text-gray-600 mb-6">Enter the room password to join.</p>
                <input 
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                />
                <button 
                  onClick={() => {
                      const userData = {
                        name: user.fullName || user.username || 'Guest',
                        avatar: user.imageUrl,
                        id: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                        password: passwordInput,
                        roomId: roomId
                      };
                      socket.emit('join_room', userData);
                      setPasswordRequired(false);
                  }}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition"
                >
                    Join Room
                </button>
            </div>
          </div>
      ) : null}

      {accessDenied && !passwordRequired ? (
        <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-1000 px-4">
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center border border-gray-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-1">You are not on the guest list.</p>
                <div className="space-y-3">
                    <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                        Retry Connection
                    </button>
                    <button onClick={() => navigate('/')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg mt-2">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
      ) : (
      <>
        <NavBar 
            onUndo={handleUndo} 
            onRedo={handleRedo} 
            activeUsers={activeUsers} 
            onExport={handleExport} 
            onInvite={handleInvite}
            roomSettings={roomSettings}
            onUpdateSettings={handleUpdateSettings}
            drawingName={drawingName}
            onRename={handleRenameDrawing}
            onHome={handleGoHome}
        />
        
        <div className="flex flex-1 overflow-hidden">
            <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} color={color} setColor={setColor} strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} />
            <div className="flex-1 flex flex-col relative bg-gray-100">
              <div className="flex-1 relative overflow-hidden bg-white m-4 rounded-xl shadow-sm border border-gray-200">
                <Canvas 
                  key={activePageId} 
                  pageId={activePageId} 
                  activeTool={activeTool} 
                  setActiveTool={setActiveTool}
                  color={color} 
                  strokeWidth={strokeWidth} 
                  canvasRef={canvasRef} 
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  roomId={roomId}
                  comments={comments}
                  user={user}
                />
              </div>
              <div className="h-auto">
                <BottomBar pages={pages} activePageId={activePageId} onPageAdd={handlePageAdd} onPageSelect={setActivePageId} />
              </div>
            </div>
        </div>
      </>
      )}
    </div>
  );
};

const App = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return (
     <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
     </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/canvas/:roomId" element={<CanvasRoom user={user} isLoaded={isLoaded} />} />
    </Routes>
  );
};

export default App;