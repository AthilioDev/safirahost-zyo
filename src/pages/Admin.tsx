import { useState, useEffect, useRef } from "react";
import {
  Users, Eye, ShieldAlert, BarChart3, Search,
  Ban, CheckCircle, Gem, Shield, LogOut, Award,
  Trash2, X, TrendingUp, Bell, Send, ChevronDown,
  Pin, Megaphone, Calendar, UserCheck, Sparkles,
  ChevronLeft, ChevronRight, Activity, Database,
  RefreshCw, ArrowUpRight, ShieldCheck
} from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── SPARKLINE ─────────────────── */
const Sparkline = ({ data, color = "#f97316" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data, 1);
  const w = 160, h = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#g${color.replace("#","")})`} stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
};

/* ─── BAR CHART ─────────────────── */
const BarChart = ({ data, color = "#f97316" }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full rounded-sm transition-all" style={{ height: `${(d.value / max) * 64}px`, background: color, opacity: 0.75 }} />
          <span className="text-[8px] font-medium" style={{ color: "#222" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── STATUS PILL ───────────────── */
const StatusPill = ({ active }: { active: boolean }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest"
    style={{
      background: active ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${active ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
      color: active ? "#10b981" : "#ef4444"
    }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#10b981" : "#ef4444" }} />
    {active ? "Ativo" : "Banido"}
  </span>
);

const genDailyData = () =>
  ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(label => ({ label, value: Math.floor(Math.random()*40)+5 }));
const genMonthlyData = () =>
  ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map(label => ({ label, value: Math.floor(Math.random()*200)+20 }));

/* ─── ADMIN COMPONENT ───────────── */
const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview"|"users"|"badges"|"announcements"|"reports">("overview");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, totalViews: 0 });
  const [chartPeriod, setChartPeriod] = useState<"day"|"month">("day");
  const [dailyData] = useState(genDailyData());
  const [monthlyData] = useState(genMonthlyData());

  const USERS_PER_PAGE = 10;
  const [page, setPage] = useState(1);

  const [grantUserId, setGrantUserId] = useState<string|null>(null);
  const [grantBadgeId, setGrantBadgeId] = useState("");
  const [viewBadgesUserId, setViewBadgesUserId] = useState<string|null>(null);
  const [viewBadgesName, setViewBadgesName] = useState("");
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const [announcements, setAnnouncements] = useState([
    { id: 1, text: "Deploy agendado para sexta-feira às 23h. Mantenham os tickets fechados.", author: "System", pinned: true, ts: "Hoje, 09:14" },
    { id: 2, text: "Reunião de equipe amanhã às 15h no Discord.", author: "Admin", pinned: false, ts: "Ontem, 18:02" },
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [pinNew, setPinNew] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { setPage(1); }, [search]);

  const fetchData = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (profiles) {
      setUsers(profiles);
      setStats({
        total: profiles.length,
        active: profiles.filter(p => !p.is_banned).length,
        banned: profiles.filter(p => p.is_banned).length,
        totalViews: profiles.reduce((s, p) => s + (p.views || 0), 0),
      });
    }
    const { data: badges } = await supabase.from("badges").select("*");
    if (badges) setAllBadges(badges);
  };

  const toggleBan = async (p: any) => {
    await supabase.from("profiles").update({ is_banned: !p.is_banned }).eq("id", p.id);
    toast.success(!p.is_banned ? "Usuário banido" : "Usuário desbanido");
    fetchData();
  };
  const toggleVerified = async (p: any) => {
    await supabase.from("profiles").update({ is_verified: !p.is_verified }).eq("id", p.id);
    toast.success(!p.is_verified ? "Verificado" : "Verificação removida");
    fetchData();
  };
  const grantBadge = async () => {
    if (!grantUserId || !grantBadgeId) return;
    const { error } = await supabase.from("user_badges").insert({ user_id: grantUserId, badge_id: grantBadgeId });
    if (error) { toast.error(error.message); return; }
    toast.success("Badge concedida!");
    setGrantUserId(null); setGrantBadgeId("");
  };
  const openUserBadges = async (userId: string, name: string) => {
    setViewBadgesUserId(userId); setViewBadgesName(name);
    const { data } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", userId);
    setUserBadges(data || []);
  };
  const removeBadge = async (id: string) => {
    await supabase.from("user_badges").delete().eq("id", id);
    toast.success("Badge removida!");
    if (viewBadgesUserId) {
      const { data } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", viewBadgesUserId);
      setUserBadges(data || []);
    }
  };
  const postAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    const now = new Date();
    setAnnouncements(prev => [{ id: Date.now(), text: newAnnouncement.trim(), author: user?.email?.split("@")[0] || "Admin", pinned: pinNew, ts: `${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}` }, ...prev]);
    setNewAnnouncement(""); setPinNew(false);
    toast.success("Anúncio publicado!");
  };

  const filtered = users.filter(u =>
    (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / USERS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);
  const chartData = chartPeriod === "day" ? dailyData : monthlyData;

  const statCards = [
    { label: "Total", value: stats.total, icon: <Database className="h-3.5 w-3.5" />, accent: "#f97316", spark: [10,14,12,18,20,17,22,25,21,28,30,stats.total] },
    { label: "Ativos", value: stats.active, icon: <Activity className="h-3.5 w-3.5" />, accent: "#10b981", spark: [8,10,9,14,16,13,18,20,17,22,24,stats.active] },
    { label: "Banidos", value: stats.banned, icon: <ShieldAlert className="h-3.5 w-3.5" />, accent: "#ef4444", spark: [0,1,0,1,2,1,1,2,1,2,1,stats.banned] },
    { label: "Views", value: stats.totalViews, icon: <Eye className="h-3.5 w-3.5" />, accent: "#8b5cf6", spark: [100,140,120,180,200,170,220,250,210,280,300,stats.totalViews] },
  ];

  const sideItems = [
    { id: "overview" as const, icon: <BarChart3 className="h-4 w-4" />, label: "Dashboard" },
    { id: "users" as const, icon: <Users className="h-4 w-4" />, label: "Usuários" },
    { id: "badges" as const, icon: <Award className="h-4 w-4" />, label: "Badges" },
    { id: "announcements" as const, icon: <Megaphone className="h-4 w-4" />, label: "Anúncios" },
    { id: "reports" as const, icon: <ShieldAlert className="h-4 w-4" />, label: "Denúncias" },
  ];

  const avatarSrc = (user as any)?.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email}`;
  const displayName = (user as any)?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";

  if (authLoading) return (
    <div className="min-h-screen admin-bg flex items-center justify-center">
      <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" /><span className="text-[#444] text-xs admin-font uppercase tracking-widest">Carregando...</span></div>
    </div>
  );

  return (
    <div className="min-h-screen admin-bg text-white admin-font">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-5 border-b border-[#111]"
        style={{ background: "rgba(5,5,6,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 0 14px rgba(249,115,22,0.35)" }}>
              <Gem className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black text-sm tracking-widest text-white uppercase hidden sm:block">Safira</span>
          </Link>
          <div className="w-px h-5 bg-[#1c1c1f]" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
            <Shield className="h-3 w-3" />Staff Panel
          </div>
          <div className="hidden md:flex items-center gap-1.5 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" style={{ boxShadow: "0 0 6px #10b981", animation: "pulse 2s infinite" }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#222" }}>Sistema online</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 pr-3 border-r border-[#111]">
            <div className="flex items-center gap-1.5"><Users className="h-3 w-3 text-[#2a2a2a]" /><span className="text-xs font-black text-[#444]">{stats.total}</span><span className="text-[9px] font-medium text-[#1e1e1e] uppercase tracking-widest">membros</span></div>
            <div className="flex items-center gap-1.5"><Eye className="h-3 w-3 text-[#2a2a2a]" /><span className="text-xs font-black text-[#444]">{stats.totalViews.toLocaleString()}</span><span className="text-[9px] font-medium text-[#1e1e1e] uppercase tracking-widest">views</span></div>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg text-[#2a2a2a] hover:text-[#888] hover:bg-[#111] transition-colors border border-[#111]">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#111] hover:border-[#1c1c1f] hover:bg-[#0d0d0f] transition-all">
              <img src={avatarSrc} alt="avatar" className="h-6 w-6 rounded-lg object-cover border border-[#1c1c1f]" />
              <span className="text-xs font-bold text-[#555] hidden sm:block">{displayName}</span>
              <ChevronDown className={`h-3 w-3 text-[#333] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-2xl overflow-hidden z-50 shadow-2xl"
                style={{ background: "#080809", border: "1px solid #1c1c1f" }}>
                <div className="px-4 py-3 border-b border-[#111]">
                  <p className="text-xs font-black text-white">{displayName}</p>
                  <p className="text-[9px] text-[#333] truncate mt-0.5">{user?.email}</p>
                </div>
                <Link to="/editor" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[10px] font-medium text-[#444] hover:text-[#ccc] hover:bg-[#0d0d0f] transition-colors uppercase tracking-widest w-full border-b border-[#0f0f12]">
                  <Eye className="h-3.5 w-3.5" />Editor
                </Link>
                <Link to="/" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[10px] font-medium text-[#444] hover:text-[#ccc] hover:bg-[#0d0d0f] transition-colors uppercase tracking-widest w-full border-b border-[#0f0f12]">
                  <ArrowUpRight className="h-3.5 w-3.5" />Ver Site
                </Link>
                <button onClick={() => { signOut(); navigate("/"); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest w-full hover:bg-[#0d0d0f] transition-colors"
                  style={{ color: "rgba(239,68,68,0.7)" }}>
                  <LogOut className="h-3.5 w-3.5" />Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>

        {/* ── SIDEBAR ── */}
        <aside className={`flex-shrink-0 border-r border-[#111] flex flex-col transition-all duration-300 ${sideCollapsed ? "w-14" : "w-52"}`}
          style={{ background: "#080809" }}>
          <button onClick={() => setSideCollapsed(v => !v)}
            className="m-2 p-2 rounded-lg self-end text-[#222] hover:text-[#555] hover:bg-[#0d0d0f] transition-colors border border-[#111]">
            {sideCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
          <nav className="flex-1 px-2 space-y-0.5">
            {sideItems.map(item => {
              const active = tab === item.id;
              return (
                <button key={item.id}
                  onClick={() => { if (item.id === "reports") { setShowComingSoon(true); return; } setTab(item.id); }}
                  title={sideCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 py-2.5 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all
                    ${sideCollapsed ? "px-2.5 justify-center" : "px-3"}
                    ${active ? "text-[#f97316] bg-[#f97316]/08" : "text-[#333] hover:text-[#777] hover:bg-[#0d0d0f]"}`}
                  style={{ borderLeft: active ? "2px solid #f97316" : "2px solid transparent" }}>
                  <span style={{ color: active ? "#f97316" : "inherit" }}>{item.icon}</span>
                  {!sideCollapsed && <span>{item.label}</span>}
                  {!sideCollapsed && item.id === "reports" && (
                    <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-md font-bold"
                      style={{ background: "rgba(249,115,22,0.08)", color: "rgba(249,115,22,0.45)", border: "1px solid rgba(249,115,22,0.15)" }}>
                      BREVE
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {!sideCollapsed && (
            <div className="m-3 p-3 rounded-xl border border-[#111]" style={{ background: "#0a0a0b" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                <span className="text-[8px] font-bold text-[#2a2a2a] uppercase tracking-widest">v1.0.0</span>
              </div>
              <p className="text-[8px] font-medium" style={{ color: "#1a1a1a" }}>Safira Admin Panel</p>
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <div className="flex-1 overflow-auto p-6 md:p-8" style={{ background: "#050506" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-sm bg-[#f97316] inline-block" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#f97316]">Dashboard</h2>
                </div>
                <p className="text-[10px] font-medium pl-5" style={{ color: "#333" }}>
                  Visão geral da plataforma · {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map(s => (
                  <div key={s.label} className="admin-card p-5 group overflow-hidden relative">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse at 80% 0%, ${s.accent}06 0%, transparent 60%)` }} />
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-1.5 rounded-lg" style={{ background: `${s.accent}12`, border: `1px solid ${s.accent}22`, color: s.accent }}>{s.icon}</div>
                      <div className="flex items-center gap-1 text-[8px] font-bold" style={{ color: "#10b981" }}>
                        <TrendingUp className="h-2.5 w-2.5" />+12%
                      </div>
                    </div>
                    <p className="text-2xl font-black text-white tabular-nums">{s.value >= 1000 ? `${(s.value/1000).toFixed(1)}k` : s.value.toLocaleString()}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#222" }}>{s.label}</p>
                    <div className="mt-3"><Sparkline data={s.spark} color={s.accent} /></div>
                  </div>
                ))}
              </div>

              {/* Chart + Announcements */}
              <div className="grid lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 admin-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Crescimento de Membros</p>
                      <p className="text-[9px] font-medium mt-0.5" style={{ color: "#222" }}>Novos registros por {chartPeriod === "day" ? "dia" : "mês"}</p>
                    </div>
                    <div className="flex gap-1">
                      {(["day","month"] as const).map(p => (
                        <button key={p} onClick={() => setChartPeriod(p)}
                          className="text-[9px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-all"
                          style={{ border: `1px solid ${chartPeriod===p ? "rgba(249,115,22,0.3)" : "#111"}`, background: chartPeriod===p ? "rgba(249,115,22,0.07)" : "transparent", color: chartPeriod===p ? "#f97316" : "#333" }}>
                          {p === "day" ? "Semana" : "Ano"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <BarChart data={chartData} />
                  <div className="flex gap-5 pt-3 border-t border-[#0f0f12]">
                    {[
                      { l: "Pico", v: Math.max(...chartData.map(d=>d.value)), c: "#f97316" },
                      { l: "Média", v: Math.round(chartData.reduce((a,d)=>a+d.value,0)/chartData.length), c: "#888" },
                      { l: "Total", v: chartData.reduce((a,d)=>a+d.value,0), c: "#888" },
                    ].map(s => (
                      <div key={s.l}>
                        <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "#222" }}>{s.l}</p>
                        <p className="text-sm font-black" style={{ color: s.c }}>{s.v}</p>
                      </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5 text-[9px] font-medium" style={{ color: "#1e1e1e" }}>
                      <Calendar className="h-3 w-3" />
                      {new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 admin-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Anúncios Recentes</p>
                    <button onClick={() => setTab("announcements")} className="text-[9px] font-bold text-[#333] hover:text-[#777] uppercase tracking-widest flex items-center gap-1 transition-colors">
                      Ver todos <ChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {announcements.slice(0,4).map(a => (
                      <div key={a.id} className="p-3 rounded-xl" style={{ background: "#0d0d0e", border: `1px solid ${a.pinned ? "rgba(249,115,22,0.12)" : "#111"}` }}>
                        {a.pinned && (
                          <div className="flex items-center gap-1 mb-1.5">
                            <Pin className="h-2.5 w-2.5 text-[#f97316]" />
                            <span className="text-[8px] font-bold text-[#f97316] uppercase tracking-widest">Fixado</span>
                          </div>
                        )}
                        <p className="text-[10px] font-medium leading-relaxed line-clamp-2" style={{ color: "#555" }}>{a.text}</p>
                        <p className="text-[9px] font-medium mt-1.5" style={{ color: "#222" }}>{a.author} · {a.ts}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent members */}
              <div className="admin-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Membros Recentes</p>
                  <button onClick={() => setTab("users")} className="text-[9px] font-bold text-[#333] hover:text-[#777] uppercase tracking-widest flex items-center gap-1 transition-colors">
                    Ver todos <ChevronRight className="h-2.5 w-2.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {users.slice(0,8).map(u => (
                    <div key={u.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#0f0f12] hover:border-[#1a1a1a] transition-colors group" style={{ background: "#0d0d0e" }}>
                      <img src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.user_id}`}
                        className="w-7 h-7 rounded-full object-cover border border-[#1c1c1f] flex-shrink-0" alt="" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{u.display_name || u.username}</p>
                        <p className="text-[8px] font-medium truncate" style={{ color: "#2a2a2a" }}>@{u.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === "users" && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-sm bg-[#f97316] inline-block" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-[#f97316]">Usuários</h2>
                  </div>
                  <p className="text-[10px] font-medium pl-5" style={{ color: "#333" }}>
                    {filtered.length} registros · Página {page} de {totalPages || 1}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl overflow-hidden border border-[#1c1c1f]" style={{ background: "#0a0a0b" }}>
                    <Search className="ml-3 h-3.5 w-3.5 text-[#333] flex-shrink-0" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                      className="px-3 py-2.5 bg-transparent text-xs text-white placeholder-[#1c1c1f] focus:outline-none w-48" />
                  </div>
                  <button onClick={fetchData} className="p-2.5 rounded-xl border border-[#1c1c1f] text-[#333] hover:text-[#888] hover:bg-[#0d0d0f] transition-colors" style={{ background: "#0a0a0b" }}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="admin-card overflow-hidden">
                {/* Head */}
                <div className="grid px-5 py-3 border-b border-[#0f0f12]" style={{ gridTemplateColumns: "2fr 1fr 1fr auto", background: "#080809" }}>
                  {["Usuário","Status","Views","Ações"].map((h, i) => (
                    <div key={h} className={`text-[9px] font-black uppercase tracking-widest ${i===3?"text-right":""}`} style={{ color: "#1e1e1e" }}>{h}</div>
                  ))}
                </div>

                {paginated.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="h-8 w-8 mx-auto mb-3" style={{ color: "#111" }} />
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#222" }}>Nenhum usuário encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ divideColor: "#0a0a0a" }}>
                    {paginated.map((u, idx) => (
                      <div key={u.id}
                        className="grid px-5 py-3.5 items-center hover:bg-[#0d0d0f] transition-colors group"
                        style={{ gridTemplateColumns: "2fr 1fr 1fr auto", borderBottom: idx < paginated.length-1 ? "1px solid #0a0a0a" : "none" }}>
                        {/* User */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.user_id}`}
                              className="w-9 h-9 rounded-xl object-cover border border-[#1c1c1f]" alt="" />
                            {u.is_verified && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#f97316] flex items-center justify-center border-2 border-[#0a0a0b]">
                                <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{u.display_name || u.username}</p>
                            <p className="text-[9px] font-medium truncate" style={{ color: "#2a2a2a" }}>@{u.username}</p>
                          </div>
                        </div>
                        {/* Status */}
                        <div><StatusPill active={!u.is_banned} /></div>
                        {/* Views */}
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3 w-3" style={{ color: "#1e1e1e" }} />
                          <span className="text-xs font-bold tabular-nums" style={{ color: "#444" }}>{(u.views||0).toLocaleString()}</span>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 justify-end opacity-50 group-hover:opacity-100 transition-opacity">
                          {[
                            { fn: () => toggleVerified(u), icon: <Shield className="h-3 w-3" />, col: u.is_verified ? "#f97316" : "#333", title: u.is_verified ? "Remover verificação" : "Verificar" },
                            { fn: () => toggleBan(u), icon: <Ban className="h-3 w-3" />, col: u.is_banned ? "#10b981" : "#ef4444", title: u.is_banned ? "Desbanir" : "Banir" },
                            { fn: () => setGrantUserId(u.user_id), icon: <Award className="h-3 w-3" />, col: "#f97316", title: "Dar badge" },
                            { fn: () => openUserBadges(u.user_id, u.display_name||u.username), icon: <Trash2 className="h-3 w-3" />, col: "#ef4444", title: "Ver/remover badges" },
                          ].map((a, ai) => (
                            <button key={ai} onClick={a.fn} title={a.title}
                              className="p-1.5 rounded-lg border border-[#111] hover:bg-[#111] transition-all"
                              style={{ color: a.col }}>
                              {a.icon}
                            </button>
                          ))}
                          <Link to={`/${u.username}`} target="_blank" title="Ver perfil"
                            className="p-1.5 rounded-lg border border-[#111] hover:bg-[#111] transition-all text-[#333] hover:text-[#888]">
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#0f0f12]" style={{ background: "#080809" }}>
                    <span className="text-[9px] font-medium" style={{ color: "#222" }}>
                      {(page-1)*USERS_PER_PAGE+1}–{Math.min(page*USERS_PER_PAGE,filtered.length)} de {filtered.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 border border-[#111] hover:border-[#1c1c1f]"
                        style={{ color: "#444", background: "#0a0a0b" }}>
                        <ChevronLeft className="h-3 w-3" />Anterior
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let p = i + 1;
                        if (totalPages > 5) {
                          if (page <= 3) p = i + 1;
                          else if (page >= totalPages - 2) p = totalPages - 4 + i;
                          else p = page - 2 + i;
                        }
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black transition-all border"
                            style={{ border: `1px solid ${page===p?"rgba(249,115,22,0.35)":"#111"}`, background: page===p?"rgba(249,115,22,0.08)":"#0a0a0b", color: page===p?"#f97316":"#333" }}>
                            {p}
                          </button>
                        );
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 border border-[#111] hover:border-[#1c1c1f]"
                        style={{ color: "#444", background: "#0a0a0b" }}>
                        Próxima<ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grant Badge Modal */}
              {grantUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }} onClick={() => setGrantUserId(null)}>
                  <div className="admin-card w-full max-w-sm p-6 space-y-5 rounded-2xl" style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#f97316]" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Conceder Badge</h3>
                      </div>
                      <button onClick={() => setGrantUserId(null)} className="p-1.5 rounded-lg border border-[#111] text-[#333] hover:text-[#888] transition-colors"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <select value={grantBadgeId} onChange={e => setGrantBadgeId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none transition-all"
                      style={{ background: "#0d0d0e", border: `1px solid ${grantBadgeId ? "rgba(249,115,22,0.3)" : "#1c1c1f"}` }}>
                      <option value="">Selecionar badge...</option>
                      {allBadges.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setGrantUserId(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#444] hover:text-[#888] transition-colors border border-[#1c1c1f]">Cancelar</button>
                      <button onClick={grantBadge} disabled={!grantBadgeId}
                        className="flex-1 py-2.5 rounded-xl text-black text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: grantBadgeId ? "0 4px 20px rgba(249,115,22,0.3)" : "none" }}>
                        Conceder
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* View Badges Modal */}
              {viewBadgesUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }} onClick={() => setViewBadgesUserId(null)}>
                  <div className="admin-card w-full max-w-sm p-6 space-y-5 rounded-2xl" style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[#f97316]" /><h3 className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Badges</h3></div>
                        <p className="text-[9px] font-medium mt-0.5" style={{ color: "#444" }}>{viewBadgesName}</p>
                      </div>
                      <button onClick={() => setViewBadgesUserId(null)} className="p-1.5 rounded-lg border border-[#111] text-[#333] hover:text-[#888] transition-colors"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    {userBadges.length === 0 ? (
                      <div className="py-8 text-center rounded-xl border border-dashed border-[#111]">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#222" }}>Sem badges.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {userBadges.map((ub: any) => (
                          <div key={ub.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#111] hover:border-[#1c1c1f] transition-colors group" style={{ background: "#0d0d0e" }}>
                            <BadgeIcon icon={ub.badges.icon} color={ub.badges.color} size={18} />
                            <span className="text-xs font-bold text-white flex-1">{ub.badges.name}</span>
                            <button onClick={() => removeBadge(ub.id)} className="p-1.5 rounded-lg border border-[#111] text-[#222] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BADGES */}
          {tab === "badges" && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#f97316] inline-block" />
                <h2 className="text-xs font-black uppercase tracking-widest text-[#f97316]">Badges</h2>
                <span className="text-[9px] font-medium" style={{ color: "#222" }}>· {allBadges.length} registros</span>
              </div>
              {allBadges.length === 0 ? (
                <div className="py-20 text-center admin-card rounded-2xl border-dashed">
                  <Award className="h-8 w-8 mx-auto mb-3" style={{ color: "#111" }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#222" }}>Nenhuma badge cadastrada</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allBadges.map(badge => (
                    <div key={badge.id} className="admin-card flex items-center gap-3 p-4 rounded-2xl group">
                      <BadgeIcon icon={badge.icon} color={badge.color} size={24} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white">{badge.name}</p>
                        <p className="text-[9px] font-medium truncate mt-0.5" style={{ color: "#333" }}>{badge.description}</p>
                      </div>
                      {badge.is_special && (
                        <span className="text-[8px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest"
                          style={{ background: "rgba(249,115,22,0.08)", color: "rgba(249,115,22,0.6)", border: "1px solid rgba(249,115,22,0.18)" }}>
                          ESPECIAL
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {tab === "announcements" && (
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#f97316] inline-block" />
                <h2 className="text-xs font-black uppercase tracking-widest text-[#f97316]">Anúncios Internos</h2>
              </div>
              {/* Compose */}
              <div className="admin-card p-5 space-y-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#333" }}>Novo anúncio</p>
                <textarea value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)}
                  placeholder="Escreva um comunicado para a equipe..." rows={3} resize-none
                  className="w-full px-4 py-3 rounded-xl text-xs text-white placeholder-[#1c1c1f] focus:outline-none transition-all resize-none"
                  style={{ background: "#0d0d0e", border: `1px solid ${newAnnouncement?"rgba(249,115,22,0.2)":"#1c1c1f"}` }} />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button type="button" onClick={() => setPinNew(v => !v)}
                      className="w-4 h-4 rounded flex items-center justify-center transition-all"
                      style={{ border: `1px solid ${pinNew?"rgba(249,115,22,0.5)":"#1c1c1f"}`, background: pinNew?"rgba(249,115,22,0.1)":"transparent" }}>
                      {pinNew && <Pin className="h-2.5 w-2.5 text-[#f97316]" />}
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#333" }}>Fixar no topo</span>
                  </label>
                  <button onClick={postAnnouncement} disabled={!newAnnouncement.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-black text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: newAnnouncement.trim()?"0 4px 16px rgba(249,115,22,0.25)":"none" }}>
                    <Send className="h-3.5 w-3.5" />Publicar
                  </button>
                </div>
              </div>
              {/* List */}
              <div className="space-y-2">
                {announcements.sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0)).map(a => (
                  <div key={a.id} className="admin-card p-4 rounded-2xl flex items-start gap-3 group"
                    style={{ borderColor: a.pinned?"rgba(249,115,22,0.15)":"#111" }}>
                    <div className={`mt-0.5 flex-shrink-0 ${a.pinned?"text-[#f97316]":"text-[#1e1e1e]"}`}>
                      {a.pinned ? <Pin className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {a.pinned && <div className="text-[8px] font-black uppercase tracking-widest text-[#f97316] mb-1.5">Fixado</div>}
                      <p className="text-xs font-medium leading-relaxed" style={{ color: "#777" }}>{a.text}</p>
                      <p className="text-[9px] font-medium" style={{ color: "#222" }}>{a.author} · {a.ts}</p>
                    </div>
                    <button onClick={() => setAnnouncements(prev => prev.filter(x => x.id !== a.id))}
                      className="text-[#111] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border border-[#111] hover:bg-[#0d0d0f]">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="py-14 text-center admin-card rounded-2xl border-dashed">
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#222" }}>Nenhum anúncio publicado</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Coming Soon */}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
          onClick={() => setShowComingSoon(false)}>
          <div className="admin-card p-12 max-w-sm w-full text-center rounded-3xl" style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <Sparkles className="h-5 w-5 text-[#f97316]" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-white mb-3 leading-relaxed">
              Funcionalidade em<br />desenvolvimento
            </h2>
            <p className="text-[10px] font-medium mb-6 leading-relaxed" style={{ color: "#333" }}>
              O sistema de denúncias será disponibilizado em breve.
            </p>
            <button onClick={() => setShowComingSoon(false)} className="text-[9px] font-bold uppercase tracking-widest transition-colors" style={{ color: "#2a2a2a" }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = "#777"}
              onMouseLeave={e => (e.target as HTMLElement).style.color = "#2a2a2a"}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        .admin-font, .admin-font * { font-family: 'Sora', sans-serif; }
        .admin-bg { background: #050506; }
        .admin-card { background: #0a0a0b; border: 1px solid #111; border-radius: 16px; }

        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: #050506; }
        ::-webkit-scrollbar-thumb { background: #1c1c1f; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
      `}</style>
    </div>
  );
};

export default Admin;