import { motion } from "framer-motion";
import { Gem, ArrowRight, Eye, ShieldCheck, Lock, Trophy, Crown, Medal, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── TYPES ───────────────────────────────────── */
interface RankedUser {
  username: string;
  display_name: string;
  avatar_url: string;
  views: number;
  is_verified: boolean;
  bio: string;
  position: number;
}

/* ─── BADGE SHOP DATA ─────────────────────────── */
const BADGE_SHOP = [
  { id: "early", name: "Early Adopter", icon: "⚡", description: "Exclusivo para os primeiros membros da plataforma.", price: "Grátis", priceNote: "somente para os primeiros", accent: "#f97316", available: false },
  { id: "verified", name: "Verified", icon: "✓", description: "Conta verificada pela equipe Safira.", price: "Convite", priceNote: "somente por convite", accent: "#3b82f6", available: false },
  { id: "premium", name: "Premium", icon: "◆", description: "Acesso vitalício a todas as funcionalidades premium.", price: "R$ 29,90", priceNote: "pagamento único", accent: "#f97316", available: false },
  { id: "og", name: "OG Member", icon: "👑", description: "Membro original. Histórico desde o lançamento.", price: "R$ 49,90", priceNote: "edição limitada", accent: "#facc15", available: false },
  { id: "dev", name: "Developer", icon: "{ }", description: "Para desenvolvedores que contribuíram com o projeto.", price: "Conquista", priceNote: "concedida pela equipe", accent: "#10b981", available: false },
  { id: "vip", name: "VIP", icon: "★", description: "Status de membro VIP na comunidade Safira.", price: "R$ 19,90", priceNote: "por mês", accent: "#8b5cf6", available: false },
];

/* ─── RANK BADGE COMPONENT ────────────────────── */
function RankBadge({ position }: { position: number }) {
  if (position === 1)
    return (
      <div className="w-10 h-10 flex items-center justify-center border border-[#facc15]/40 bg-[#facc15]/10">
        <Crown className="h-5 w-5 text-[#facc15]" />
      </div>
    );
  if (position === 2)
    return (
      <div className="w-10 h-10 flex items-center justify-center border border-[#aaa]/30 bg-[#aaa]/5">
        <Medal className="h-5 w-5 text-[#aaa]" />
      </div>
    );
  if (position === 3)
    return (
      <div className="w-10 h-10 flex items-center justify-center border border-[#cd7f32]/40 bg-[#cd7f32]/10">
        <Medal className="h-5 w-5 text-[#cd7f32]" />
      </div>
    );
  return (
    <div className="w-10 h-10 flex items-center justify-center border border-[#1a1a1f] bg-[#0a0a0d]">
      <span className="text-xs font-black text-[#444] tabular-nums">#{position}</span>
    </div>
  );
}

function positionColor(pos: number): string {
  if (pos === 1) return "#facc15";
  if (pos === 2) return "#aaaaaa";
  if (pos === 3) return "#cd7f32";
  return "#333";
}

/* ─── PODIUM CARD ─────────────────────────────── */
function PodiumCard({ user, delay }: { user: RankedUser; delay: number }) {
  const colors: Record<number, string> = { 1: "#facc15", 2: "#aaaaaa", 3: "#cd7f32" };
  const accent = colors[user.position] || "#f97316";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div className="relative mb-3" style={{ filter: `drop-shadow(0 0 16px ${accent}40)` }}>
        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${accent}60`, margin: "-4px" }} />
        <img
          src={user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`}
          alt={user.username}
          className={`object-cover border-2 ${user.position === 1 ? "w-24 h-24" : "w-16 h-16"}`}
          style={{ borderColor: accent }}
        />
        {user.position === 1 && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <Crown className="h-5 w-5" style={{ color: accent }} />
          </div>
        )}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 border flex items-center justify-center text-[10px] font-black"
          style={{ borderColor: `${accent}40`, background: "#080809", color: accent }}
        >
          {user.position}
        </div>
      </div>
      <p className="text-xs font-black text-white uppercase tracking-widest mt-3 truncate max-w-[120px]">
        {user.display_name || user.username}
      </p>
      <p className="text-[10px] text-[#444] font-mono">@{user.username}</p>
      <div className="flex items-center gap-1 mt-2">
        <Eye className="h-3 w-3" style={{ color: accent }} />
        <span className="text-sm font-black tabular-nums" style={{ color: accent }}>
          {user.views.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── RANKING PAGE ────────────────────────────── */
function RankingPage({ onGoHome }: { onGoHome: () => void }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPosition, setMyPosition] = useState<RankedUser | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, views, is_verified, bio")
        .order("views", { ascending: false })
        .limit(100);

      if (!error && data) {
        const ranked: RankedUser[] = data.map((p, i) => ({
          ...p,
          views: p.views || 0,
          is_verified: p.is_verified || false,
          bio: p.bio || "",
          position: i + 1,
        }));
        setUsers(ranked);
        if (user) {
          const me = ranked.find((u) => u.username === (user as any).username);
          setMyPosition(me || null);
        }
      }
      setLoading(false);
    };
    fetchRanking();
  }, [user]);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const top3 = users.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden flex flex-col">
      {/* grain */}
      <div className="pointer-events-none fixed inset-0 z-[999] opacity-[0.025]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />
      {/* grid */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      {/* glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)" }} />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 border-b border-[#111] bg-[#080808]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0">
        <button onClick={onGoHome} className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-[#f97316]" />
          <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
        </button>
        <div className="hidden md:flex items-center gap-1 border border-[#1a1a1a] p-1">
          <button onClick={onGoHome} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-[#444] hover:text-[#888] transition-colors">
            Home
          </button>
          <button className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-[#f97316] text-black">
            Rank
          </button>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/editor" className="flex items-center gap-2 border border-[#1a1a1a] px-3 py-1.5 hover:border-[#f97316]/30 transition-colors text-xs font-black uppercase tracking-widest text-[#555] hover:text-white">
            Dashboard <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-16 pb-10 px-6 max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 border border-[#1a1a1a] px-4 py-2 text-[10px] uppercase tracking-widest text-[#555] mb-8">
            <Trophy className="h-3 w-3 text-[#f97316]" />
            Ranking por visualizações
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-4">
            Top <span className="text-[#f97316]">Perfis</span>
          </h1>
          <p className="text-xs text-[#555] font-mono tracking-wide max-w-sm mx-auto">
            Os perfis mais visitados da plataforma. Atualizados em tempo real.
          </p>
        </motion.div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-24 space-y-10">
        {/* MY POSITION BANNER */}
        {myPosition && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="border border-[#f97316]/30 bg-[#f97316]/5 px-5 py-3 flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Sua posição</span>
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xl font-black text-white tabular-nums">#{myPosition.position}</span>
              <img src={myPosition.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${myPosition.username}`}
                className="w-7 h-7 border border-[#f97316]/30 object-cover" alt="you" />
              <span className="text-xs text-[#888]">@{myPosition.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-[#f97316]" />
              <span className="text-sm font-black text-white tabular-nums">{myPosition.views.toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        {/* PODIUM TOP 3 */}
        {!loading && top3.length >= 3 && (
          <section>
            <p className="text-[10px] uppercase tracking-widest text-[#333] mb-8 border-b border-[#111] pb-3">Pódio</p>
            <div className="flex items-end justify-center gap-6 md:gap-12 mb-4">
              {/* 2nd */}
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <PodiumCard user={top3[1]} delay={0.2} />
                  <div className="mt-4 w-24 bg-[#0d0d10] border-t-2 border-x border-b border-[#aaa]/20 h-16 flex items-center justify-center">
                    <span className="text-[10px] text-[#333] uppercase tracking-widest">#2</span>
                  </div>
                </div>
              )}
              {/* 1st */}
              {top3[0] && (
                <div className="flex flex-col items-center -mt-8">
                  <PodiumCard user={top3[0]} delay={0.1} />
                  <div className="mt-4 w-28 bg-[#0d0d10] border-t-2 border-x border-b border-[#facc15]/30 h-24 flex items-center justify-center">
                    <span className="text-[10px] text-[#facc15]/40 uppercase tracking-widest">#1</span>
                  </div>
                </div>
              )}
              {/* 3rd */}
              {top3[2] && (
                <div className="flex flex-col items-center mt-4">
                  <PodiumCard user={top3[2]} delay={0.3} />
                  <div className="mt-4 w-24 bg-[#0d0d10] border-t-2 border-x border-b border-[#cd7f32]/20 h-10 flex items-center justify-center">
                    <span className="text-[10px] text-[#333] uppercase tracking-widest">#3</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SEARCH */}
        <div className="border border-[#111] flex">
          <span className="px-4 flex items-center text-[#333] text-[10px] uppercase tracking-widest border-r border-[#111]">Buscar</span>
          <input type="text" placeholder="nome ou @username..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#080808] text-white placeholder-[#2a2a2a] focus:outline-none text-xs font-mono" />
        </div>

        {/* FULL TABLE */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#111] pb-3">
            <p className="text-[10px] uppercase tracking-widest text-[#333]">Ranking completo</p>
            <span className="text-[10px] text-[#222] font-mono">{filtered.length} perfis</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-[#0a0a0d] border border-[#0f0f12] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#111]">
              <p className="text-[#333] text-[10px] uppercase tracking-widest">Nenhum resultado</p>
            </div>
          ) : (
            <div className="space-y-px bg-[#0f0f12]">
              {filtered.map((u, idx) => {
                const isTop3 = u.position <= 3;
                const accent = positionColor(u.position);
                return (
                  <motion.div key={u.username}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.025, 0.5) }}
                    className={`flex items-center gap-4 px-5 py-3.5 bg-[#080808] hover:bg-[#0a0a0d] transition-colors group border-l-2 ${isTop3 ? "" : "border-l-transparent"}`}
                    style={isTop3 ? { borderLeftColor: `${accent}50` } : {}}
                  >
                    <RankBadge position={u.position} />
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-10 h-10 object-cover border border-[#1a1a1f] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white truncate max-w-[180px]">
                          {u.display_name || u.username}
                        </span>
                        {u.is_verified && <Shield className="h-3 w-3 text-blue-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-[#444] font-mono">@{u.username}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Eye className="h-3.5 w-3.5 text-[#333]" />
                      <span className="text-sm font-black tabular-nums" style={{ color: isTop3 ? accent : "#888" }}>
                        {u.views.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-[#333] uppercase tracking-widest hidden md:block">views</span>
                    </div>
                    <Link to={`/${u.username}`}
                      className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1f] hover:border-[#f97316]/40 text-[#444] hover:text-[#f97316] text-[9px] uppercase tracking-widest">
                      Ver <ArrowRight className="h-3 w-3" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <div className="border-t border-[#111] pt-6 text-center">
          <p className="text-[10px] text-[#222] font-mono uppercase tracking-widest">
            Ranking atualizado automaticamente · Top 100 perfis por visualizações
          </p>
        </div>
      </main>
    </div>
  );
}

/* ─── LANDING PAGE ────────────────────────────── */
const Landing = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState<"home" | "ranking">("home");
  const [usernameInput, setUsernameInput] = useState("");
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(102);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, views")
        .order("created_at", { ascending: false })
        .limit(7000000);

      if (profiles) {
        setTotalUsers(profiles.length || 102);
        setRecentUsers(profiles);
      }
    };
    fetchData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    if (user) {
      navigate("/editor");
    } else {
      navigate(`/register?suggested=${encodeURIComponent(usernameInput.trim())}`);
    }
  };

  // Show ranking page
  if (page === "ranking") {
    return <RankingPage onGoHome={() => setPage("home")} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden flex flex-col">

      {/* ── GRAIN OVERLAY ── */}
      <div className="pointer-events-none fixed inset-0 z-[999] opacity-[0.025]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />

      {/* ── GRID BG ── */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      {/* ── GLOW ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 65%)" }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="relative z-50 border-b border-[#111] bg-[#080808]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-[#f97316]" />
          <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 border border-[#1a1a1a] p-1">
          <button className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-[#f97316] text-black">
            Home
          </button>
          {/* ← BOTÃO RANK FUNCIONAL */}
          <button
            onClick={() => setPage("ranking")}
            className="px-6 py-2 text-xs font-black uppercase tracking-widest text-[#444] hover:text-[#888] transition-colors"
          >
            Rank
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#f97316] transition-colors uppercase tracking-widest">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              <Link to="/editor" className="flex items-center gap-3 border border-[#1a1a1a] px-3 py-1.5 hover:border-[#f97316]/30 transition-colors">
                <img
                  src={(user as any).avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}`}
                  alt="avatar"
                  className="w-6 h-6 object-cover grayscale border border-[#1a1a1a]"
                />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black tracking-widest text-white uppercase truncate max-w-[100px]">
                    {(user as any).display_name || (user as any).username}
                  </span>
                  <span className="text-[9px] text-[#444] uppercase tracking-widest">Member</span>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-xs text-[#555] hover:text-[#999] transition-colors uppercase tracking-widest">Login</Link>
              <Link to="/register" className="px-5 py-2 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors">
                Criar agora
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <main className="relative z-10 flex-grow">
        <section className="pt-28 pb-32 px-6 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 border border-[#1a1a1a] px-4 py-2 text-[10px] uppercase tracking-widest text-[#555] mb-12">
              <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full" />
              {totalUsers.toLocaleString()} membros ativos
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
              Sua identidade<br />
              <span className="text-[#f97316]">em um link</span>
            </h1>

            <p className="text-sm md:text-base text-[#555] mb-14 max-w-lg mx-auto font-mono tracking-wide leading-relaxed">
              Crie sua página personalizada em segundos.<br />
              Sem mensalidade. Sem complicação.
            </p>

            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-0 max-w-lg mx-auto mb-24 border border-[#1a1a1a]">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-[#f97316] text-xs font-black uppercase tracking-widest pointer-events-none">
                  safirahost.xyz/
                </span>
                <input
                  type="text"
                  placeholder="seunome"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  className="w-full pl-36 pr-5 py-5 bg-[#0a0a0a] text-white placeholder-[#2a2a2a] focus:outline-none focus:bg-[#0d0d0d] transition-colors text-sm font-mono"
                />
              </div>
              <button type="submit"
                className="px-10 py-5 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors flex items-center gap-2 justify-center">
                Criar <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {recentUsers.length > 0 && (
              <div className="w-full overflow-hidden border-t border-b border-[#111] py-5 mb-4">
                <div className="flex w-max" style={{ animation: "marquee 80s linear infinite" }}>
                  {[...recentUsers, ...recentUsers].map((u, i) => (
                    <Link key={`${u.username}-${i}`} to={`/${u.username}`} className="flex-shrink-0 mx-4">
                      <div className="flex items-center gap-2.5 border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2.5 min-w-[200px] hover:border-[#f97316]/30 transition-colors group">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`}
                          alt={u.username}
                          className="w-8 h-8 object-cover grayscale border border-[#1a1a1a]"
                        />
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[120px] group-hover:text-[#f97316] transition-colors">
                            {u.display_name || u.username}
                          </p>
                          <p className="text-[10px] text-[#333] font-mono">/{u.username}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </section>

        {/* STATS BAR */}
        <section className="border-t border-b border-[#111] bg-[#080808]">
          <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-[#111]">
            {[
              { label: "Membros ativos", value: totalUsers.toLocaleString() },
              { label: "Perfis criados", value: "100%" },
              { label: "Custo mensal", value: "R$ 0,00" },
            ].map((s) => (
              <div key={s.label} className="px-8 py-8 text-center">
                <p className="text-3xl md:text-4xl font-black text-white tabular-nums">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#444] mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PLANOS */}
        <section className="py-32 px-6 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-3">Planos</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Escolha seu plano</h2>
            <p className="text-xs text-[#444] mt-3 font-mono">Pague uma vez. Recursos para sempre.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-px bg-[#111]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#080808] p-10">
              <p className="text-[10px] uppercase tracking-widest text-[#444] mb-6">Plano</p>
              <h3 className="text-4xl font-black uppercase mb-2">Grátis</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black text-white">R$ 0</span>
                <span className="text-xs text-[#444] uppercase tracking-widest">/ vitalício</span>
              </div>
              <div className="space-y-3 mb-10">
                {["Página personalizável básica", "Links ilimitados", "Avatar e bio", "Analytics simples"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-[#f97316] text-xs font-black">—</span>
                    <span className="text-xs text-[#666] font-mono uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
              <Link to={user ? "/editor" : "/register"} className="block w-full py-4 border border-[#1a1a1a] text-center text-xs font-black uppercase tracking-widest text-[#555] hover:border-[#333] hover:text-[#888] transition-colors">
                Começar grátis
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[#080808] p-10 relative border-l border-[#f97316]/20">
              <div className="absolute top-6 right-6 border border-[#f97316]/30 px-3 py-1 text-[9px] uppercase tracking-widest text-[#f97316]/70 font-mono">Mais popular</div>
              <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-6">Plano</p>
              <h3 className="text-4xl font-black uppercase mb-2 text-[#f97316]">Premium</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-black text-white">R$ 29,90</span>
                <span className="text-xs text-[#444] uppercase tracking-widest">/ vitalício</span>
              </div>
              <p className="text-[10px] text-[#f97316]/60 font-mono mb-8 uppercase tracking-widest">Pague uma vez. Fique para sempre.</p>
              <div className="space-y-3 mb-10">
                {["Tudo do Grátis +", "Badges exclusivos", "Efeitos animados", "Vídeo / música de fundo", "Layouts e fontes custom", "Suporte prioritário"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-[#f97316] text-xs font-black">—</span>
                    <span className="text-xs text-[#666] font-mono uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
              <button disabled className="w-full py-4 bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316]/50 text-xs font-black uppercase tracking-widest cursor-not-allowed">Em breve</button>
            </motion.div>
          </div>
        </section>

        {/* BADGE SHOP */}
        <section className="py-32 px-6 max-w-5xl mx-auto border-t border-[#111]">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-3">Loja</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Badges</h2>
            <p className="text-xs text-[#444] mt-3 font-mono leading-relaxed">
              Destaque seu perfil com badges exclusivos.<br />
              Cada badge conta uma história — conquistas, status, identidade.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#111]">
            {BADGE_SHOP.map((badge, i) => (
              <motion.div key={badge.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="bg-[#080808] p-7 flex flex-col gap-5 relative group hover:bg-[#0a0a0a] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border flex items-center justify-center text-xl font-black"
                    style={{ borderColor: `${badge.accent}30`, color: badge.accent, background: `${badge.accent}08` }}>
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest" style={{ color: badge.accent }}>{badge.name}</p>
                    <p className="text-[10px] text-[#333] font-mono uppercase tracking-widest mt-0.5">{badge.priceNote}</p>
                  </div>
                </div>
                <p className="text-xs text-[#444] font-mono leading-relaxed flex-1">{badge.description}</p>
                <div className="border-t border-[#111]" />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-white tabular-nums">{badge.price}</span>
                  <button disabled className="flex items-center gap-2 px-4 py-2 border text-[10px] font-black uppercase tracking-widest cursor-not-allowed opacity-40"
                    style={{ borderColor: `${badge.accent}30`, color: badge.accent }}>
                    <Lock className="h-3 w-3" /> Em breve
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-0 h-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ borderTop: `24px solid ${badge.accent}20`, borderLeft: "24px solid transparent" }} />
              </motion.div>
            ))}
          </div>

          <div className="mt-px bg-[#080808] border border-[#111] border-t-0 px-7 py-5 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full flex-shrink-0" />
            <p className="text-[10px] text-[#333] font-mono uppercase tracking-widest">
              Todas as badges serão liberadas para compra em breve. Acompanhe nosso Discord para atualizações.
            </p>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-32 px-6 border-t border-[#111]">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
            <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-6">Pronto?</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
              Crie seu perfil<br />agora mesmo
            </h2>
            <p className="text-xs text-[#444] font-mono mb-12 uppercase tracking-widest">Grátis. Sem cartão. Sem mensalidade.</p>
            <Link to={user ? "/editor" : "/register"}
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors">
              {user ? "Ir para o editor" : "Criar minha página"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#111] bg-[#080808] pt-16 pb-10">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gem className="h-5 w-5 text-[#f97316]" />
              <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
            </div>
            <p className="text-[10px] text-[#333] font-mono uppercase tracking-widest leading-relaxed">Sua bio moderna<br />e cheia de estilo.</p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#444] font-black mb-5">Plataforma</h4>
            <ul className="space-y-3 text-[10px] font-mono uppercase tracking-widest">
              <li><Link to="/login" className="text-[#333] hover:text-[#888] transition-colors">Entrar</Link></li>
              <li><Link to="/register" className="text-[#333] hover:text-[#888] transition-colors">Cadastrar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#444] font-black mb-5">Comunidade</h4>
            <ul className="space-y-3 text-[10px] font-mono uppercase tracking-widest">
              <li><a href="https://discord.gg/..." className="text-[#333] hover:text-[#888] transition-colors">Discord</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#444] font-black mb-5">Legal</h4>
            <ul className="space-y-3 text-[10px] font-mono uppercase tracking-widest">
              <li><a href="/terms" className="text-[#333] hover:text-[#888] transition-colors">Termos</a></li>
              <li><a href="/privacy" className="text-[#333] hover:text-[#888] transition-colors">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#111] pt-8 text-center">
          <p className="text-[10px] text-[#222] font-mono uppercase tracking-widest">© 2026 Safira — Todos os direitos reservados.</p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Landing;