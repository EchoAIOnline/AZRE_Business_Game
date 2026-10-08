import React, { useState } from 'react';
import { DepartmentId, RealEstateDeal, UnderwritingScenario } from '../types/office';
import { DEPARTMENTS, INITIAL_DEALS } from '../data/departmentsData';
import { AzreGoldMedallion, AzreTextLogo } from './Branding';
import {
  ExternalLink,
  ShieldCheck,
  Building2,
  Calculator,
  Users,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  Briefcase,
  X,
  Lock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface DealDeskModalProps {
  initialDepartment: DepartmentId;
  onClose: () => void;
  onSelectDepartmentIn3D: (id: DepartmentId) => void;
}

export const DealDeskModal: React.FC<DealDeskModalProps> = ({
  initialDepartment,
  onClose,
  onSelectDepartmentIn3D,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<DepartmentId>(initialDepartment);
  const [activeTab, setActiveTab] = useState<'workstation' | 'underwriter' | 'pipeline' | 'network' | 'operations'>('workstation');
  const [dealsFilter, setDealsFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Underwriting calculator interactive state
  const [underwriting, setUnderwriting] = useState<UnderwritingScenario>({
    arv: 1850000,
    constructionCost: 875000,
    builderProfitTarget: 370000,
    azreTargetSpread: 35000,
    transactionFees: 5000,
    maxAllowableOffer: 450000,
  });

  const department = DEPARTMENTS.find((d) => d.id === selectedDeptId)!;

  const handleUnderwritingChange = (field: keyof UnderwritingScenario, val: number) => {
    setUnderwriting((prev) => {
      const updated = { ...prev, [field]: val };
      // Max Allowable Offer = ARV - Construction - Builder Profit - AZRE Spread - Transaction Fees
      const computedOffer = Math.max(
        0,
        updated.arv -
          updated.constructionCost -
          updated.builderProfitTarget -
          updated.azreTargetSpread -
          updated.transactionFees
      );
      return {
        ...updated,
        maxAllowableOffer: computedOffer,
      };
    });
  };

  const filteredDeals = INITIAL_DEALS.filter((deal) => {
    const matchesFilter =
      dealsFilter === 'all' ||
      (dealsFilter === 'brookhaven' && deal.submarket === 'Brookhaven') ||
      (dealsFilter === 'buckhead' && deal.submarket === 'Buckhead') ||
      (dealsFilter === 'contract' && deal.stage.includes('Contract')) ||
      (dealsFilter === 'closed' && deal.stage.includes('Closed'));

    const matchesSearch =
      searchQuery === '' ||
      deal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.submarket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.propertyType.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in select-text">
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <AzreGoldMedallion size={40} />
            <div>
              <div className="flex items-center gap-2">
                <AzreTextLogo layout="horizontal" size="sm" />
                <span className="text-slate-600">|</span>
                <span className="text-xs font-bold text-white tracking-wider">DEALDESK ULTRA</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span className="text-emerald-400">● Live Headquarters Workstation</span>
                <span>·</span>
                <a
                  href="https://dealdesk.asharizakargroup.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1 font-mono"
                >
                  dealdesk.asharizakargroup.com
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Launch DealDesk Ultra Button */}
            <a
              href="https://dealdesk.asharizakargroup.com"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-[#00FF66] hover:bg-[#00e65c] transition-colors rounded-lg flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch DealDesk Ultra</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded-lg"
              title="Close Workstation View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subheader: Department Switcher Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          {/* Department Selection */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px] uppercase mr-1">Workstation:</span>
            {DEPARTMENTS.map((dept) => {
              const isSelected = dept.id === selectedDeptId;
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDeptId(dept.id);
                    onSelectDepartmentIn3D(dept.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: dept.accentColor }}
                  />
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>

          {/* Module Views */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('workstation')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'workstation' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Desk Overview
            </button>
            <button
              onClick={() => setActiveTab('underwriter')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'underwriter' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SureCash Underwriting
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'pipeline' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deal Pipeline
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'network' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              The Network
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'operations' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weissman PC Escrow
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60">
          
          {/* TAB 1: WORKSTATION OVERVIEW */}
          {activeTab === 'workstation' && (
            <div className="space-y-6">
              {/* Specialist Profile Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                    {department.specialistName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{department.specialistTitle}</h2>
                      <span className="text-xs text-slate-400">({department.specialistName})</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{department.shortDesc}</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3" />
                      <span>{department.dealDeskModule}</span>
                      <span>·</span>
                      <span className="text-slate-400">{department.focusArea}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectDepartmentIn3D(department.id)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>Focus 3D Camera On Desk</span>
                  </button>
                </div>
              </div>

              {/* Department Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {department.primaryMetrics.map((metric, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-medium">{metric.label}</p>
                    <p className="text-xl font-extrabold text-white font-mono mt-1">{metric.value}</p>
                    {metric.change && (
                      <p className="text-[10px] text-emerald-400 font-mono mt-1">{metric.change}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Operational Tasks & Screen Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Tasks */}
                <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Current Specialist Workflows</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">DealDesk Ultra Sync: ACTIVE</span>
                  </div>
                  <ul className="space-y-2.5">
                    {department.currentTasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* SureCash Offer Standard Terms Box */}
                <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>The SureCash Offer™ Standard Terms</span>
                    </h3>
                    <span className="text-[11px] text-amber-400 font-mono">AZRE Protocol</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Purchase Condition</span>
                      <span className="font-semibold text-white">As-Is (No repairs required from seller)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Earnest Money Deposit</span>
                      <span className="font-semibold text-emerald-400 font-mono">1% of agreed purchase price</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Due Diligence Window</span>
                      <span className="font-semibold text-white">7 Calendar Days (Contractor verification)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Closing Timeline</span>
                      <span className="font-semibold text-white">Approximately 30 Days</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Closing Attorney</span>
                      <span className="font-semibold text-amber-400 font-mono">Weissman PC (Preferred Closing Counsel)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SURECASH ARV UNDERWRITING ENGINE */}
          {activeTab === 'underwriter' && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-400" />
                      <span>SureCash ARV Underwriting Model</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Back into maximum allowable acquisition pricing for Metro Atlanta teardowns and redevelopments.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Acquisition Ratio</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {((underwriting.maxAllowableOffer / underwriting.arv) * 100).toFixed(1)}% of ARV
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                  {/* Inputs */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <label className="text-slate-300 font-medium">Projected Finished ARV (Comps within 1.0 mi)</label>
                        <span className="font-mono text-emerald-400 font-bold">${underwriting.arv.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min={600000}
                        max={3500000}
                        step={25000}
                        value={underwriting.arv}
                        onChange={(e) => handleUnderwritingChange('arv', Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Based on newly constructed comps in Brookhaven, Buckhead, Sandy Springs</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <label className="text-slate-300 font-medium">Builder Demolition & Construction Budget</label>
                        <span className="font-mono text-red-400 font-bold">${underwriting.constructionCost.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min={200000}
                        max={1800000}
                        step={25000}
                        value={underwriting.constructionCost}
                        onChange={(e) => handleUnderwritingChange('constructionCost', Number(e.target.value))}
                        className="w-full accent-red-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <label className="text-slate-300 font-medium">Builder Required Return / Profit (Typically 18-22%)</label>
                        <span className="font-mono text-amber-400 font-bold">${underwriting.builderProfitTarget.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min={100000}
                        max={800000}
                        step={10000}
                        value={underwriting.builderProfitTarget}
                        onChange={(e) => handleUnderwritingChange('builderProfitTarget', Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">AZRE Target Spread</label>
                        <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-emerald-400 font-bold">
                          ${underwriting.azreTargetSpread.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Attorney & Closing Fees</label>
                        <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-slate-300 font-bold">
                          ${underwriting.transactionFees.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Waterfall Output */}
                  <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Financial Waterfall Breakdown
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">Gross ARV Value</span>
                          <span className="font-mono font-bold text-white">${underwriting.arv.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">(-) Construction / Demo</span>
                          <span className="font-mono text-red-400">- ${underwriting.constructionCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">(-) Builder Margin</span>
                          <span className="font-mono text-amber-400">- ${underwriting.builderProfitTarget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">(-) AZRE Transaction Spread</span>
                          <span className="font-mono text-emerald-400">- ${underwriting.azreTargetSpread.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-400">(-) Weissman PC & Closing</span>
                          <span className="font-mono text-slate-400">- ${underwriting.transactionFees.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">MAX ALLOWABLE SURECASH OFFER</p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-3xl font-black text-[#00FF66] font-mono">
                          ${underwriting.maxAllowableOffer.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          1% EMD: ${(underwriting.maxAllowableOffer * 0.01).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Proposal ready for submission via Acquisitions Specialist with standard 7-day DD and Weissman PC closing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REAL ESTATE PIPELINE & PROTECTED DATABASE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              {/* Mandatory Database Safeguard Notice */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-300">
                    PROTECTED DATABASE MODE · SYNCHRONIZED READ-ONLY ACCESS
                  </p>
                  <p className="text-emerald-400/80 mt-0.5 leading-relaxed">
                    Per strict Ashari Zakar Real Estate database policy: Only the user is authorized to add or remove properties and deals within the Google Sheets database (either manually or via import). Automated creation or deletion of properties is permanently disabled.
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  {['all', 'brookhaven', 'buckhead', 'contract', 'closed'].map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setDealsFilter(filterKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors uppercase ${
                        dealsFilter === filterKey
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filterKey}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search address, submarket..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Deals Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="py-3 px-4">Deal ID & Address</th>
                      <th className="py-3 px-4">Property Type</th>
                      <th className="py-3 px-4">Asking / Offer</th>
                      <th className="py-3 px-4">ARV / Resale</th>
                      <th className="py-3 px-4">Gross Spread</th>
                      <th className="py-3 px-4">Stage / Counsel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDeals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-white">{deal.address}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {deal.id} · {deal.submarket} ({deal.lotSize})
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-300 font-medium">{deal.propertyType}</span>
                          <p className="text-[10px] text-slate-500">Built {deal.yearBuilt}</p>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <p className="text-slate-400">Ask: ${deal.askingPrice.toLocaleString()}</p>
                          <p className="text-emerald-400 font-bold">Offer: ${deal.sureCashOffer.toLocaleString()}</p>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <p className="text-slate-300">ARV: ${deal.projectedArv.toLocaleString()}</p>
                          <p className="text-amber-400">Resale: ${deal.builderResalePrice.toLocaleString()}</p>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <p className="text-[#00FF66] font-extrabold">+${deal.grossSpread.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Net: +${deal.netProfit.toLocaleString()}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-200">{deal.stage}</p>
                          <p className="text-[10px] text-amber-400 font-mono">{deal.closingAttorney}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: THE NETWORK (DISPOSITIONS) */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>The Network™ Builder & Investor Directory</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vetted luxury homebuilders and redevelopment buyers ready to acquire contracted assets.
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono font-bold">38 Vetted Buyers Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {[
                    {
                      name: 'Pinnacle Custom Homes LLC',
                      type: 'Luxury Homebuilder',
                      market: 'Brookhaven (30319)',
                      buyBox: 'Tear-downs on 0.5+ acres, $1.8M - $2.4M new construction end value',
                      capacity: '$3.5M Cash & Construction Facility',
                      preferredAttorney: 'Weissman PC',
                    },
                    {
                      name: 'Atlanta Landmark Estates',
                      type: 'High-End Developer',
                      market: 'Buckhead (30327)',
                      buyBox: 'Prime lots suitable for $2.5M - $4M luxury estates',
                      capacity: '$6.0M Line of Credit',
                      preferredAttorney: 'Weissman PC',
                    },
                    {
                      name: 'Northside Rehab Partners',
                      type: 'Residential Renovation Firm',
                      market: 'Sandy Springs / Dunwoody',
                      buyBox: 'Outdated 1970s ranches needing gut rehabilitation',
                      capacity: '$1.8M Liquid Capital',
                      preferredAttorney: 'Weissman PC',
                    },
                    {
                      name: 'Apex Residential Builders',
                      type: 'Spec Home Builder',
                      market: 'Dunwoody / Roswell',
                      buyBox: 'Vacant lots or teardowns for 4,000+ sq ft modern farmhouses',
                      capacity: '$2.4M Commercial Facility',
                      preferredAttorney: 'Weissman PC',
                    },
                  ].map((builder, idx) => (
                    <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">{builder.name}</h3>
                        <span className="text-[10px] text-amber-400 font-mono">{builder.type}</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium">{builder.market}</p>
                      <p className="text-xs text-slate-300 leading-snug">{builder.buyBox}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                        <span>Capacity: {builder.capacity}</span>
                        <span className="text-amber-400">{builder.preferredAttorney}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OPERATIONS & WEISSMAN PC ESCROW */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>Weissman PC Closing & Transaction Logistics</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Coordinating simultaneous double closings, escrow funds, and 7-day inspection windows.
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-mono font-bold">100% Weissman PC Closing Rate</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-mono">Active 7-Day Due Diligence</p>
                    <p className="text-2xl font-black text-white font-mono mt-1">2 Deals</p>
                    <p className="text-xs text-emerald-400 mt-1">Contractor walkthroughs scheduled</p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-mono">Weissman PC Escrow Balance</p>
                    <p className="text-2xl font-black text-amber-400 font-mono mt-1">$18,400</p>
                    <p className="text-xs text-slate-400 mt-1">1% EMD across active purchase contracts</p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-mono">Transactional Facility</p>
                    <p className="text-2xl font-black text-cyan-400 font-mono mt-1">$1,000,000</p>
                    <p className="text-xs text-cyan-300 mt-1">Short-term double closing funding</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Double-Closing Protocol (A-B & B-C Simultaneous Settlement)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    AZRE operates as principal: purchasing property from seller at agreed price (A-to-B) and immediately reselling to the builder/investor (B-to-C) through Weissman PC. Spreads are distributed upon final settlement without taking long-term development or holding risk.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-white">DealDesk Ultra Engine Connected</span>
            <span>·</span>
            <span>Atlanta, Georgia</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg"
            >
              Return to 3D Office
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
