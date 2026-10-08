import React from 'react';
import { DepartmentId } from '../types/office';
import { DEPARTMENTS } from '../data/departmentsData';
import { ShieldCheck, Users, Briefcase, ChevronRight, Lock, Award, Presentation } from 'lucide-react';

interface BottomHUDProps {
  activeDepartment: DepartmentId | null;
  onSelectDepartment: (id: DepartmentId) => void;
  onOpenDealDesk: (id: DepartmentId) => void;
}

export const BottomHUD: React.FC<BottomHUDProps> = ({
  activeDepartment,
  onSelectDepartment,
  onOpenDealDesk,
}) => {
  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-none select-none">
      <div className="max-w-[1720px] mx-auto flex flex-col gap-2">
        
        {/* 5 Interactive Suite Cards matching Floor Plan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pointer-events-auto">
          {DEPARTMENTS.map((dept) => {
            const isActive = activeDepartment === dept.id;
            return (
              <div
                key={dept.id}
                onClick={() => {
                  onSelectDepartment(dept.id);
                }}
                className={`group p-2.5 rounded-xl cursor-pointer transition-all border backdrop-blur-xl shadow-xl flex items-center justify-between ${
                  isActive
                    ? 'bg-slate-900/95 border-emerald-500/80 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-slate-950 shadow-md shrink-0"
                    style={{ backgroundColor: dept.accentColor }}
                  >
                    {dept.id === 'acquisitions' ? (
                      <Briefcase className="w-4 h-4" />
                    ) : dept.id === 'dispositions' ? (
                      <Users className="w-4 h-4" />
                    ) : dept.id === 'operations' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : dept.id === 'ceo' ? (
                      <Award className="w-4 h-4" />
                    ) : (
                      <Presentation className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {dept.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {dept.specialistTitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDealDesk(dept.id);
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors shrink-0 ml-1"
                  title={`Inspect ${dept.name}`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Global Live Ticker & Floor Plan Alignment Status */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 px-4 py-2 rounded-xl text-[11px] font-mono text-slate-400 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-300 font-bold uppercase shrink-0">AZRE HQ:</span>
            <span className="text-emerald-400 font-medium truncate">
              Floor Plan Synchronized · 3 AI Specialists (Acquisitions, Dispositions, Operations) · CEO / Approvals · Deal Review Conference Suite
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0 pl-4 border-l border-slate-800 text-slate-400 text-[10px]">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Database Protected: User Authorized Sync Only</span>
          </div>
        </div>

      </div>
    </div>
  );
};
