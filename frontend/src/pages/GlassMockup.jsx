import React, { useState } from 'react';
import {
  LayoutDashboard, Compass, MapPin, Users, Shield, TrendingUp,
  Activity, Bell, Search, ChevronRight, Sparkles, ArrowUpRight,
  Layers, Car, CheckCircle2, X
} from 'lucide-react';

export default function GlassMockup() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="relative min-h-screen w-full bg-[#05070e] text-slate-100 font-sans overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-600/25 via-purple-700/20 to-transparent blur-[140px]" />
        <div className="absolute top-[20%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-cyan-500/20 via-blue-600/20 to-transparent blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[25%] w-[60vw] h-[55vw] rounded-full bg-gradient-to-t from-violet-700/20 via-fuchsia-600/15 to-transparent blur-[180px]" />
      </div>
      <div className="relative z-10 flex flex-1 h-screen overflow-hidden p-3 sm:p-5 gap-4">
        {/* Translucent Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] p-5 justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)] backdrop-blur-xl">
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <div className="text-sm font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">Aura Vision</div>
                <div className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">SaaS Glass OS</div>
              </div>
            </div>

            <nav className="space-y-1.5">
              {[
                { id: 'overview', label: 'Executive Pulse', icon: LayoutDashboard },
                { id: 'analytics', label: 'Trips & Fleet', icon: Compass },
                { id: 'spatial', label: 'Spatial Routes', icon: MapPin },
                { id: 'passengers', label: 'Active Roster', icon: Users },
                { id: 'telemetry', label: 'Live Telemetry', icon: Activity },
                { id: 'security', label: 'Access & Shield', icon: Shield },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-white/[0.08] text-white border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 p-[1px]">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold text-cyan-300">IK</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">Iko Enterprise</div>
              <div className="text-[10px] text-slate-400 truncate">v4.9 Dark Glass</div>
            </div>
          </div>
        </aside>

        {/* Workspace Container */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Top Nav */}
          <header className="h-16 px-6 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center justify-between">
            <div className="relative flex items-center w-72 sm:w-96">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search telemetry, routes, drivers..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/40 backdrop-blur-xl"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all backdrop-blur-xl">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              </button>
              <button 
                onClick={() => setShowModal(!showModal)}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-200 transition-all backdrop-blur-xl flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-300" />
                <span>Toggle Modal</span>
              </button>
            </div>
          </header>

          {/* Main Dashboard Cards */}
          <main className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Fleet Mobility Rate', value: '98.4%', change: '+4.2% vs lw', icon: Activity },
                { title: 'Concurrent Carpools', value: '1,428', change: '84 active now', icon: Car },
                { title: 'Efficiency Quotient', value: '94.2', change: '+0.8 index', icon: TrendingUp },
                { title: 'Carbon Offset Savings', value: '312.8 T', change: 'Eco Tier 1', icon: Sparkles },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className="p-5 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">{m.title}</span>
                      <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-cyan-300"><Icon className="w-4 h-4" /></div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-white">{m.value}</div>
                    <div className="mt-1 text-[11px] font-medium text-cyan-400/90 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /><span>{m.change}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]">
                <h3 className="text-sm font-bold text-white">Transit Volume & Demand Density</h3>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">Real-time telemetry stream across major regional corridors</p>
                <div className="relative h-52 w-full rounded-2xl bg-white/[0.015] border border-white/[0.04] p-4 flex items-end justify-between gap-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                  {[45, 62, 58, 75, 90, 68, 82, 95, 78, 88, 100, 84, 91, 72, 85].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div style={{ height: `${val}%` }} className="w-full rounded-xl bg-gradient-to-t from-blue-600/40 via-cyan-400/50 to-white/70 border border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.3)]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Live Dispatches</h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[10px] font-bold text-cyan-300">Live</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { from: 'Bangkok', to: 'Khao Yai', driver: 'Alex R.', status: 'En route' },
                      { from: 'Chiang Mai', to: 'Pai Valley', driver: 'Nattapong', status: 'Boarding' },
                      { from: 'Phuket', to: 'Krabi Pier', driver: 'Elena K.', status: 'Departed' },
                    ].map((trip, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>{trip.from} → {trip.to}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">{trip.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">Pilot: {trip.driver}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full mt-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2">
                  <span>Open Spatial Map</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Translucent Floating Glass Modal */}
        {showModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-3xl bg-white/[0.04] backdrop-blur-3xl border border-white/[0.18] shadow-[0_25px_70px_rgba(0,0,0,0.6),inset_0_1.5px_0_rgba(255,255,255,0.3)] p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-[10px] font-bold text-cyan-300">
                    <Sparkles className="w-3 h-3" />
                    <span>Vision Pro Material</span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">Party Authorization</h2>
                  <p className="text-xs text-slate-400">Security clearance for Bangkok → Khao Yai</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07] backdrop-blur-xl space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Vehicle</span><span className="font-bold text-white">Tesla Model Y (Spatial Auto)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Contribution</span><span className="font-bold text-cyan-300 font-mono">฿ 240.00 / seat</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Verification</span><span className="font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Biometric Verified</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-xs font-bold text-slate-300">Dismiss</button>
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 text-xs font-bold text-white shadow-[0_0_25px_rgba(56,189,248,0.25)] flex items-center justify-center gap-1.5">
                  <span>Authorize</span><ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
