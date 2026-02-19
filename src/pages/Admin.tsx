import { useState, useEffect } from "react";
import {
  Users, Eye, ShieldAlert, BarChart3, Search,
  Ban, CheckCircle, Clock, Gem,
  Shield, LogOut, Award, Trash2, X
} from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "reports" | "badges">("overview");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, totalViews: 0 });

  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [grantBadgeId, setGrantBadgeId] = useState("");

  const [viewBadgesUserId, setViewBadgesUserId] = useState<string | null>(null);
  const [viewBadgesUserName, setViewBadgesUserName] = useState("");
  const [userBadgesList, setUserBadgesList] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

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
    const { error } = await supabase
      .from("user_badges")
      .insert({ user_id: grantUserId, badge_id: grantBadgeId });
    if (error) { toast.error(error.message); return; }
    toast.success("Badge concedida!");
    setGrantUserId(null);
    setGrantBadgeId("");
  };

  const openUserBadges = async (userId: string, name: string) => {
    setViewBadgesUserId(userId);
    setViewBadgesUserName(name);
    const { data } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", userId);
    setUserBadgesList(data || []);
  };

  const removeBadge = async (userBadgeId: string) => {
    await supabase.from("user_badges").delete().eq("id", userBadgeId);
    toast.success("Badge removida!");
    if (viewBadgesUserId) {
      const { data } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", viewBadgesUserId);
      setUserBadgesList(data || []);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.username || "").includes(search.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return null;

  const statCards = [
    { label: "Total Usuários",  value: stats.total.toLocaleString(),      icon: <Users className="h-4 w-4" />,      accent: "#f97316" },
    { label: "Ativos",          value: stats.active.toLocaleString(),     icon: <Eye className="h-4 w-4" />,        accent: "#10b981" },
    { label: "Banidos",         value: stats.banned.toLocaleString(),     icon: <ShieldAlert className="h-4 w-4" />, accent: "#ef4444" },
    { label: "Total Views",     value: stats.totalViews.toLocaleString(), icon: <BarChart3 className="h-4 w-4" />,  accent: "#8b5cf6" },
  ];

  const sidebarItems = [
    { id: "overview" as const, icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Dashboard"  },
    { id: "users"    as const, icon: <Users    className="h-3.5 w-3.5" />, label: "Usuários"   },
    { id: "badges"   as const, icon: <Award    className="h-3.5 w-3.5" />, label: "Badges"     },
    { id: "reports"  as const, icon: <ShieldAlert className="h-3.5 w-3.5" />, label: "Denúncias" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono">

      {/* ── HEADER ── */}
      <header className="border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between bg-[#080808] sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-[#f97316]" />
          <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
          <span className="text-[9px] px-2 py-0.5 border border-[#f97316]/30 text-[#f97316]/70 uppercase tracking-widest">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/editor"
            className="text-xs text-[#555] hover:text-[#999] transition-colors uppercase tracking-widest"
          >
            Editor
          </Link>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="flex items-center gap-2 text-xs text-[#555] hover:text-[#999] transition-colors uppercase tracking-widest"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-49px)]">

        {/* ── SIDEBAR ── */}
        <div className="w-48 border-r border-[#1a1a1a] bg-[#080808] p-3 space-y-0.5 flex-shrink-0">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 p-8 overflow-auto">

          {/* ═══════════════════════════════════════
              OVERVIEW / DASHBOARD
          ═══════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Dashboard</h2>
                <p className="text-xs text-[#333] font-mono">Visão geral da plataforma</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s) => (
                  <div
                    key={s.label}
                    className="border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-3"
                  >
                    <span style={{ color: s.accent }}>{s.icon}</span>
                    <p className="text-3xl font-black text-white tabular-nums">{s.value}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#444]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              USERS
          ═══════════════════════════════════════ */}
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
                      <tr
                        key={u.id}
                        className="border-b border-[#111] hover:bg-[#0a0a0a] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.user_id}`}
                              className="h-8 w-8 object-cover border border-[#1a1a1a] grayscale"
                            />
                            <div>
                              <p className="text-xs font-black text-white flex items-center gap-1.5">
                                {u.display_name || u.username}
                                {u.is_verified && (
                                  <CheckCircle className="h-3 w-3 text-[#f97316]" />
                                )}
                              </p>
                              <p className="text-[10px] text-[#444] font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] uppercase tracking-widest flex items-center gap-1.5 font-mono ${
                              u.is_banned ? "text-red-500" : "text-[#10b981]"
                            }`}
                          >
                            {u.is_banned
                              ? <Ban className="h-3 w-3" />
                              : <CheckCircle className="h-3 w-3" />}
                            {u.is_banned ? "Banido" : "Ativo"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-[#555] font-mono tabular-nums">
                          {(u.views || 0).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => toggleVerified(u)}
                              title={u.is_verified ? "Remover verificação" : "Verificar"}
                              className={`p-1.5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors ${
                                u.is_verified ? "text-[#f97316]" : "text-[#333] hover:text-[#666]"
                              }`}
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => toggleBan(u)}
                              title={u.is_banned ? "Desbanir" : "Banir"}
                              className={`p-1.5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors ${
                                u.is_banned ? "text-[#10b981]" : "text-red-500/70 hover:text-red-500"
                              }`}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setGrantUserId(u.user_id)}
                              title="Dar badge"
                              className="p-1.5 border border-[#1a1a1a] hover:border-[#f97316]/30 text-[#333] hover:text-[#f97316] transition-colors"
                            >
                              <Award className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openUserBadges(u.user_id, u.display_name || u.username)}
                              title="Ver/remover badges"
                              className="p-1.5 border border-[#1a1a1a] hover:border-red-900/40 text-[#333] hover:text-red-500 transition-colors"
                            >
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

              {/* ── MODAL: Conceder Badge ── */}
              {grantUserId && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                  onClick={() => setGrantUserId(null)}
                >
                  <div
                    className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 w-full max-w-sm space-y-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">
                        Conceder Badge
                      </h3>
                      <button
                        onClick={() => setGrantUserId(null)}
                        className="text-[#444] hover:text-[#888] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <select
                      value={grantBadgeId}
                      onChange={(e) => setGrantBadgeId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#111] border border-[#1a1a1a] text-sm text-white focus:border-[#f97316] outline-none font-mono transition-colors"
                    >
                      <option value="">Selecionar badge...</option>
                      {allBadges.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setGrantUserId(null)}
                        className="flex-1 px-4 py-2.5 border border-[#1a1a1a] text-xs text-[#555] hover:text-[#888] uppercase tracking-widest transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={grantBadge}
                        disabled={!grantBadgeId}
                        className="flex-1 px-4 py-2.5 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Conceder
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODAL: Ver/Remover Badges ── */}
              {viewBadgesUserId && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                  onClick={() => setViewBadgesUserId(null)}
                >
                  <div
                    className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 w-full max-w-sm space-y-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">
                          Badges
                        </h3>
                        <p className="text-xs text-[#444] font-mono mt-0.5">{viewBadgesUserName}</p>
                      </div>
                      <button
                        onClick={() => setViewBadgesUserId(null)}
                        className="text-[#444] hover:text-[#888] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {userBadgesList.length === 0 ? (
                      <p className="text-xs text-[#333] text-center py-6 uppercase tracking-widest font-mono">
                        Sem badges.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {userBadgesList.map((ub: any) => (
                          <div
                            key={ub.id}
                            className="flex items-center gap-3 p-3 border border-[#1a1a1a] bg-[#111] hover:border-[#2a2a2a] transition-colors"
                          >
                            <BadgeIcon icon={ub.badges.icon} color={ub.badges.color} size={18} />
                            <span className="text-xs font-mono text-white flex-1">{ub.badges.name}</span>
                            <button
                              onClick={() => removeBadge(ub.id)}
                              className="p-1.5 border border-[#1a1a1a] hover:border-red-900/40 text-[#444] hover:text-red-500 transition-colors"
                              title="Remover"
                            >
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

          {/* ═══════════════════════════════════════
              REPORTS / DENÚNCIAS
          ═══════════════════════════════════════ */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Denúncias</h2>
                <p className="text-xs text-[#333] font-mono">{reports.length} registros</p>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-[#1a1a1a]">
                  <p className="text-[#333] text-xs uppercase tracking-widest">Nenhuma denúncia ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div
                      key={r.id}
                      className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex items-center justify-between hover:border-[#2a2a2a] transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-sm text-white font-mono">{r.reason}</p>
                        <p className="text-[10px] text-[#333] font-mono">#{r.id.slice(0, 8)}</p>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-widest flex items-center gap-1.5 font-mono px-3 py-1.5 border ${
                          r.status === "pending"
                            ? "border-yellow-900/40 text-yellow-600"
                            : "border-[#10b981]/20 text-[#10b981]"
                        }`}
                      >
                        {r.status === "pending"
                          ? <Clock className="h-3 w-3" />
                          : <CheckCircle className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════
              BADGES
          ═══════════════════════════════════════ */}
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
                    <div
                      key={badge.id}
                      className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex items-center gap-3 hover:border-[#2a2a2a] transition-colors"
                    >
                      <BadgeIcon icon={badge.icon} color={badge.color} size={24} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white font-mono">{badge.name}</p>
                        <p className="text-[10px] text-[#444] truncate font-mono mt-0.5">
                          {badge.description}
                        </p>
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

        </div>
      </div>
    </div>
  );
};

export default Admin;
