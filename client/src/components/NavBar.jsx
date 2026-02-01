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
  Download,
  ChevronDown,
  Grid
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const generateRoomId = () => Math.random().toString(36).substring(2, 9);

const menus = {
  File: [
    { label: "Home", icon: Home, shortcut: "" },
    { label: "New", icon: FilePlus, shortcut: "" },
    { label: "Quick new (same size)", icon: Copy, shortcut: "" },
    { label: "Import as a new canvas", icon: Upload, shortcut: "" },
    { label: "Duplicate", icon: Files, shortcut: "" },
    { label: "Export as", icon: Share2, shortcut: "", hasSubmenu: true },
    { label: "Save", icon: Save, shortcut: "Ctrl+S" },
    { label: "Save to version history", icon: History, shortcut: "" },
    { label: "Open version history", icon: Clock, shortcut: "" },
    { label: "Move to bin", icon: Trash2, shortcut: "" },
    { label: "Drawing settings", icon: Settings, shortcut: "" },
  ],
  Edit: [
    { label: "Undo", icon: Undo2, shortcut: "Ctrl+Z" },
    { label: "Redo", icon: Redo2, shortcut: "Ctrl+Shift+Z" },
    { label: "Cut", icon: Scissors, shortcut: "Ctrl+X" },
    { label: "Copy", icon: Clipboard, shortcut: "Ctrl+C" },
    { label: "Copy merged", icon: Clipboard, shortcut: "Ctrl+Shift+C" },
    { label: "Copy merged (no bg)", icon: Clipboard, shortcut: "" },
    { label: "Paste", icon: Clipboard, shortcut: "Ctrl+V" },
    { label: "Paste in place", icon: Clipboard, shortcut: "Ctrl+Shift+V" },
    { label: "Paste on new layer", icon: Clipboard, shortcut: "" },
    { label: "Paste file", icon: Upload, shortcut: "" },
    { label: "Select all", icon: MousePointer2, shortcut: "Ctrl+A" },
    { label: "Deselect", icon: MousePointer2, shortcut: "Ctrl+D" },
    { label: "Invert selection", icon: MousePointer2, shortcut: "Ctrl+Shift+I" },
    { label: "Delete selection", icon: Trash2, shortcut: "Delete" },
    { label: "Arrange Layers", icon: Sliders, shortcut: "", hasSubmenu: true },
    { label: "Trim layer", icon: Crop, shortcut: "" },
    { label: "Pen pressure settings", icon: Sliders, shortcut: "" },
    { label: "Application settings", icon: Settings, shortcut: "" },
  ],
  View: [
    { label: "Zoom in", icon: ZoomIn, shortcut: "=" },
    { label: "Zoom out", icon: ZoomOut, shortcut: "-" },
    { label: "Flip horizontally", icon: Maximize, shortcut: "H" },
    { label: "Fit on screen", icon: Maximize, shortcut: "Home" },
    { label: "Actual pixels", icon: Maximize, shortcut: "End" },
    { label: "Reset rotation", icon: Maximize, shortcut: "Esc" },
    { label: "Full screen", icon: Maximize, shortcut: "F11" },
    { label: "Show in grayscale", icon: Droplet, shortcut: "" },
    { label: "Reference Image", icon: FileImage, shortcut: "", hasSubmenu: true },
    { label: "Save view", icon: Save, shortcut: "" },
    { label: "Restore view", icon: History, shortcut: "" },
    { label: "Show perspective grids", icon: Grid, shortcut: "" },
    { label: "Personal layer visibility", icon: MousePointer2, shortcut: "", hasSubmenu: true },
    { label: "Activity Stats", icon: Info, shortcut: "", hasSubmenu: true },
  ],
  Filter: [
    { label: "Last filter...", icon: Droplet, shortcut: "Ctrl+Alt+F" },
    { label: "Gaussian blur", icon: Droplet, shortcut: "" },
    { label: "Motion blur", icon: Droplet, shortcut: "" },
    { label: "Hue / Saturation / Lightness", icon: Sliders, shortcut: "" },
    { label: "Brightness / Contrast", icon: Sliders, shortcut: "" },
    { label: "Curves", icon: Sliders, shortcut: "" },
  ],
  Help: [
    { label: "Getting started", icon: BookOpen, shortcut: "" },
    { label: "Help center", icon: Info, shortcut: "" },
    { label: "Chat with support", icon: Users, shortcut: "" },
    { label: "Changelog", icon: FileText, shortcut: "" },
    { label: "Request feature", icon: UserPlus, shortcut: "" },
    { label: "Report bug", icon: Shield, shortcut: "" },
  ],
  Admin: [
    { label: "Users", icon: Users, shortcut: "" },
    { label: "Permissions", icon: Shield, shortcut: "" },
    { label: "Logs", icon: FileText, shortcut: "" },
  ],
};

