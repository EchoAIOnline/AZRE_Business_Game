import React from 'react';
import { CameraMode, DepartmentId } from '../types/office';
import { AzreGoldMedallion, AzreTextLogo } from './Branding';
import {
  Compass,
  Footprints,
  Sun,
  Volume2,
  VolumeX,
  ExternalLink,
  Laptop,
  Maximize2,
  Building,
} from 'lucide-react';

interface HeaderHUDProps {
  cameraMode: CameraMode;
  onSetCameraMode: (mode: CameraMode) => void;
  onOpenDealDesk: (dept: DepartmentId) => void;
  activeDepartment: DepartmentId | null;
  brightness: number;
  onSetBrightness: (val: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  cameraMode,
  onSetCameraMode,
  onOpenDealDesk,
  activeDepartment,
  brightness,
  onSetBrightness,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 pointer-events-none select-none">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 max-w-[1720px] mx-auto">
        
        {/* Brand & Identity Badge (Left) */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl">
          <AzreGoldMedallion size={36} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <AzreTextLogo layout="horizontal" size="sm" />
              <span className="text-slate-600">·</span>
              <span className="text-[11px] font-bold text-white tracking-widest uppercase">
                3D HEADQUARTERS
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
              <span className="text-emerald-400">● LIVE DEALDESK SYSTEM</span>
              <span>·</span>
              <a
                href="https://dealdesk.asharizakargroup.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-emerald-400 underline inline-flex items-center gap-1 pointer-events-auto"
              >
                dealdesk.asharizakargroup.com
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Camera Navigation Segmented Controls (Center) */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => onSetCameraMode('isometric')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              cameraMode === 'isometric'
                ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Floorplan 3D</span>
          </button>

          <button
            onClick={() => onSetCameraMode('fpv')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              cameraMode === 'fpv'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>FPV Walk</span>
          </button>

          <span className="w-px h-5 bg-slate-800 mx-1 shrink-0" />

          {/* Department Stations */}
          <button
            onClick={() => onSetCameraMode('acquisitions')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              cameraMode === 'acquisitions'
                ? 'bg-slate-800 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Acquisitions</span>
          </button>

          <button
            onClick={() => onSetCameraMode('dispositions')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              cameraMode === 'dispositions'
                ? 'bg-slate-800 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Dispositions</span>
          </button>

          <button
            onClick={() => onSetCameraMode('operations')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              cameraMode === 'operations'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Operations</span>
          </button>

          <button
            onClick={() => onSetCameraMode('ceo')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              cameraMode === 'ceo'
                ? 'bg-slate-800 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>CEO / Approvals</span>
          </button>

          <button
            onClick={() => onSetCameraMode('deal-review')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              cameraMode === 'deal-review'
                ? 'bg-slate-800 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Deal Review</span>
          </button>

          <button
            onClick={() => onSetCameraMode('entry')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 ${
              cameraMode === 'entry'
                ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Office Entry Doors"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Entry</span>
          </button>
        </div>

        {/* Quick Actions & Environmental Controls (Right) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-2xl">
          {/* Bright Architectural Lighting Control */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800" title="Bright Architectural Lighting">
            <Sun className="w-4 h-4 text-amber-300" />
            <input
              type="range"
              min="0.8"
              max="1.6"
              step="0.05"
              value={brightness}
              onChange={(e) => onSetBrightness(parseFloat(e.target.value))}
              className="w-16 accent-amber-400 cursor-pointer"
              title={`Adjust Bright Architectural Lighting (${Math.round(brightness * 100)}%)`}
            />
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
              soundEnabled ? 'text-emerald-400 bg-slate-900' : 'text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Office Audio' : 'Enable Office Atmosphere Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Inspect Active Workstation / DealDesk */}
          <button
            onClick={() => onOpenDealDesk(activeDepartment || 'acquisitions')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors rounded-xl flex items-center gap-1.5"
          >
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inspect DealDesk</span>
          </button>

          {/* Launch External DealDesk */}
          <a
            href="https://dealdesk.asharizakargroup.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#00FF66] hover:bg-[#00e65c] transition-colors rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/20"
          >
            <span>Open DealDesk</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
};
