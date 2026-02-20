import { useState, useEffect, useRef } from "react";
import {
  Users, Eye, ShieldAlert, BarChart3, Search,
  Ban, CheckCircle, Clock, Gem,
  Shield, LogOut, Award, Trash2, X,
  TrendingUp, Bell, Send, ChevronDown, Pin,
  Megaphone, Calendar, UserCheck, Sparkles
} from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Mini bar chart (no lib needed) ──────────────────────────────────────────
const MiniBarChart = ({ data, color = "#f97316" }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full transition-all duration-700 rounded-sm"
            style={{ height: `${(d.value / max) * 80}px`, backgroundColor: color, opacity: 0.85 }}
          />
          <span className="text-[8px] text-[#333] font-mono leading-none">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Line Sparkline ───────────────────────────────────────────────────────────
const Sparkline = ({ data, color = "#f97316" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data, 1);
  const w = 200, h = 48;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={`${color}18`}
        stroke="none"
      />
    </svg>
  );
};

// ── Coming Soon overlay ──────────────────────────────────────────────────────
const ComingSoon = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-sm">
    <div className="border border-[#1a1a1a] bg-[#080808] p-12 max-w-md text-center space-y-4">
      <Sparkles className="h-8 w-8 text-[#f97316] mx-auto" />
      <h2 className="text-sm font-black uppercase tracking-widest text-white">
        Funcionalidade sendo disponibilizada em breve
      </h2>
      <p className="text-xs text-[#444] font-mono">
        Nossa equipe está trabalhando para trazer esta feature o mais rápido possível.
      </p>
    </div>
  </div>
);

// ── Generate fake member growth data ─────────────────────────────────────────
const genDailyData = () => {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return days.map((label) => ({ label, value: Math.floor(Math.random() * 40) + 5 }));
};
const genMonthlyData = () => {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return months.map((label) => ({ label, value: Math.floor(Math.random() * 200) + 20 }));
};

