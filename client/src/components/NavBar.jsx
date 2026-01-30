import { useState, useRef, useEffect } from "react";
import { DraftingCompass } from "lucide-react";
import {
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
} from "lucide-react";

const menus = {
  File: [
    { label: "Home", icon: Home },
    { label: "New", icon: FilePlus },
    { label: "Quick new (same size)", icon: Copy },
    { label: "Import as a new canvas", icon: Upload },
    { label: "Duplicate", icon: Files },
    { label: "Export as", icon: Share2 },
    { label: "Save to version history", icon: Save },
    { label: "Open version history", icon: History },
    { label: "Move to bin", icon: Trash2 },
    { label: "Drawing settings", icon: Settings },
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
    { label: "Manage Users", icon: Users },
    { label: "Permissions", icon: Shield },
    { label: "Logs", icon: FileText },
  ],
};

const NavBar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={navRef} className="relative bg-white shadow-sm">
      <div className="flex items-center px-3 py-2">
        <div className="flex items-center gap-2 bg-green-700 px-2 py-1 rounded-md cursor-pointer text-white">
          <DraftingCompass size={18} />
          {/* <span className="font-semibold">ArcCanvas</span> */}
        </div>
        <div className="flex ml-6 cursor-pointer">
          {Object.keys(menus).map((menu) => (
            <div
              key={menu}
              className="relative cursor-pointer"
              onMouseEnter={() => setOpenMenu(menu)}
            >
              <button
                onClick={() => setOpenMenu(menu)}
                className={`px-2 py-1 rounded hover:text-green-700 cursor-pointer ${
                  openMenu === menu ? "text-green-700" : ""
                }`}
              >
                {menu}
              </button>
              {openMenu === menu && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white shadow-xl z-50">
                  {menus[menu].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-4 py-2 text-sm
                                   hover:text-green-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          console.log(menu, item.label);
                          setOpenMenu(null);
                        }}
                      >
                        <Icon size={16} className="text-gray-500" />
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
    </div>
  );
};

export default NavBar;
