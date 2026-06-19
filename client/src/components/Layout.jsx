import { NavLink, Outlet } from 'react-router-dom';
import { Shield, Plus, Settings, Github } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 text-white font-semibold text-lg hover:opacity-80 transition">
              <Shield className="w-5 h-5 text-red-500" />
              ThreatForge
            </NavLink>
            <div className="flex items-center gap-1">
              <NavLink to="/" className={({ isActive }) => 
                `px-3 py-1.5 rounded-md text-sm transition ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`
              }>
                Projects
              </NavLink>
              <NavLink to="/new" className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm transition ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`
              }>
                <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" />New</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm transition ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`
              }>
                <span className="flex items-center gap-1"><Settings className="w-3.5 h-3.5" />Config</span>
              </NavLink>
            </div>
          </div>
          <a
            href="https://github.com/aiymfine/threatforge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