// ── Main Component ────────────────────────────────────────────────────────────
const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "reports" | "badges" | "announcements">("overview");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, totalViews: 0 });

  // chart period
  const [chartPeriod, setChartPeriod] = useState<"day" | "month">("day");
  const [dailyData] = useState(genDailyData());
  const [monthlyData] = useState(genMonthlyData());

  // badge modals
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [grantBadgeId, setGrantBadgeId] = useState("");
  const [viewBadgesUserId, setViewBadgesUserId] = useState<string | null>(null);
  const [viewBadgesUserName, setViewBadgesUserName] = useState("");
  const [userBadgesList, setUserBadgesList] = useState<any[]>([]);

  // reports coming soon
  const [showComingSoon, setShowComingSoon] = useState(false);

  // profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // announcements
  const [announcements, setAnnouncements] = useState<{ id: number; text: string; author: string; pinned: boolean; ts: string }[]>([
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

  // close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchData = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (profiles) {
      setUsers(profiles);
      setStats({
        total: profiles.length,
        active: profiles.filter((p) => !p.is_banned).length,
        banned: profiles.filter((p) => p.is_banned).length,
        totalViews: profiles.reduce((s, p) => s + (p.views || 0), 0),
      });
    }
    const { data: reps } = await supabase.from("reports").select("*");
    if (reps) setReports(reps);
    const { data: badges } = await supabase.from("badges").select("*");
    if (badges) setAllBadges(badges);
  };

  const toggleBan = async (profile: any) => {
    const newBanned = !profile.is_banned;
    await supabase.from("profiles").update({ is_banned: newBanned }).eq("id", profile.id);
    toast.success(newBanned ? "Usuário banido" : "Usuário desbanido");
    fetchData();
  };

  const toggleVerified = async (profile: any) => {
    const newVerified = !profile.is_verified;
    await supabase.from("profiles").update({ is_verified: newVerified }).eq("id", profile.id);
    toast.success(newVerified ? "Usuário verificado" : "Verificação removida");
    fetchData();
  };

  const grantBadge = async () => {
    if (!grantUserId || !grantBadgeId) return;
    const { error } = await supabase.from("user_badges").insert({ user_id: grantUserId, badge_id: grantBadgeId });
    if (error) { toast.error(error.message); return; }
    toast.success("Badge concedida!");
    setGrantUserId(null);
    setGrantBadgeId("");
  };

  const openUserBadges = async (userId: string, name: string) => {
    setViewBadgesUserId(userId);
    setViewBadgesUserName(name);
    const { data } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", userId);
    setUserBadgesList(data || []);
  };

  const removeBadge = async (userBadgeId: string) => {
    await supabase.from("user_badges").delete().eq("id", userBadgeId);
    toast.success("Badge removida!");
    if (viewBadgesUserId) {
      const { data } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", viewBadgesUserId);
      setUserBadgesList(data || []);
    }
  };

  const postAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    const now = new Date();
    setAnnouncements((prev) => [
      {
        id: Date.now(),
        text: newAnnouncement.trim(),
        author: user?.email?.split("@")[0] || "Admin",
        pinned: pinNew,
        ts: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
      },
      ...prev,
    ]);
    setNewAnnouncement("");
    setPinNew(false);
    toast.success("Anúncio publicado!");
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.username || "").includes(search.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return null;

  const chartData = chartPeriod === "day" ? dailyData : monthlyData;
  const sparkData = chartData.map((d) => d.value);

  const statCards = [
    { label: "Total Usuários", value: stats.total.toLocaleString(), icon: <Users className="h-4 w-4" />, accent: "#f97316", spark: [10,14,12,18,20,17,22,25,21,28,30,stats.total] },
    { label: "Ativos",         value: stats.active.toLocaleString(), icon: <UserCheck className="h-4 w-4" />, accent: "#10b981", spark: [8,10,9,14,16,13,18,20,17,22,24,stats.active] },
    { label: "Banidos",        value: stats.banned.toLocaleString(), icon: <ShieldAlert className="h-4 w-4" />, accent: "#ef4444", spark: [0,1,0,1,2,1,1,2,1,2,1,stats.banned] },
    { label: "Total Views",    value: stats.totalViews.toLocaleString(), icon: <BarChart3 className="h-4 w-4" />, accent: "#8b5cf6", spark: [100,140,120,180,200,170,220,250,210,280,300,stats.totalViews] },
  ];

  const sidebarItems = [
    { id: "overview"      as const, icon: <BarChart3 className="h-3.5 w-3.5" />,   label: "Dashboard"   },
    { id: "users"         as const, icon: <Users className="h-3.5 w-3.5" />,        label: "Usuários"    },
    { id: "badges"        as const, icon: <Award className="h-3.5 w-3.5" />,        label: "Badges"      },
    { id: "announcements" as const, icon: <Megaphone className="h-3.5 w-3.5" />,   label: "Anúncios"    },
    { id: "reports"       as const, icon: <ShieldAlert className="h-3.5 w-3.5" />, label: "Denúncias"   },
  ];

  const avatarSrc = (user as any)?.user_metadata?.avatar_url
    || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email}`;
  const displayName = (user as any)?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Admin";

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between bg-[#080808] sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-[#f97316]" />
          <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
          <span className="text-[9px] px-2 py-0.5 border border-[#f97316]/30 text-[#f97316]/70 uppercase tracking-widest">
            Admin
          </span>
        </Link>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 px-3 py-1.5 border border-[#1a1a1a] hover:border-[#2a2a2a] bg-[#0a0a0a] transition-colors"
          >
            <img
              src={avatarSrc}
              alt="avatar"
              className="h-6 w-6 rounded-full object-cover border border-[#2a2a2a] grayscale"
            />
            <span className="text-xs text-[#888] font-mono hidden sm:block">{displayName}</span>
            <ChevronDown className={`h-3 w-3 text-[#444] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 border border-[#1a1a1a] bg-[#0a0a0a] z-50 shadow-xl">
              <div className="px-4 py-3 border-b border-[#111]">
                <p className="text-xs font-black text-white">{displayName}</p>
                <p className="text-[10px] text-[#444] truncate">{user?.email}</p>
              </div>
              <Link
                to="/editor"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#555] hover:text-[#999] hover:bg-[#111] transition-colors uppercase tracking-widest w-full"
              >
                <Eye className="h-3.5 w-3.5" />
                Editor
              </Link>
              <button
                onClick={() => { signOut(); navigate("/"); }}
                className="flex items-center gap-2 px-4 py-2.5 text-xs text-red-500/70 hover:text-red-500 hover:bg-[#111] transition-colors uppercase tracking-widest w-full border-t border-[#111]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-49px)]">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <div className="w-48 border-r border-[#1a1a1a] bg-[#080808] p-3 space-y-0.5 flex-shrink-0">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "reports") {
                  setShowComingSoon(true);
                  return;
                }
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs uppercase tracking-widest font-black transition-colors ${
                activeTab === item.id
                  ? "text-[#f97316] border-l-2 border-[#f97316] pl-[10px] bg-[#f97316]/5"
                  : "text-[#444] hover:text-[#888] border-l-2 border-transparent pl-[10px]"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <div className="flex-1 p-8 overflow-auto">

          {/* ═══════════════ OVERVIEW ═══════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Dashboard</h2>
                <p className="text-xs text-[#333] font-mono">Visão geral da plataforma</p>
              </div>

              {/* Stat cards with sparklines */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s) => (
                  <div key={s.label} className="border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-2 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span style={{ color: s.accent }}>{s.icon}</span>
                      <TrendingUp className="h-3 w-3 text-[#222]" />
                    </div>
                    <p className="text-3xl font-black text-white tabular-nums">{s.value}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#444]">{s.label}</p>
                    <Sparkline data={s.spark} color={s.accent} />
                  </div>
                ))}
              </div>

              {/* Member Growth Chart */}
              <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Crescimento de Membros</p>
                    <p className="text-[10px] text-[#333] mt-0.5 font-mono">
                      Novos registros por {chartPeriod === "day" ? "dia da semana" : "mês"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {(["day", "month"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setChartPeriod(p)}
                        className={`text-[10px] px-3 py-1.5 uppercase tracking-widest transition-colors border ${
                          chartPeriod === p
                            ? "border-[#f97316]/50 text-[#f97316] bg-[#f97316]/5"
                            : "border-[#1a1a1a] text-[#444] hover:text-[#888]"
                        }`}
                      >
                        {p === "day" ? "Semana" : "Ano"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bar chart */}
                <MiniBarChart data={chartData} />

                {/* Summary row */}
                <div className="flex gap-6 pt-2 border-t border-[#111]">
                  <div>
                    <p className="text-[10px] text-[#333] uppercase tracking-widest">Pico</p>
                    <p className="text-sm font-black text-[#f97316]">
                      {Math.max(...chartData.map((d) => d.value))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#333] uppercase tracking-widest">Média</p>
                    <p className="text-sm font-black text-white">
                      {Math.round(chartData.reduce((a, d) => a + d.value, 0) / chartData.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#333] uppercase tracking-widest">Total</p>
                    <p className="text-sm font-black text-white">
                      {chartData.reduce((a, d) => a + d.value, 0)}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-[10px] text-[#333] font-mono">
                    <Calendar className="h-3 w-3" />
                    {new Date().toLocaleDateString("pt-BR")} — {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Recent announcements preview on dashboard */}
              <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Últimos Anúncios</p>
                  <button
                    onClick={() => setActiveTab("announcements")}
                    className="text-[10px] text-[#444] hover:text-[#888] uppercase tracking-widest transition-colors"
                  >
                    Ver todos →
                  </button>
                </div>
                {announcements.slice(0, 2).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 border border-[#111] bg-[#080808]">
                    {a.pinned && <Pin className="h-3 w-3 text-[#f97316] mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#888] font-mono truncate">{a.text}</p>
                      <p className="text-[10px] text-[#333] mt-1">{a.author} · {a.ts}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════ USERS ═══════════════ */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Usuários</h2>
                  <p className="text-xs text-[#333] font-mono">{filteredUsers.length} registros</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#444]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar usuário..."
                    className="pl-9 pr-4 py-2.5 bg-[#0d0d0d] border border-[#1a1a1a] text-xs text-white placeholder-[#333] focus:border-[#f97316] outline-none font-mono w-56 transition-colors"
                  />
                </div>
              </div>

              <div className="border border-[#1a1a1a] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] bg-[#080808]">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[#444] font-black">Usuário</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[#444] font-black">Status</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[#444] font-black">Views</th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-[#444] font-black">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#111] hover:bg-[#0a0a0a] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.user_id}`}
                              className="h-8 w-8 object-cover border border-[#1a1a1a] grayscale"
                            />
                            <div>
                              <p className="text-xs font-black text-white flex items-center gap-1.5">
                                {u.display_name || u.username}
                                {u.is_verified && <CheckCircle className="h-3 w-3 text-[#f97316]" />}
                              </p>
                              <p className="text-[10px] text-[#444] font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] uppercase tracking-widest flex items-center gap-1.5 font-mono ${u.is_banned ? "text-red-500" : "text-[#10b981]"}`}>
                            {u.is_banned ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            {u.is_banned ? "Banido" : "Ativo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#555] font-mono tabular-nums">
                          {(u.views || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => toggleVerified(u)} title={u.is_verified ? "Remover verificação" : "Verificar"}
                              className={`p-1.5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors ${u.is_verified ? "text-[#f97316]" : "text-[#333] hover:text-[#666]"}`}>
                              <Shield className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => toggleBan(u)} title={u.is_banned ? "Desbanir" : "Banir"}
                              className={`p-1.5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors ${u.is_banned ? "text-[#10b981]" : "text-red-500/70 hover:text-red-500"}`}>
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setGrantUserId(u.user_id)} title="Dar badge"
                              className="p-1.5 border border-[#1a1a1a] hover:border-[#f97316]/30 text-[#333] hover:text-[#f97316] transition-colors">
                              <Award className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openUserBadges(u.user_id, u.display_name || u.username)} title="Ver/remover badges"
                              className="p-1.5 border border-[#1a1a1a] hover:border-red-900/40 text-[#333] hover:text-red-500 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="py-14 text-center">
                    <p className="text-[#333] text-xs uppercase tracking-widest">Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>

              {/* Modal: Conceder Badge */}
              {grantUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setGrantUserId(null)}>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 w-full max-w-sm space-y-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Conceder Badge</h3>
                      <button onClick={() => setGrantUserId(null)} className="text-[#444] hover:text-[#888] transition-colors"><X className="h-4 w-4" /></button>
                    </div>
                    <select value={grantBadgeId} onChange={(e) => setGrantBadgeId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#111] border border-[#1a1a1a] text-sm text-white focus:border-[#f97316] outline-none font-mono transition-colors">
                      <option value="">Selecionar badge...</option>
                      {allBadges.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setGrantUserId(null)}
                        className="flex-1 px-4 py-2.5 border border-[#1a1a1a] text-xs text-[#555] hover:text-[#888] uppercase tracking-widest transition-colors">
                        Cancelar
                      </button>
                      <button onClick={grantBadge} disabled={!grantBadgeId}
                        className="flex-1 px-4 py-2.5 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        Conceder
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal: Ver/Remover Badges */}
              {viewBadgesUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setViewBadgesUserId(null)}>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 w-full max-w-sm space-y-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Badges</h3>
                        <p className="text-xs text-[#444] font-mono mt-0.5">{viewBadgesUserName}</p>
                      </div>
                      <button onClick={() => setViewBadgesUserId(null)} className="text-[#444] hover:text-[#888] transition-colors"><X className="h-4 w-4" /></button>
                    </div>
                    {userBadgesList.length === 0 ? (
                      <p className="text-xs text-[#333] text-center py-6 uppercase tracking-widest font-mono">Sem badges.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {userBadgesList.map((ub: any) => (
                          <div key={ub.id} className="flex items-center gap-3 p-3 border border-[#1a1a1a] bg-[#111] hover:border-[#2a2a2a] transition-colors">
                            <BadgeIcon icon={ub.badges.icon} color={ub.badges.color} size={18} />
                            <span className="text-xs font-mono text-white flex-1">{ub.badges.name}</span>
                            <button onClick={() => removeBadge(ub.id)} className="p-1.5 border border-[#1a1a1a] hover:border-red-900/40 text-[#444] hover:text-red-500 transition-colors" title="Remover">
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* ═══════════════ BADGES ═══════════════ */}
          {activeTab === "badges" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Badges</h2>
                <p className="text-xs text-[#333] font-mono">{allBadges.length} registros</p>
              </div>
              {allBadges.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-[#1a1a1a]">
                  <p className="text-[#333] text-xs uppercase tracking-widest">Nenhuma badge cadastrada</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allBadges.map((badge) => (
                    <div key={badge.id} className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex items-center gap-3 hover:border-[#2a2a2a] transition-colors">
                      <BadgeIcon icon={badge.icon} color={badge.color} size={24} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white font-mono">{badge.name}</p>
                        <p className="text-[10px] text-[#444] truncate font-mono mt-0.5">{badge.description}</p>
                      </div>
                      {badge.is_special && (
                        <span className="text-[9px] px-2 py-0.5 border border-[#f97316]/30 text-[#f97316]/70 uppercase tracking-widest font-mono">
                          Especial
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ ANNOUNCEMENTS ═══════════════ */}
          {activeTab === "announcements" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Anúncios Internos</h2>
                <p className="text-xs text-[#333] font-mono">Comunicados para a equipe</p>
              </div>

              {/* Compose box */}
              <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[#555] font-black">Novo anúncio</p>
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Escreva um comunicado para a equipe..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-xs text-white placeholder-[#2a2a2a] focus:border-[#f97316] outline-none font-mono transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setPinNew((v) => !v)}
                      className={`h-4 w-4 border flex items-center justify-center transition-colors ${pinNew ? "border-[#f97316] bg-[#f97316]/10" : "border-[#2a2a2a]"}`}
                    >
                      {pinNew && <Pin className="h-2.5 w-2.5 text-[#f97316]" />}
                    </button>
                    <span className="text-[10px] text-[#444] uppercase tracking-widest">Fixar</span>
                  </label>
                  <button
                    onClick={postAnnouncement}
                    disabled={!newAnnouncement.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Publicar
                  </button>
                </div>
              </div>

              {/* Announcements list */}
              <div className="space-y-2">
                {announcements
                  .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                  .map((a) => (
                  <div key={a.id} className={`border bg-[#0a0a0a] p-4 flex items-start gap-3 transition-colors ${a.pinned ? "border-[#f97316]/20" : "border-[#1a1a1a] hover:border-[#2a2a2a]"}`}>
                    <div className={`mt-0.5 flex-shrink-0 ${a.pinned ? "text-[#f97316]" : "text-[#2a2a2a]"}`}>
                      {a.pinned ? <Pin className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs text-[#ccc] font-mono leading-relaxed">{a.text}</p>
                      <p className="text-[10px] text-[#333] font-mono">{a.author} · {a.ts}</p>
                    </div>
                    <button
                      onClick={() => setAnnouncements((prev) => prev.filter((x) => x.id !== a.id))}
                      className="text-[#2a2a2a] hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="text-center py-14 border border-dashed border-[#1a1a1a]">
                    <p className="text-[#333] text-xs uppercase tracking-widest">Nenhum anúncio publicado</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Coming Soon overlay (reports) ─────────────────────────────────── */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-sm"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="border border-[#1a1a1a] bg-[#080808] p-12 max-w-md text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <Sparkles className="h-8 w-8 text-[#f97316] mx-auto" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white leading-relaxed">
              Funcionalidade sendo<br />disponibilizada em breve
            </h2>
            <p className="text-xs text-[#444] font-mono">
              Nossa equipe está trabalhando para trazer o sistema de denúncias o mais rápido possível.
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="mt-2 text-[10px] text-[#333] hover:text-[#666] uppercase tracking-widest transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
