import { motion } from "framer-motion";
import {
  Gem, ArrowRight, Eye, ShieldCheck, Lock, Trophy,
  Crown, Medal, Shield, Zap, Users, TrendingUp, Check,
  ChevronRight, Link2, Music, Star, Layers
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── TYPES ─────────────────────── */
interface RankedUser {
  username: string; display_name: string; avatar_url: string;
  views: number; is_verified: boolean; position: number;
}

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
  * { font-family: 'Sora', sans-serif; }

  .sf-bg { background: #080809; }

  .sf-ambient {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 90% 55% at 50% -5%, rgba(249,115,22,0.11) 0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 80% 90%, rgba(249,115,22,0.03) 0%, transparent 60%);
  }
  .sf-ambient::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px);
    background-size: 72px 72px;
  }

  .sf-nav-pill {
    background: rgba(8,8,9,0.85);
    backdrop-filter: blur(24px) saturate(1.5);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 9999px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.03) inset;
  }

  .sf-logo {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    background: linear-gradient(135deg, #f97316, #ea580c);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(249,115,22,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
  }

  .sf-pill-tabs { background: rgba(0,0,0,0.35); border-radius: 9999px; padding: 3px; }
  .sf-tab-on {
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-radius: 9999px; color: #000;
    box-shadow: 0 2px 12px rgba(249,115,22,0.35);
  }
  .sf-tab-off { color: #444; transition: color 0.2s; border-radius: 9999px; }
  .sf-tab-off:hover { color: #888; }

  .sf-ghost { border: 1px solid #1c1c1f; border-radius: 10px; color: #555; transition: all 0.2s; }
  .sf-ghost:hover { color: #ccc; border-color: #2a2a2a; }

  .sf-cta {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px;
    box-shadow: 0 4px 24px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.12);
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .sf-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(249,115,22,0.45); }
  .sf-cta::after {
    content: ''; position: absolute; top: 0; bottom: 0; left: -70%; width: 45%;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.28), transparent);
    animation: sfSheen 4.5s ease-in-out infinite;
  }

  .sf-badge-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 14px; border-radius: 9999px;
    background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.18);
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #888;
  }

  .sf-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #f97316;
    animation: sfPulse 2.5s ease-in-out infinite; display: inline-block; flex-shrink: 0;
  }

  .sf-profile-float {
    background: rgba(10,10,12,0.92); border: 1px solid rgba(249,115,22,0.18);
    border-radius: 18px; backdrop-filter: blur(24px);
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.07);
    animation: sfFloat 4s ease-in-out infinite;
  }

  .sf-headline-orange {
    background: linear-gradient(135deg, #f97316 0%, #fb923c 35%, #ea580c 70%, #f97316 100%);
    background-size: 200%;
    -webkit-background-clip: text; background-clip: text; color: transparent;
    animation: sfGradShift 5s linear infinite;
    filter: drop-shadow(0 0 32px rgba(249,115,22,0.22));
  }

  .sf-input-wrap {
    background: #0a0a0c; border: 1px solid #1c1c1f; border-radius: 14px;
    box-shadow: 0 0 0 0 transparent; transition: box-shadow 0.3s, border-color 0.3s;
    overflow: hidden;
  }
  .sf-input-wrap:focus-within {
    border-color: rgba(249,115,22,0.3);
    box-shadow: 0 0 0 3px rgba(249,115,22,0.07), 0 0 28px rgba(249,115,22,0.06);
  }
  .sf-input-wrap input { background: transparent; }

  .sf-marquee-mask {
    mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
  }

  .sf-card {
    background: #0a0a0c; border: 1px solid #111; border-radius: 18px;
    transition: border-color 0.25s;
  }
  .sf-card:hover { border-color: #1a1a1a; }

  @keyframes sfMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes sfFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
  @keyframes sfPulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(249,115,22,0.5); } 50% { opacity: 0.65; box-shadow: 0 0 0 6px rgba(249,115,22,0); } }
  @keyframes sfGradShift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
  @keyframes sfSheen { 0%, 30% { transform: translateX(0); opacity: 0; } 42% { opacity: 1; } 100% { transform: translateX(420%); opacity: 0; } }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #080809; }
  ::-webkit-scrollbar-thumb { background: #1c1c1f; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
`;

/* ─── RANKING PAGE ──────────────── */
function RankingPage({ onGoHome }: { onGoHome: () => void }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myPos, setMyPos] = useState<RankedUser | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles")
        .select("username,display_name,avatar_url,views,is_verified")
        .order("views", { ascending: false }).limit(100);
      if (data) {
        const ranked = data.map((p, i) => ({ ...p, views: p.views || 0, is_verified: !!p.is_verified, position: i + 1 }));
        setUsers(ranked);
        if (user) setMyPos(ranked.find(u => u.username === (user as any).username) || null);
      }
      setLoading(false);
    })();
  }, [user]);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const top3 = users.slice(0, 3);
  const posColor = (p: number) => p === 1 ? "#facc15" : p === 2 ? "#aaaaaa" : p === 3 ? "#cd7f32" : "#2a2a2a";

  return (
    <div className="min-h-screen sf-bg text-white">
      <div className="sf-ambient" />
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-5xl mx-auto">
          <div className="sf-nav-pill flex items-center justify-between px-5 h-14">
            <button onClick={onGoHome} className="flex items-center gap-2.5">
              <div className="sf-logo"><Gem className="h-3.5 w-3.5 text-white" /></div>
              <span className="font-black text-sm tracking-widest text-white uppercase">Safira</span>
            </button>
            <div className="sf-pill-tabs flex items-center gap-1">
              <button onClick={onGoHome} className="sf-tab-off px-4 py-1.5 text-xs font-bold uppercase tracking-widest">Home</button>
              <button className="sf-tab-on px-4 py-1.5 text-xs font-bold uppercase tracking-widest">Ranking</button>
            </div>
            <Link to="/editor" className="sf-ghost flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest">
              Dashboard <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-28 pb-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="sf-badge-pill mb-6">
            <Trophy className="h-3.5 w-3.5 text-[#f97316]" />Ranking por visualizações
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-3">
            Top <span className="sf-headline-orange">Perfis</span>
          </h1>
          <p className="text-sm text-[#444] font-medium">Os perfis mais visitados · Atualizados em tempo real</p>
        </div>

        {myPos && (
          <div className="sf-card mb-6 flex items-center gap-4 px-5 py-4" style={{ borderLeft: "3px solid #f97316", borderRadius: "14px" }}>
            <span className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Sua posição</span>
            <span className="text-2xl font-black">#{myPos.position}</span>
            <img src={myPos.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${myPos.username}`}
              className="w-8 h-8 rounded-full object-cover" alt="me" />
            <span className="text-sm text-[#444] flex-1">@{myPos.username}</span>
            <Eye className="h-3.5 w-3.5 text-[#f97316]" />
            <span className="font-black">{myPos.views.toLocaleString()}</span>
          </div>
        )}

        {!loading && top3.length >= 3 && (
          <div className="sf-card mb-6 p-8">
            <p className="text-[10px] uppercase tracking-widest text-[#333] mb-8 flex items-center gap-2 font-bold">
              <span className="w-3 h-3 rounded-sm bg-[#f97316] inline-block" />Pódio dos Campeões
            </p>
            <div className="flex items-end justify-center gap-8 md:gap-14">
              {[{ u: top3[1], idx: 1 }, { u: top3[0], idx: 0 }, { u: top3[2], idx: 2 }].map(({ u, idx }) => {
                if (!u) return null;
                const podiumH = [72, 100, 48];
                const imgSz = ["w-16 h-16", "w-20 h-20", "w-14 h-14"];
                const marginTop = ["", "-mt-10", "mt-5"];
                const accent = posColor(u.position);
                return (
                  <div key={u.username} className={`flex flex-col items-center ${marginTop[idx]}`}>
                    <div className="relative mb-3">
                      {u.position === 1 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-4 w-4" style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}80)` }} />}
                      <img src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`}
                        className={`${imgSz[idx]} rounded-full object-cover`}
                        style={{ border: `2.5px solid ${accent}70`, boxShadow: `0 0 24px ${accent}30` }} />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ background: "#0a0a0a", border: `1.5px solid ${accent}50`, color: accent, boxShadow: `0 0 10px ${accent}30` }}>
                        {u.position}
                      </div>
                    </div>
                    <p className="text-xs font-black text-white truncate max-w-[100px] mt-4">{u.display_name || u.username}</p>
                    <div className="flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: `${accent}12`, color: accent }}>
                      <Eye className="h-2.5 w-2.5" />{u.views.toLocaleString()}
                    </div>
                    <div className="mt-4 rounded-lg flex items-center justify-center"
                      style={{ width: "88px", height: `${podiumH[idx]}px`, background: "linear-gradient(to top, #0d0d0f, #111)", borderTop: `2px solid ${accent}40`, border: `1px solid #111` }}>
                      <span className="text-[9px] text-[#222] uppercase tracking-widest font-bold">#{u.position}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="sf-card mb-4 flex items-center overflow-hidden" style={{ borderRadius: "14px" }}>
          <span className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#333] font-bold border-r border-[#111]">Buscar</span>
          <input type="text" placeholder="nome ou @username..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder-[#222] focus:outline-none text-sm font-medium" />
        </div>

        <div className="sf-card overflow-hidden" style={{ borderRadius: "16px" }}>
          <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#0f0f12]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#f97316] inline-block" />
              <span className="text-[10px] uppercase tracking-widest text-[#333] font-bold">Ranking completo</span>
            </div>
            <span className="text-[10px] text-[#1e1e1e]">{filtered.length} perfis</span>
          </div>
          {loading ? (
            <div className="divide-y divide-[#0a0a0a]">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-[#0d0d0f]" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[#222] text-xs uppercase tracking-widest font-bold">Nenhum resultado</div>
          ) : (
            <div className="divide-y divide-[#0a0a0a]">
              {filtered.map((u, idx) => {
                const accent = posColor(u.position);
                const isTop3 = u.position <= 3;
                return (
                  <motion.div key={u.username} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#0d0d0f] transition-colors group"
                    style={{ borderLeft: isTop3 ? `2.5px solid ${accent}45` : "2.5px solid transparent" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ background: isTop3 ? `${accent}12` : "#0d0d0f", color: isTop3 ? accent : "#2a2a2a", border: `1px solid ${isTop3 ? `${accent}25` : "#111"}` }}>
                      {u.position <= 3 ? (u.position === 1 ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />) : `#${u.position}`}
                    </div>
                    <img src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-[#1c1c1f]" alt={u.username} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white truncate">{u.display_name || u.username}</span>
                        {u.is_verified && (
                          <div className="w-3.5 h-3.5 rounded-full bg-[#f97316] flex items-center justify-center flex-shrink-0">
                            <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#2a2a2a]">@{u.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Eye className="h-3 w-3 text-[#222]" />
                      <span className="text-sm font-black tabular-nums" style={{ color: isTop3 ? accent : "#444" }}>{u.views.toLocaleString()}</span>
                    </div>
                    <Link to={`/${u.username}`}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-widest text-[#f97316] font-bold hover:bg-[#f97316]/10"
                      style={{ border: "1px solid rgba(249,115,22,0.2)" }}>
                      Ver <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{SHARED_STYLES}</style>
    </div>
  );
}

/* ─── LANDING PAGE ──────────────── */
const Landing = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState<"home" | "ranking">("home");
  const [usernameInput, setUsernameInput] = useState("");
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(102);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles")
        .select("username,display_name,avatar_url,views")
        .order("created_at", { ascending: false }).limit(50);
      if (data) { setTotalUsers(data.length || 102); setRecentUsers(data); }
    })();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    navigate(user ? "/editor" : `/register?suggested=${encodeURIComponent(usernameInput.trim())}`);
  };

  if (page === "ranking") return <RankingPage onGoHome={() => setPage("home")} />;

  return (
    <div className="min-h-screen sf-bg text-white flex flex-col">
      <div className="sf-ambient" />

      {/* ── NAV floating pill ── */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-5xl mx-auto">
          <div className="sf-nav-pill flex items-center justify-between px-5 md:px-7 h-14 md:h-16">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="sf-logo"><Gem className="h-3.5 w-3.5 text-white" /></div>
              <div className="hidden sm:block">
                <span className="font-black text-sm tracking-widest text-white uppercase block leading-none">Safira</span>
                <span className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(249,115,22,0.55)" }}>biolink</span>
              </div>
            </Link>

            <div className="sf-pill-tabs hidden md:flex items-center gap-1">
              <button className="sf-tab-on px-5 py-2 text-xs font-black uppercase tracking-widest">Home</button>
              <button onClick={() => setPage("ranking")} className="sf-tab-off px-5 py-2 text-xs font-black uppercase tracking-widest">Ranking</button>
            </div>

            <div className="flex items-center gap-2.5">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="hidden md:flex items-center gap-1.5 text-xs text-[#444] hover:text-[#f97316] transition-colors uppercase tracking-widest font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />Admin
                    </Link>
                  )}
                  <Link to="/editor" className="sf-ghost flex items-center gap-2 px-3 py-2 text-xs font-bold">
                    <img src={(user as any).avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}`}
                      className="w-5 h-5 rounded-full object-cover" alt="" />
                    <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]">
                      {(user as any).display_name || (user as any).username}
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:block text-xs text-[#444] hover:text-white transition-colors uppercase tracking-widest font-bold">Login</Link>
                  <Link to="/register" className="sf-cta px-5 py-2.5 text-black text-xs font-black uppercase tracking-widest rounded-xl">Criar conta</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 relative z-10">
        {/* ── HERO ── */}
        <section className="pt-28 md:pt-36 pb-10 px-4">
          <div className="max-w-2xl mx-auto text-center">

            {/* Live badge */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex justify-center mb-8">
              <div className="sf-badge-pill">
                <span className="sf-live-dot" />
                {totalUsers.toLocaleString()} membros ativos na plataforma
                <ChevronRight className="h-3 w-3 text-[#f97316]" />
              </div>
            </motion.div>

            {/* Floating profile card */}
            <motion.div initial={{ opacity: 0, y: -14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center mb-8">
              <div className="sf-profile-float inline-flex items-center gap-3.5 px-5 py-4">
                <div className="relative flex-shrink-0">
                  <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=crinchy_demo"
                    className="w-12 h-12 rounded-full object-cover"
                    style={{ border: "2px solid rgba(249,115,22,0.45)" }} alt="demo" />
                  <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#f97316] flex items-center justify-center"
                    style={{ width: "18px", height: "18px", border: "2px solid #0c0c0e" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-black text-white">777</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>
                      ★ VIP
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-medium text-[#777]"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Link2 className="h-3 w-3" />
                    Join our discord community server!
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black uppercase tracking-tight leading-[0.88] mb-5">
              <span className="text-white block">Sua identidade</span>
              <span className="sf-headline-orange block">em um link</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base md:text-lg font-medium mb-10 max-w-sm mx-auto leading-relaxed" style={{ color: "#555" }}>
              Crie sua página personalizada em segundos.<br />
              <span style={{ color: "#222" }}>Sem mensalidade. Sem complicação.</span>
            </motion.p>

            {/* CTA input row */}
            <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              onSubmit={handleCreate}
              className="flex max-w-md mx-auto mb-3 sf-input-wrap">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[11px] font-black uppercase tracking-widest pointer-events-none"
                  style={{ color: "#f97316" }}>
                  safirahost.xyz/
                </span>
                <input type="text" placeholder="seunome" value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  className="w-full pl-36 pr-4 py-4 text-white placeholder-[#1c1c1f] focus:outline-none text-sm font-medium" />
              </div>
              <button type="submit"
                className="sf-cta px-6 py-4 text-black text-sm font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap rounded-none" style={{ borderRadius: "0 12px 12px 0" }}>
                Criar agora <ArrowRight className="h-4 w-4" />
              </button>
            </motion.form>
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#1e1e1e" }}>
              Grátis · Sem cartão · Sem mensalidade
            </p>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        {recentUsers.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.8 }}
            className="py-4 overflow-hidden sf-marquee-mask" style={{ borderTop: "1px solid #111", borderBottom: "1px solid #111" }}>
            <div className="flex w-max" style={{ animation: "sfMarquee 55s linear infinite" }}>
              {[...recentUsers, ...recentUsers].map((u, i) => (
                <Link key={`${u.username}-${i}`} to={`/${u.username}`} className="flex-shrink-0 mx-2">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-[#0f0f11] transition-colors group"
                    style={{ border: "1px solid #111", minWidth: "155px" }}>
                    <img src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`}
                      className="w-8 h-8 rounded-full object-cover border border-[#1c1c1f]" alt={u.username} />
                    <div>
                      <p className="text-xs font-bold text-[#555] group-hover:text-white transition-colors truncate max-w-[90px]">
                        {u.display_name || u.username}
                      </p>
                      <p className="text-[9px]" style={{ color: "#1e1e1e" }}>/{u.username}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── STATS ── */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="sf-card grid grid-cols-3 divide-x divide-[#111]">
              {[
                { label: "Membros ativos", value: totalUsers.toLocaleString(), icon: <Users className="h-4 w-4" /> },
                { label: "Perfis criados", value: "100%", icon: <TrendingUp className="h-4 w-4" /> },
                { label: "Custo mensal", value: "R$ 0", icon: <Zap className="h-4 w-4" /> },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="py-8 px-4 text-center group cursor-default">
                  <div className="flex justify-center mb-2 transition-colors group-hover:text-[#f97316]" style={{ color: "#222" }}>{s.icon}</div>
                  <p className="text-3xl md:text-4xl font-black text-white group-hover:text-[#f97316] transition-colors">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest mt-1.5 font-bold" style={{ color: "#222" }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="sf-badge-pill mb-5"><Layers className="h-3.5 w-3.5 text-[#f97316]" />Recursos</div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">
                Tudo que você <span className="sf-headline-orange">precisa</span>
              </h2>
              <p className="text-sm font-medium max-w-sm mx-auto" style={{ color: "#444" }}>Recursos poderosos para destacar seu perfil na internet</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { n: "01", title: "Redes Sociais", desc: "Adicione quantas redes desejar, divulgando suas principais contas.", icon: <Link2 className="h-5 w-5" /> },
                { n: "02", title: "Links Personalizados", desc: "Todos os seus links importantes em um lugar, do jeito que preferir.", icon: <ArrowRight className="h-5 w-5" /> },
                { n: "03", title: "Audio e Video", desc: "Spotify, YouTube e backgrounds animados para seu perfil.", icon: <Music className="h-5 w-5" /> },
                { n: "04", title: "Badges Exclusivos", desc: "Conquiste insígnias que destacam seu status na comunidade.", icon: <Star className="h-5 w-5" /> },
              ].map((f, i) => (
                <motion.div key={f.n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="sf-card p-6 group" style={{ borderRadius: "18px" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)", color: "#f97316" }}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#f97316" }}>{f.n}</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wide">{f.title}</h3>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#3a3a3a" }}>{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="sf-badge-pill mb-5"><Gem className="h-3.5 w-3.5 text-[#f97316]" />Planos</div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">
                Escolha seu <span className="sf-headline-orange">plano</span>
              </h2>
              <p className="text-sm font-medium" style={{ color: "#444" }}>Pague uma vez. Recursos para sempre.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="sf-card p-8" style={{ borderRadius: "20px" }}>
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "#2a2a2a" }}>Plano</p>
                    <h3 className="text-2xl font-black text-white uppercase">Grátis</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-white">R$ 0</span>
                    <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#2a2a2a" }}>vitalício</p>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {["Página personalizável básica","Links ilimitados","Avatar e bio","Vídeo e música de fundo","Analytics simples","Badges gratuitas por missões"].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)" }}>
                        <Check className="h-2.5 w-2.5 text-[#f97316]" />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "#444" }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link to={user ? "/editor" : "/register"}
                  className="block w-full py-3.5 rounded-xl text-center text-sm font-black uppercase tracking-widest transition-all"
                  style={{ border: "1px solid #1c1c1f", color: "#555" }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = "#ccc"; (e.target as HTMLElement).style.borderColor = "#2a2a2a"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = "#555"; (e.target as HTMLElement).style.borderColor = "#1c1c1f"; }}>
                  Começar grátis
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="relative sf-card p-8 overflow-hidden" style={{ borderRadius: "20px", borderColor: "rgba(249,115,22,0.22)", background: "linear-gradient(135deg, #0a0a0c 0%, rgba(249,115,22,0.04) 100%)" }}>
                <div className="absolute top-5 right-5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                  style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                  Mais popular
                </div>
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "rgba(249,115,22,0.5)" }}>Plano</p>
                    <h3 className="text-2xl font-black uppercase" style={{ color: "#f97316" }}>Premium</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-white">R$ 29,90</span>
                    <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#2a2a2a" }}>vitalício</p>
                  </div>
                </div>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-5" style={{ color: "rgba(249,115,22,0.35)" }}>
                  Pague uma vez. Fique para sempre.
                </p>
                <div className="space-y-3 mb-8">
                  {["Tudo do Grátis +","Badges exclusivos","Efeitos animados","Layouts e fontes customizáveis","Analytics avançado","Suporte prioritário"].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)" }}>
                        <Check className="h-2.5 w-2.5 text-[#f97316]" />
                      </div>
                      <span className="text-xs font-medium" style={{ color: item === "Tudo do Grátis +" ? "#888" : "#444" }}>{item}</span>
                    </div>
                  ))}
                </div>
                <button disabled className="block w-full py-3.5 rounded-xl text-center text-sm font-black uppercase tracking-widest cursor-not-allowed"
                  style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)", color: "rgba(249,115,22,0.45)" }}>
                  Em breve
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-16 px-4 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="sf-card p-12 md:p-16 text-center relative overflow-hidden" style={{ borderRadius: "24px" }}>
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(249,115,22,0.3), transparent)" }} />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.25em] font-black mb-4" style={{ color: "#f97316" }}>Pronto para começar?</p>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
                  Crie seu perfil<br /><span className="sf-headline-orange">agora mesmo</span>
                </h2>
                <p className="text-xs uppercase tracking-widest font-bold mb-10" style={{ color: "#222" }}>
                  Grátis · Sem cartão · Sem mensalidade
                </p>
                <Link to={user ? "/editor" : "/register"}
                  className="sf-cta inline-flex items-center gap-3 px-10 py-4 text-black text-sm font-black uppercase tracking-widest rounded-2xl">
                  {user ? "Ir para o editor" : "Criar minha página"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-12 px-4" style={{ borderTop: "1px solid #111" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="sf-logo"><Gem className="h-3.5 w-3.5 text-white" /></div>
              <div>
                <span className="font-black text-sm tracking-widest text-white uppercase block">Safira</span>
                <p className="text-[9px] uppercase tracking-widest font-medium" style={{ color: "#1e1e1e" }}>Sua bio moderna e cheia de estilo</p>
              </div>
            </div>
            <div className="flex items-start gap-10">
              {[
                { title: "Plataforma", links: [{ label: "Login", to: "/login" }, { label: "Cadastrar", to: "/register" }] },
                { title: "Legal", links: [{ label: "Termos", to: "/terms" }, { label: "Privacidade", to: "/privacy" }] },
              ].map(col => (
                <div key={col.title}>
                  <p className="text-[9px] uppercase tracking-widest font-black mb-3" style={{ color: "#222" }}>{col.title}</p>
                  <div className="flex flex-col gap-2">
                    {col.links.map(l => (
                      <Link key={l.label} to={l.to} className="text-[11px] font-medium transition-colors hover:text-white" style={{ color: "#2a2a2a" }}>{l.label}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-6" style={{ borderTop: "1px solid #0f0f12" }}>
            <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#1a1a1a" }}>© 2026 Safira — Todos os direitos reservados.</p>
            <div className="flex items-center gap-2">
              <span className="sf-live-dot" style={{ width: "6px", height: "6px" }} />
              <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#1e1e1e" }}>Online</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{SHARED_STYLES}</style>
    </div>
  );
};

export default Landing;