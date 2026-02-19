import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

  // For viewing/removing user badges
  const [viewBadgesUserId, setViewBadgesUserId] = useState<string | null>(null);
  const [viewBadgesUserName, setViewBadgesUserName] = useState("");
  const [userBadgesList, setUserBadgesList] = useState<any[]>([]);

  useEffect(() => { if (!authLoading && (!user || !isAdmin)) navigate("/"); }, [user, isAdmin, authLoading]);
  useEffect(() => { if (user && isAdmin) fetchData(); }, [user, isAdmin]);

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

  const filteredUsers = users.filter(
    u => (u.username || "").includes(search.toLowerCase()) || (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return null;

  const statCards = [
    { label: "Total Usuários", value: stats.total.toLocaleString(), icon: <Users className="h-5 w-5" />, color: "text-primary" },
    { label: "Ativos", value: stats.active.toLocaleString(), icon: <Eye className="h-5 w-5" />, color: "text-online" },
    { label: "Banidos", value: stats.banned.toLocaleString(), icon: <ShieldAlert className="h-5 w-5" />, color: "text-destructive" },
    { label: "Total Views", value: stats.totalViews.toLocaleString(), icon: <BarChart3 className="h-5 w-5" />, color: "text-accent" },
  ];

  const sidebarItems = [
    { id: "overview" as const, icon: <BarChart3 className="h-4 w-4" />, label: "Dashboard" },
    { id: "users" as const, icon: <Users className="h-4 w-4" />, label: "Usuários" },
    { id: "badges" as const, icon: <Award className="h-4 w-4" />, label: "Badges" },
    { id: "reports" as const, icon: <ShieldAlert className="h-4 w-4" />, label: "Denúncias" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-primary" /><span className="font-bold gradient-text">Safira</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider">Admin</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/editor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Editor</Link>
          <button onClick={() => { signOut(); navigate("/"); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <div className="w-52 border-r border-border p-3 space-y-1">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Overview */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-xl font-bold">Dashboard</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-5 space-y-2">
                    <span className={`${s.color}`}>{s.icon}</span>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Usuários</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                    className="pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">Usuário</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Views</th>
                      <th className="px-4 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.user_id}`} className="h-9 w-9 rounded-full object-cover" />
                            <div>
                              <p className="text-sm font-medium flex items-center gap-1">
                                {u.display_name || u.username}
                                {u.is_verified && <CheckCircle className="h-3 w-3 text-badge-verified" />}
                              </p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs flex items-center gap-1 ${u.is_banned ? "text-destructive" : "text-online"}`}>
                            {u.is_banned ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            {u.is_banned ? "Banido" : "Ativo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{(u.views || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => toggleVerified(u)} title={u.is_verified ? "Remover verificação" : "Verificar"}
                              className={`p-1.5 rounded text-xs ${u.is_verified ? "text-badge-verified" : "text-muted-foreground"} hover:bg-surface transition-colors`}>
                              <Shield className="h-4 w-4" />
                            </button>
                            <button onClick={() => toggleBan(u)} title={u.is_banned ? "Desbanir" : "Banir"}
                              className={`p-1.5 rounded text-xs ${u.is_banned ? "text-online" : "text-destructive"} hover:bg-surface transition-colors`}>
                              <Ban className="h-4 w-4" />
                            </button>
                            <button onClick={() => setGrantUserId(u.user_id)} title="Dar badge"
                              className="p-1.5 rounded text-xs text-primary hover:bg-surface transition-colors">
                              <Award className="h-4 w-4" />
                            </button>
                            <button onClick={() => openUserBadges(u.user_id, u.display_name || u.username)} title="Ver/remover badges"
                              className="p-1.5 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-surface transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grant Badge Modal */}
              {grantUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setGrantUserId(null)}>
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="rounded-2xl border border-border bg-card p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Conceder Badge</h3>
                      <button onClick={() => setGrantUserId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <select value={grantBadgeId} onChange={e => setGrantBadgeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm">
                      <option value="">Selecionar badge...</option>
                      {allBadges.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setGrantUserId(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface transition-colors">Cancelar</button>
                      <button onClick={grantBadge} disabled={!grantBadgeId} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">Conceder</button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* View/Remove Badges Modal */}
              {viewBadgesUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setViewBadgesUserId(null)}>
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="rounded-2xl border border-border bg-card p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Badges de {viewBadgesUserName}</h3>
                      <button onClick={() => setViewBadgesUserId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    {userBadgesList.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem badges.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {userBadgesList.map((ub: any) => (
                          <div key={ub.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-border">
                            <BadgeIcon icon={ub.badges.icon} color={ub.badges.color} size={18} />
                            <span className="text-sm font-medium flex-1">{ub.badges.name}</span>
                            <button onClick={() => removeBadge(ub.id)}
                              className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors" title="Remover">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* Reports */}
          {activeTab === "reports" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-bold">Denúncias</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma denúncia ainda.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map(r => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">{r.reason}</p>
                        <p className="text-xs text-muted-foreground">#{r.id.slice(0, 8)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                        r.status === "pending" ? "bg-idle/10 text-idle" : "bg-online/10 text-online"
                      }`}>
                        {r.status === "pending" ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Badges */}
          {activeTab === "badges" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-bold">Badges</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allBadges.map(badge => (
                  <div key={badge.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <BadgeIcon icon={badge.icon} color={badge.color} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{badge.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                    </div>
                    {badge.is_special && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Especial</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
