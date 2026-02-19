import { motion } from "framer-motion";
import { Gem, ArrowRight, Users, Eye, ShieldCheck, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BADGE_SHOP = [
  {
    id: "early",
    name: "Early Adopter",
    icon: "⚡",
    description: "Exclusivo para os primeiros membros da plataforma.",
    price: "Grátis",
    priceNote: "somente para os primeiros",
    accent: "#f97316",
    available: false,
  },
  {
    id: "verified",
    name: "Verified",
    icon: "✓",
    description: "Conta verificada pela equipe Safira.",
    price: "Convite",
    priceNote: "somente por convite",
    accent: "#3b82f6",
    available: false,
  },
  {
    id: "premium",
    name: "Premium",
    icon: "◆",
    description: "Acesso vitalício a todas as funcionalidades premium.",
    price: "R$ 29,90",
    priceNote: "pagamento único",
    accent: "#f97316",
    available: false,
  },
  {
    id: "og",
    name: "OG Member",
    icon: "👑",
    description: "Membro original. Histórico desde o lançamento.",
    price: "R$ 49,90",
    priceNote: "edição limitada",
    accent: "#facc15",
    available: false,
  },
  {
    id: "dev",
    name: "Developer",
    icon: "{ }",
    description: "Para desenvolvedores que contribuíram com o projeto.",
    price: "Conquista",
    priceNote: "concedida pela equipe",
    accent: "#10b981",
    available: false,
  },
  {
    id: "vip",
    name: "VIP",
    icon: "★",
    description: "Status de membro VIP na comunidade Safira.",
    price: "R$ 19,90",
    priceNote: "por mês",
    accent: "#8b5cf6",
    available: false,
  },
];

const Landing = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState("");
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(102);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, views")
        .order("created_at", { ascending: false })
        .limit(24);

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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden flex flex-col">

      {/* ── GRAIN OVERLAY ── */}
      <div className="pointer-events-none fixed inset-0 z-[999] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── GRID BG ── */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── GLOW ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 65%)" }} />
      </div>

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <nav className="relative z-50 border-b border-[#111] bg-[#080808]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-[#f97316]" />
          <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 border border-[#1a1a1a] p-1">
          <button className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-[#f97316] text-black">
            Home
          </button>
          <button className="px-6 py-2 text-xs font-black uppercase tracking-widest text-[#444] hover:text-[#888] transition-colors">
            Rank
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#f97316] transition-colors uppercase tracking-widest"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              <Link
                to="/editor"
                className="flex items-center gap-3 border border-[#1a1a1a] px-3 py-1.5 hover:border-[#f97316]/30 transition-colors"
              >
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
              <Link
                to="/login"
                className="text-xs text-[#555] hover:text-[#999] transition-colors uppercase tracking-widest"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors"
              >
                Criar agora
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <main className="relative z-10 flex-grow">
        <section className="pt-28 pb-32 px-6 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Pill */}
            <div className="inline-flex items-center gap-2 border border-[#1a1a1a] px-4 py-2 text-[10px] uppercase tracking-widest text-[#555] mb-12">
              <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full" />
              {totalUsers.toLocaleString()} membros ativos
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
              Sua identidade<br />
              <span className="text-[#f97316]">em um link</span>
            </h1>

            <p className="text-sm md:text-base text-[#555] mb-14 max-w-lg mx-auto font-mono tracking-wide leading-relaxed">
              Crie sua página personalizada em segundos.<br />
              Sem mensalidade. Sem complicação.
            </p>

            {/* Form */}
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
              <button
                type="submit"
                className="px-10 py-5 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors flex items-center gap-2 justify-center"
              >
                Criar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Marquee usuários */}
            {recentUsers.length > 0 && (
              <div className="w-full overflow-hidden border-t border-b border-[#111] py-5 mb-4">
                <div className="flex w-max" style={{ animation: "marquee 80s linear infinite" }}>
                  {[...recentUsers, ...recentUsers].map((u, i) => (
                    <Link
                      key={`${u.username}-${i}`}
                      to={`/${u.username}`}
                      className="flex-shrink-0 mx-4"
                    >
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

        {/* ════════════════════════════════════════
            STATS BAR
        ════════════════════════════════════════ */}
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

        {/* ════════════════════════════════════════
            PLANOS
        ════════════════════════════════════════ */}
        <section className="py-32 px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-3">Planos</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
              Escolha seu plano
            </h2>
            <p className="text-xs text-[#444] mt-3 font-mono">Pague uma vez. Recursos para sempre.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-px bg-[#111]">
            {/* Grátis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#080808] p-10"
            >
              <p className="text-[10px] uppercase tracking-widest text-[#444] mb-6">Plano</p>
              <h3 className="text-4xl font-black uppercase mb-2">Grátis</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black text-white">R$ 0</span>
                <span className="text-xs text-[#444] uppercase tracking-widest">/ vitalício</span>
              </div>

              <div className="space-y-3 mb-10">
                {[
                  "Página personalizável básica",
                  "Links ilimitados",
                  "Avatar e bio",
                  "Analytics simples",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-[#f97316] text-xs font-black">—</span>
                    <span className="text-xs text-[#666] font-mono uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to={user ? "/editor" : "/register"}
                className="block w-full py-4 border border-[#1a1a1a] text-center text-xs font-black uppercase tracking-widest text-[#555] hover:border-[#333] hover:text-[#888] transition-colors"
              >
                Começar grátis
              </Link>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-[#080808] p-10 relative border-l border-[#f97316]/20"
            >
              <div className="absolute top-6 right-6 border border-[#f97316]/30 px-3 py-1 text-[9px] uppercase tracking-widest text-[#f97316]/70 font-mono">
                Mais popular
              </div>

              <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-6">Plano</p>
              <h3 className="text-4xl font-black uppercase mb-2 text-[#f97316]">Premium</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-black text-white">R$ 29,90</span>
                <span className="text-xs text-[#444] uppercase tracking-widest">/ vitalício</span>
              </div>
              <p className="text-[10px] text-[#f97316]/60 font-mono mb-8 uppercase tracking-widest">
                Pague uma vez. Fique para sempre.
              </p>

              <div className="space-y-3 mb-10">
                {[
                  "Tudo do Grátis +",
                  "Badges exclusivos",
                  "Efeitos animados",
                  "Vídeo / música de fundo",
                  "Layouts e fontes custom",
                  "Suporte prioritário",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-[#f97316] text-xs font-black">—</span>
                    <span className="text-xs text-[#666] font-mono uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>

              <button
                disabled
                className="w-full py-4 bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316]/50 text-xs font-black uppercase tracking-widest cursor-not-allowed"
              >
                Em breve
              </button>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            BADGE SHOP
        ════════════════════════════════════════ */}
        <section className="py-32 px-6 max-w-5xl mx-auto border-t border-[#111]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-3">Loja</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
              Badges
            </h2>
            <p className="text-xs text-[#444] mt-3 font-mono leading-relaxed">
              Destaque seu perfil com badges exclusivos.<br />
              Cada badge conta uma história — conquistas, status, identidade.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#111]">
            {BADGE_SHOP.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#080808] p-7 flex flex-col gap-5 relative group hover:bg-[#0a0a0a] transition-colors"
              >
                {/* Ícone */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 border flex items-center justify-center text-xl font-black"
                    style={{ borderColor: `${badge.accent}30`, color: badge.accent, background: `${badge.accent}08` }}
                  >
                    {badge.icon}
                  </div>
                  <div>
                    <p
                      className="text-sm font-black uppercase tracking-widest"
                      style={{ color: badge.accent }}
                    >
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-[#333] font-mono uppercase tracking-widest mt-0.5">
                      {badge.priceNote}
                    </p>
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-xs text-[#444] font-mono leading-relaxed flex-1">
                  {badge.description}
                </p>

                {/* Divider */}
                <div className="border-t border-[#111]" />

                {/* Preço + Botão */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-white tabular-nums">
                    {badge.price}
                  </span>

                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 border text-[10px] font-black uppercase tracking-widest cursor-not-allowed opacity-40 transition-colors"
                    style={{ borderColor: `${badge.accent}30`, color: badge.accent }}
                  >
                    <Lock className="h-3 w-3" />
                    Em breve
                  </button>
                </div>

                {/* Corner accent */}
                <div
                  className="absolute top-0 right-0 w-0 h-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    borderTop: `24px solid ${badge.accent}20`,
                    borderLeft: "24px solid transparent",
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Info bar */}
          <div className="mt-px bg-[#080808] border border-[#111] border-t-0 px-7 py-5 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full flex-shrink-0" />
            <p className="text-[10px] text-[#333] font-mono uppercase tracking-widest">
              Todas as badges serão liberadas para compra em breve. Acompanhe nosso Discord para atualizações.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            CTA FINAL
        ════════════════════════════════════════ */}
        <section className="py-32 px-6 border-t border-[#111]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-6">Pronto?</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
              Crie seu perfil<br />agora mesmo
            </h2>
            <p className="text-xs text-[#444] font-mono mb-12 uppercase tracking-widest">
              Grátis. Sem cartão. Sem mensalidade.
            </p>
            <Link
              to={user ? "/editor" : "/register"}
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors"
            >
              {user ? "Ir para o editor" : "Criar minha página"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#111] bg-[#080808] pt-16 pb-10">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gem className="h-5 w-5 text-[#f97316]" />
              <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
            </div>
            <p className="text-[10px] text-[#333] font-mono uppercase tracking-widest leading-relaxed">
              Sua bio moderna<br />e cheia de estilo.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#444] font-black mb-5">Plataforma</h4>
            <ul className="space-y-3 text-[10px] font-mono uppercase tracking-widest">
              <li><Link to="/login"    className="text-[#333] hover:text-[#888] transition-colors">Entrar</Link></li>
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
              <li><a href="/terms"   className="text-[#333] hover:text-[#888] transition-colors">Termos</a></li>
              <li><a href="/privacy" className="text-[#333] hover:text-[#888] transition-colors">Privacidade</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#111] pt-8 text-center">
          <p className="text-[10px] text-[#222] font-mono uppercase tracking-widest">
            © 2026 Safira — Todos os direitos reservados.
          </p>
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
