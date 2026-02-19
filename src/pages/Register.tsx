import { useState } from "react";
import { motion } from "framer-motion";
import { Gem, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.length < 3) { setError("Username deve ter no mínimo 3 caracteres"); return; }
    if (password.length < 6) { setError("Senha deve ter no mínimo 6 caracteres"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, username);
    if (error) {
      setError(error.message);
    } else {
      navigate("/editor");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col">

      {/* ── GRAIN ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[999] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── GRID ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── GLOW ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute top-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 65%)" }}
        />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-50 border-b border-[#111] bg-[#080808]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-[#f97316]" />
          <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
        </Link>
        <Link
          to="/login"
          className="text-xs text-[#444] hover:text-[#888] transition-colors uppercase tracking-widest"
        >
          Já tenho conta
        </Link>
      </header>

      {/* ── MAIN ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >

          {/* Card */}
          <div className="border border-[#1a1a1a] bg-[#080808]">

            {/* Top bar */}
            <div className="border-b border-[#111] px-8 py-6">
              <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Cadastro</p>
              <h1 className="text-2xl font-black uppercase tracking-tight">Criar conta</h1>
              <p className="text-xs text-[#444] font-mono mt-1">Sua página em menos de 1 minuto</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">

              {/* Username */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">
                  Username
                </label>
                <div className="flex border border-[#1a1a1a] focus-within:border-[#f97316] transition-colors">
                  <span className="inline-flex items-center px-4 py-3 bg-[#0a0a0a] text-[#f97316] text-xs border-r border-[#1a1a1a] font-black">
                    @
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    required
                    placeholder="seunome"
                    className="flex-1 px-4 py-3 bg-[#0d0d0d] text-white text-sm placeholder-[#2a2a2a] outline-none font-mono"
                  />
                </div>
                <p className="text-[9px] text-[#222] font-mono mt-1.5 uppercase tracking-widest">
                  safirahost.xyz/{username || "seunome"}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="voce@exemplo.com"
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm placeholder-[#2a2a2a] focus:border-[#f97316] outline-none font-mono transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mín. 6 caracteres"
                    className="w-full px-4 py-3 pr-12 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm placeholder-[#2a2a2a] focus:border-[#f97316] outline-none font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#666] transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="border border-red-900/40 bg-red-950/20 px-4 py-3">
                  <p className="text-xs text-red-400 font-mono">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-black/40 border-t-black rounded-full animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar conta
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer do card */}
            <div className="border-t border-[#111] px-8 py-5 flex items-center justify-center gap-2">
              <span className="text-xs text-[#333] font-mono uppercase tracking-widest">
                Já tem conta?
              </span>
              <Link
                to="/login"
                className="text-xs text-[#f97316] font-black uppercase tracking-widest hover:text-[#e06210] transition-colors"
              >
                Entrar
              </Link>
            </div>
          </div>

          {/* Decorative line */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 h-px bg-[#111]" />
            <span className="text-[9px] text-[#222] uppercase tracking-widest font-mono">safirahost.xyz</span>
            <div className="flex-1 h-px bg-[#111]" />
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Register;
