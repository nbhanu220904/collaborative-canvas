import { useState, useRef, useEffect } from "react";
import {
  DraftingCompass,
  LinkIcon,
  Home,
  FilePlus,
  Copy,
  Upload,
  Files,
  Share2,
  Save,
  History,
  Trash2,
  Settings,
  Undo2,
  Redo2,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Maximize,
  Droplet,
  Sliders,
  BookOpen,
  Keyboard,
  Info,
  Users,
  Shield,
  FileText,
  MousePointer2,
  UserPlus,
  CircleUser,
  X,
  Link,
  Globe,
  Crop,
  Mail,
  Clock,
  FileImage,
  Download
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';


const menus = {
  File: [
    { label: "Home", icon: Home },
    { label: "New", icon: FilePlus },
    { label: "Quick new", icon: Copy },
    { label: "Import", icon: Upload },
    { label: "Duplicate", icon: Files },
    { label: "Export", icon: Share2 },
    { label: "Save", icon: Save },
    { label: "History", icon: History },
    { label: "Bin", icon: Trash2 },
    { label: "Settings", icon: Settings },
  ],
  Edit: [
    { label: "Undo", icon: Undo2 },
    { label: "Redo", icon: Redo2 },
    { label: "Cut", icon: Scissors },
    { label: "Copy", icon: Clipboard },
    { label: "Paste", icon: Clipboard },
  ],
  View: [
    { label: "Zoom In", icon: ZoomIn },
    { label: "Zoom Out", icon: ZoomOut },
    { label: "Fullscreen", icon: Maximize },
  ],
  Filter: [
    { label: "Blur", icon: Droplet },
    { label: "Sharpen", icon: Sliders },
    { label: "Grayscale", icon: Sliders },
  ],
  Help: [
    { label: "Docs", icon: BookOpen },
    { label: "Shortcuts", icon: Keyboard },
    { label: "About", icon: Info },
  ],
  Admin: [
    { label: "Users", icon: Users },
    { label: "Permissions", icon: Shield },
    { label: "Logs", icon: FileText },
  ],
};

const NavBar = ({ onUndo, onRedo, activeUsers = [], onExport, onInvite, roomSettings = { isPublic: false, password: null }, onUpdateSettings, drawingName = 'Untitled Drawing', onRename, onHome }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareView, setShareView] = useState('menu'); // 'menu' | 'invite'
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(drawingName);
  
  useEffect(() => {
    setTempName(drawingName);
  }, [drawingName]);

  const handleNameSubmit = () => {
    if (tempName.trim() && tempName !== drawingName) {
      onRename(tempName.trim());
    }
    setIsEditingName(false);
  };
  const [inviteEmail, setInviteEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const navRef = useRef(null);
  
  // ... (useEffect remains)

  const handleSendInvite = () => {
      if (onInvite && inviteEmail) {
          onInvite(inviteEmail);
          setInviteEmail('');
      }
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCloseShare = () => {
      setIsShareOpen(false);
      setShareView('menu');
  };

   return (
    <>
    <div ref={navRef} className="relative bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 h-14 w-full gap-4">
        
        {/* Left Section: Logo & Menus */}
        <div className="flex items-center gap-4 min-w-0">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-green-700 px-2 py-1 rounded-md cursor-pointer text-white shrink-0"
          >
            <DraftingCompass size={20} />
          </div>

          <div className="flex items-center shrink-0">
            {isEditingName ? (
              <input
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md outline-none border border-blue-400 w-40 transition-all font-sans"
              />
            ) : (
              <h1 
                onClick={() => setIsEditingName(true)}
                className="text-sm font-bold text-gray-800 cursor-pointer hover:bg-gray-100 px-2 py-0.5 rounded-md transition-colors flex items-center gap-2 group whitespace-nowrap"
              >
                {drawingName}
                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-normal">Click to rename</span>
              </h1>
            )}
          </div>

          <div className="flex items-center justify-between space-x-1 ml-2 overflow-x-auto no-scrollbar shrink">
            {Object.keys(menus).map((menu) => (
              <div key={menu} className="relative shrink-0" onMouseEnter={() => setOpenMenu(menu)}>
                <button
                  className={`px-3 py-1 rounded text-sm font-medium hover:text-green-700 hover:bg-green-50 transition-colors ${
                    openMenu === menu ? "text-green-700 bg-green-50" : "text-gray-700"
                  }`}
                  onClick={() => setOpenMenu(menu)}
                >
                  {menu}
                </button>
                {openMenu === menu && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                    {menus[menu].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer"
                          onClick={() => {
                            if (item.label === 'Home') navigate('/');
                            if (item.label === 'Undo') onUndo();
                            if (item.label === 'Redo') onRedo();
                            setOpenMenu(null);
                          }}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                    
                  </div>
                )}
              </div>
            ))}
           
          </div>
        </div>

        {/* Center Spacer */}
        <div></div>

        {/* Right Section: Collaboration */}
        <div className="flex items-center space-x-3 justify-end min-w-0">
             <div className="flex -space-x-2 overflow-hidden shrink-0">
                {/* Active Users Preview (Max 3) */}
                {activeUsers.slice(0, 3).map((u, i) => (
                    <img key={i} src={u.avatar} alt={u.name} title={u.name} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" />
                ))}
                {activeUsers.length > 3 && (
                    <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        +{activeUsers.length - 3}
                    </div>
                )}
             </div>

          <button 
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0">
            <UserPlus size={16} />
            <span>Share</span>
          </button>
          
              <div className="shrink-0 flex items-center">
                <SignedOut>
                  <div className="px-3 py-1 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition">
                     <SignInButton />
                  </div>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
        </div>
      </div>
    </div>

    {/* Share Modal (Magma-Style Light Theme) */}
    {isShareOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-100 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl w-[500px] overflow-hidden border border-white/50">
                {shareView === 'menu' ? (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50">
                        <h2 className="text-xl font-semibold text-gray-800">Share Drawing</h2>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                                <LinkIcon size={16} /> Copy link
                            </button>
                            <button onClick={() => setIsShareOpen(false)} className="p-2 rounded-full hover:bg-gray-100/50 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Canvas Privacy */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Canvas privacy:</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => onUpdateSettings && onUpdateSettings({ isPublic: !roomSettings.isPublic })}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${roomSettings.isPublic ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ease-in-out ${roomSettings.isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                                <span className="text-gray-600">
                                    {roomSettings.isPublic ? "Anyone with the link can access the drawing" : "Only invited people can access"}
                                </span>
                            </div>
                        </div>

                        {/* Password Protection */}
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Password protection:</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {roomSettings.password ? (
                                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-md border border-green-200">
                                        <Shield size={16} />
                                        <span className="text-sm font-medium">Active</span>
                                        <button 
                                            onClick={() => onUpdateSettings && onUpdateSettings({ password: null })}
                                            className="ml-2 text-green-800 hover:underline text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            value={passwordInput}
                                            onChange={(e) => setPasswordInput(e.target.value)}
                                            placeholder="Set a password"
                                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button 
                                            onClick={() => {
                                                if(passwordInput) {
                                                    onUpdateSettings && onUpdateSettings({ password: passwordInput });
                                                    setPasswordInput('');
                                                }
                                            }}
                                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Set password 🔥
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Share Options */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Share options:</span>
                                <button className="text-sm text-gray-400 hover:text-gray-600">See more</button>
                            </div>
                            <div className="grid grid-cols-5 gap-4">
                                {/* Invite */}
                                <button onClick={() => setShareView('invite')} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors">
                                        <UserPlus size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">Invite to<br/>drawing</span>
                                </button>

                                {/* PNG */}
                                <button onClick={() => onExport && onExport('png')} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors">
                                        <FileImage size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">Share as PNG</span>
                                </button>

                                {/* JPEG */}
                                <button onClick={() => onExport && onExport('jpeg')} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors">
                                        <Download size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">Download<br/>JPEG</span>
                                </button>
                                
                                {/* Gallery (Mock) */}
                                <button className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors">
                                        <Globe size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">Publish to<br/>Gallery</span>
                                </button>

                                {/* Post Selection (Crop) */}
                                <button onClick={() => onExport && onExport('selection')} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors">
                                        <Crop size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">Post selection</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
                ) : (
                <>
                   {/* INVITE VIEW */}
                   <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50">
                        <h2 className="text-xl font-semibold text-gray-800">Invite to Draw</h2>
                        <div className="flex items-center gap-2">
                             <button 
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                                onClick={() => navigator.clipboard.writeText(window.location.href)}
                             >
                                <Link size={16} />
                                Copy link
                             </button>
                             <button 
                                onClick={handleCloseShare}
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                             >
                                <X size={20} />
                             </button>
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex items-center gap-6 px-6 pt-2 border-b border-gray-100/50">
                         <div className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-800 cursor-pointer flex items-center gap-2">
                            <Clock size={16} /> Recent
                         </div>
                         <div className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-800 cursor-pointer flex items-center gap-2">
                             <Users size={16} /> Followers
                         </div>
                         <div className="pb-3 text-sm font-medium text-gray-800 border-b-2 border-gray-800 cursor-pointer flex items-center gap-2">
                             <Mail size={16} /> By Email
                         </div>
                    </div>

                    <div className="p-6">
                        <div className="text-center py-6">
                            <p className="text-gray-600 font-medium">You don't have any recommendations yet.</p>
                            <p className="text-gray-500 text-sm">Invite by email instead!</p>
                        </div>

                        <div className="flex gap-2 mt-4">
                             <div className="flex-1 relative">
                                <input 
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full pl-3 pr-10 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="friend@example.com"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                                />
                                <div className="absolute right-2 top-2 text-green-600">
                                    <Mail size={18} />
                                </div>
                             </div>
                             <button 
                                onClick={handleSendInvite}
                                className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-900 transition-colors"
                             >
                                 <UserPlus size={16} /> Add email
                             </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Email must contain "@" character.</p>
                        
                        <div className="flex justify-end mt-8">
                             <button className="bg-gray-200 text-gray-500 px-6 py-2 rounded-md font-medium cursor-not-allowed">
                                 Invite
                             </button>
                        </div>
                    </div>
                </>
                )}
            </div>
        </div>
    )}
    </>
  );
};

const ShareOption = ({ icon: Icon, label, onClick }) => (
    <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer group">
        <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors">
            <Icon size={20} />
        </div>
        <span className="text-xs text-center text-gray-600 font-medium leading-tight">{label}</span>
    </div>
);

const ToolbarButton = ({ icon: Icon, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 rounded-md text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors focus:outline-none"
  >
    <Icon size={18} />
  </button>
);

export default NavBar;