const NavBar = ({ onUndo, onRedo, activeUsers = [], onExport, onInvite, roomSettings = { isPublic: false, password: null }, onUpdateSettings, drawingName = 'Untitled Drawing', onRename, onHome }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareView, setShareView] = useState('menu'); // 'menu' | 'invite'
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(drawingName);
  const fileInputRef = useRef(null);
  
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

    const createNewCanvas = () => {
      const newId = generateRoomId();
      navigate(`/canvas/${newId}`);
    };

    const handleMenuAction = (label) => {
      switch (label) {
        // File Menu
        case 'Home':
          if (onHome) onHome();
          else navigate('/');
          break;
        case 'New':
        case 'Quick new (same size)':
          createNewCanvas();
          break;
        case 'Import as a new canvas':
          fileInputRef.current?.click();
          break;
        case 'Duplicate':
          window.dispatchEvent(new CustomEvent('canvas:duplicate'));
          break;
        case 'Export as':
          setIsShareOpen(true);
          setShareView('menu');
          break;
        case 'Save':
          window.dispatchEvent(new CustomEvent('canvas:save'));
          break;
        case 'Save to version history':
          window.dispatchEvent(new CustomEvent('canvas:save-version'));
          break;
        case 'Open version history':
          window.dispatchEvent(new CustomEvent('canvas:open-history'));
          break;
        case 'Move to bin':
          window.dispatchEvent(new CustomEvent('canvas:move-to-bin'));
          break;
        case 'Drawing settings':
          window.dispatchEvent(new CustomEvent('canvas:drawing-settings'));
          break;

        // Edit Menu
        case 'Undo':
          window.dispatchEvent(new CustomEvent('canvas:undo'));
          onUndo && onUndo();
          break;
        case 'Redo':
          window.dispatchEvent(new CustomEvent('canvas:redo'));
          onRedo && onRedo();
          break;
        case 'Cut':
          window.dispatchEvent(new CustomEvent('canvas:cut'));
          break;
        case 'Copy':
        case 'Copy merged':
        case 'Copy merged (no bg)':
          window.dispatchEvent(new CustomEvent('canvas:copy'));
          break;
        case 'Paste':
        case 'Paste in place':
        case 'Paste on new layer':
          window.dispatchEvent(new CustomEvent('canvas:paste'));
          break;
        case 'Paste file':
          fileInputRef.current?.click();
          break;
        case 'Select all':
          window.dispatchEvent(new CustomEvent('canvas:select-all'));
          break;
        case 'Deselect':
          window.dispatchEvent(new CustomEvent('canvas:deselect'));
          break;
        case 'Invert selection':
          window.dispatchEvent(new CustomEvent('canvas:invert-selection'));
          break;
        case 'Delete selection':
          window.dispatchEvent(new CustomEvent('canvas:delete-selection'));
          break;
        case 'Trim layer':
          window.dispatchEvent(new CustomEvent('canvas:trim-layer'));
          break;
        case 'Pen pressure settings':
        case 'Application settings':
          window.dispatchEvent(new CustomEvent('canvas:settings'));
          break;

        // View Menu
        case 'Zoom in':
          window.dispatchEvent(new CustomEvent('canvas:zoom-in'));
          break;
        case 'Zoom out':
          window.dispatchEvent(new CustomEvent('canvas:zoom-out'));
          break;
        case 'Flip horizontally':
          window.dispatchEvent(new CustomEvent('canvas:flip-horizontal'));
          break;
        case 'Fit on screen':
        case 'Actual pixels':
        case 'Reset rotation':
          window.dispatchEvent(new CustomEvent('canvas:reset-view'));
          break;
        case 'Full screen':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
          } else {
            document.exitFullscreen?.();
          }
          break;
        case 'Show in grayscale':
          window.dispatchEvent(new CustomEvent('canvas:toggle-grayscale'));
          break;
        case 'Save view':
          window.dispatchEvent(new CustomEvent('canvas:save-view'));
          break;
        case 'Restore view':
          window.dispatchEvent(new CustomEvent('canvas:restore-view'));
          break;
        case 'Show perspective grids':
          window.dispatchEvent(new CustomEvent('canvas:toggle-grids'));
          break;

        // Filter Menu
        case 'Gaussian blur':
        case 'Motion blur':
          window.dispatchEvent(new CustomEvent('canvas:apply-blur'));
          break;
        case 'Hue / Saturation / Lightness':
        case 'Brightness / Contrast':
        case 'Curves':
          window.dispatchEvent(new CustomEvent('canvas:apply-filter'));
          break;

        // Help Menu
        case 'Getting started':
        case 'Help center':
          window.open('https://docs.example.com', '_blank');
          break;
        case 'Chat with support':
          window.open('https://support.example.com', '_blank');
          break;
        case 'Changelog':
          window.open('https://changelog.example.com', '_blank');
          break;
        case 'Request feature':
        case 'Report bug':
          window.open('https://github.com/example/issues', '_blank');
          break;

        // Admin Menu (Keep existing)
        default:
          break;
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              window.dispatchEvent(new CustomEvent('canvas:import-image', { detail: { dataUrl: reader.result } }));
            };
            reader.readAsDataURL(file);
          }
          e.target.value = '';
        }}
      />
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

          <div className="flex items-center justify-between space-x-1 ml-2 overflow-x-auto no-scrollbar shrink relative">
            {Object.keys(menus).map((menu) => (
              <div key={menu} className="relative shrink-0">
                <button
                  className={`px-3 py-1 rounded text-sm font-medium hover:text-green-700 hover:bg-green-50 transition-colors ${
                    openMenu === menu ? "text-green-700 bg-green-50" : "text-gray-700"
                  }`}
                  onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
                  onMouseEnter={() => setOpenMenu(menu)}
                >
                  {menu}
                </button>
                {openMenu === menu && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[100]">
                    {menus[menu].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors group"
                          onClick={() => {
                            if (!item.hasSubmenu) {
                              handleMenuAction(item.label);
                              setOpenMenu(null);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={16} className="text-gray-500 group-hover:text-green-600" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.shortcut && (
                              <span className="text-xs text-gray-400 font-mono">{item.shortcut}</span>
                            )}
                            {item.hasSubmenu && (
                              <ChevronDown size={14} className="text-gray-400 -rotate-90" />
                            )}
                          </div>
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
            <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl w-125 overflow-hidden border border-white/50">
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

export default NavBar;
