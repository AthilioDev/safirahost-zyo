import { motion } from "framer-motion";
import { Gem, Sparkles, ArrowRight, Users, Link as LinkIcon, Eye, ChevronRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState("");
  const [stats, setStats] = useState({ users: 0, views: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, views")
        .order("created_at", { ascending: false })
        .limit(24);

      if (profiles) {
        setStats({
          users: profiles.length,
          views: profiles.reduce((sum, p) => sum + (p.views || 0), 0),
        });
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
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden flex flex-col">
      {/* Fundo animado */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="absolute inset-0">
          <div className="moving-light" style={{ top: "15%", left: "10%", width: "28vw", height: "28vw", animationDuration: "18s" }} />
          <div className="moving-light" style={{ top: "55%", left: "70%", width: "20vw", height: "20vw", animationDuration: "22s", animationDelay: "3s" }} />
          <div className="moving-light" style={{ top: "40%", left: "35%", width: "24vw", height: "24vw", animationDuration: "15s", animationDelay: "6s" }} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-85" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex justify-center pt-5 pb-4">
        <div className="relative flex items-center justify-between w-[95%] max-w-7xl px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full shadow-xl">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/25 blur-xl rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
              <Gem className="h-10 w-10 text-orange-500 relative" />
            </div>
            <span className="text-2xl font-black tracking-tight">Safira</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full p-1.5">
            <button className="px-7 py-2.5 rounded-full text-sm font-bold tracking-widest bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.45)]">
              HOME
            </button>
            <button className="px-7 py-2.5 rounded-full text-sm font-bold tracking-widest text-gray-300 hover:text-white hover:bg-white/10 transition">
              RANK
            </button>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-900/60 transition"
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                )}
                <Link
                  to="/editor"
                  className="flex items-center gap-3 bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/30 pl-1.5 pr-5 py-1 rounded-full transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center border border-white/15 overflow-hidden">
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}`}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold tracking-wide truncate max-w-[110px]">
                      {user.display_name || user.username}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Member</span>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-300 hover:text-white transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:shadow-[0_0_30px_rgba(249,115,22,0.7)]"
                >
                  Criar agora
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-grow pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <a
              href="https://discord.gg/sua-comunidade"
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-950/50 border border-blue-500/30 text-blue-300 text-sm mb-10 hover:bg-blue-950/70 transition"
            >
              <Sparkles className="h-4 w-4" /> Entre na comunidade Discord!
            </a>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-tight mb-6">
              Sua identidade<br className="hidden sm:block" /> em um link só
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light">
              Crie sua página personalizada em segundos. Já somos{" "}
              <span className="text-orange-400 font-bold">{stats.users.toLocaleString()}</span> membros.
            </p>

            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto mb-20">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-orange-500 font-bold text-lg">
                  safirahost.xyz/
                </div>
                <input
                  type="text"
                  placeholder="seu nome"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  className="w-full pl-36 pr-6 py-6 bg-[#0f0f0f] border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/30 transition-all text-xl"
                />
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-12 py-6 bg-gradient-to-r from-white to-gray-200 text-black font-black rounded-2xl hover:from-gray-100 hover:to-white transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] text-lg"
              >
                Criar
              </button>
            </form>

            {/* Marquee usuários */}
            {recentUsers.length > 0 && (
              <div className="w-full max-w-7xl mx-auto overflow-hidden mb-24">
                <div className="flex w-max animate-marquee-slow hover:pause">
                  {[...recentUsers, ...recentUsers].map((u, i) => (
                    <Link
                      key={`${u.username}-${i}`}
                      to={`/${u.username}`}
                      className="flex-shrink-0 mx-3"
                    >
                      <div className="flex items-center gap-3 bg-black/50 border border-white/8 rounded-xl p-4 min-w-[240px] hover:bg-black/70 hover:border-orange-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border border-white/10 group-hover:border-orange-500/50 transition">
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`}
                            alt={u.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-gray-100 font-medium truncate max-w-[140px] group-hover:text-white">
                            {u.display_name || u.username}
                          </p>
                          <p className="text-gray-500 text-sm truncate max-w-[140px]">
                            /{u.username}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Seção Planos / VIP */}
        <section className="max-w-6xl mx-auto px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Escolha seu plano</h2>
            <p className="text-xl text-gray-400">Pague uma vez. Recursos para sempre.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plano Grátis */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col relative overflow-hidden hover:border-white/20 transition-all group"
            >
              <div className="mb-8">
                <h3 className="text-3xl font-black mb-3">Grátis</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">R$ 0</span>
                  <span className="text-gray-500">/vitalício</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Página personalizável básica",
                  "Links ilimitados",
                  "Avatar e bio",
                  "Analytics simples",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to={user ? "/editor" : "/register"}
                className="py-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-center transition-all border border-white/10"
              >
                Começar grátis
              </Link>
            </motion.div>

            {/* Plano Premium / VIP */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-b from-[#1a0f1a] to-[#0a0a0a] border border-orange-500/30 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-orange-500/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.2)] transition-all"
            >
              <div className="absolute top-6 right-6 px-4 py-1 bg-orange-600/20 border border-orange-500/40 rounded-full text-orange-300 text-xs font-bold">
                Mais popular
              </div>

              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="mb-8 relative z-10">
                <h3 className="text-3xl font-black mb-3 text-orange-300">Premium</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">R$ 29,90</span>
                  <span className="text-gray-500">/vitalício</span>
                </div>
                <p className="text-orange-200/80 text-sm mt-1 font-medium">Pague uma vez. Fique para sempre.</p>
              </div>

              <ul className="space-y-4 mb-10 flex-grow relative z-10">
                {[
                  "Tudo do Grátis +",
                  "Badges exclusivos",
                  "Efeitos animados (partículas, glows, etc)",
                  "Vídeo/música de fundo",
                  "Mais layouts e fontes custom",
                  "Prioridade no suporte",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-200">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-orange-400 rounded-full" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="py-5 rounded-2xl bg-orange-600/40 text-orange-200 font-bold text-center cursor-not-allowed opacity-70 border border-orange-500/30 relative z-10"
              >
                Em breve (pague uma vez)
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050505] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Gem className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-black">Safira</span>
            </div>
            <p className="text-gray-500 text-sm">Sua bio moderna e cheia de estilo.</p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Links rápidos</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/login" className="hover:text-white">Entrar</Link></li>
              <li><Link to="/register" className="hover:text-white">Cadastrar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Comunidade</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="https://discord.gg/..." className="hover:text-white">Discord</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/terms" className="hover:text-white">Termos</a></li>
              <li><a href="/privacy" className="hover:text-white">Privacidade</a></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-gray-600 text-sm border-t border-white/5 pt-8">
          © 2026 Safira.gg — Todos os direitos reservados.
        </div>
      </footer>

      {/* Estilos globais necessários */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50% { transform: translate(40px, -40px) scale(1.15); opacity: 0.9; }
        }
        .moving-light {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%);
          filter: blur(80px);
          animation: float infinite ease-in-out;
        }
        .animate-marquee-slow {
          animation: marquee 80s linear infinite;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .pause:hover .animate-marquee-slow { animation-play-state: paused; }
        .bg-grid {
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

export default Landing;