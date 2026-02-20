// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IntegrationsTab.tsx
// Substitua o bloco {activeEditorTab === "integrations"} 
// no seu SafiraDashboard pelo conteúdo abaixo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useEffect, useState, useRef } from "react";
import { Globe, Code2, Lock, ExternalLink, Wifi, WifiOff, Users, Eye, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Lanyard WebSocket hook ───────────────────────────────
function useLanyardPreview(userId: string) {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const hbRef = useRef<any>(null);

  useEffect(() => {
    if (!userId || userId.trim().length < 10) {
      setData(null);
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    const ws = new WebSocket("wss://api.lanyard.rest/socket");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId.trim() } }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.op === 1) {
        hbRef.current = setInterval(() => ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
      }
      if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
        setData(msg.d);
        setStatus("connected");
      }
    };

    ws.onerror = () => setStatus("error");
    ws.onclose = () => clearInterval(hbRef.current);

    return () => {
      clearInterval(hbRef.current);
      ws.close();
    };
  }, [userId]);

  return { data, status };
}

// ─── Status helpers ───────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
};
const STATUS_LABEL: Record<string, string> = {
  online: "Online", idle: "Ausente", dnd: "Não Perturbe", offline: "Offline",
};

function discordAvatarUrl(userId: string, hash: string | null, size = 80) {
  if (!hash) return `https://cdn.discordapp.com/embed/avatars/${Number(userId) % 5}.png`;
  const ext = hash.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/avatars/${userId}/${hash}.${ext}?size=${size}`;
}

// ─── Mini card preview ───────────────────────────────────
function LanyardMiniCard({ data, profile }: { data: any; profile: any }) {
  const du = data.discord_user;
  const st = data.discord_status;
  const sp = data.spotify;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden w-full"
      style={{
        background: "linear-gradient(145deg, #1a1a20, #0d0d12)",
        border: "1.5px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Top glow line */}
      <div className="h-[1.5px] w-full" style={{ background: "linear-gradient(90deg, transparent, #5865f240, transparent)" }} />

      <div className="p-4 flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <img
            src={discordAvatarUrl(du.id, du.avatar)}
            alt={du.username}
            className="w-16 h-16 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2.5px #0d0d12, 0 0 0 4px ${STATUS_COLOR[st]}50` }}
          />
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#0d0d12]" style={{ backgroundColor: STATUS_COLOR[st] }} />
        </div>

        {/* Name + bio */}
        <div className="text-center">
          <p className="text-sm font-bold text-white">{du.global_name || du.username}</p>
          {profile.bio && <p className="text-[10px] text-white/40 mt-0.5 max-w-[200px] truncate">{profile.bio}</p>}
          {profile.location && (
            <div className="flex items-center justify-center gap-1 text-white/30 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />
              <span className="text-[10px]">{profile.location}</span>
            </div>
          )}
        </div>

        <div className="w-full h-px bg-white/[0.06]" />

        {/* Discord Member row */}
        <div className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-white/[0.07] bg-white/[0.04]">
          <img src={discordAvatarUrl(du.id, du.avatar, 40)} className="w-8 h-8 rounded-full object-cover" alt="" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{du.global_name || du.username}</p>
            <p className="text-[10px] text-white/40 font-mono">Discord Member</p>
          </div>
          <span className="text-[10px] px-2 py-1 border border-white/10 text-white/60 rounded-md">Profile</span>
        </div>

        {/* Spotify row */}
        {sp && (
          <div className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-[#1db954]/20 bg-[#1db954]/[0.05]">
            <img src={sp.album_art_url} className="w-8 h-8 rounded object-cover" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{sp.song}</p>
              <p className="text-[10px] text-white/40 truncate">{sp.artist}</p>
            </div>
            <div className="flex gap-[2px] items-end h-3">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-[2px] rounded-full bg-[#1db954]"
                  animate={{ height: ["2px","10px","2px"] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main IntegrationsTab export ─────────────────────────
// Use assim no dashboard:
//   {activeEditorTab === "integrations" && (
//     <IntegrationsTab
//       discordUserId={discordUserId}
//       setDiscordUserId={setDiscordUserId}
//       profile={profile}
//     />
//   )}

export function IntegrationsTab({
  discordUserId,
  setDiscordUserId,
  profile,
}: {
  discordUserId: string;
  setDiscordUserId: (v: string) => void;
  profile: any;
}) {
  const { data: lanyardData, status: lanyardStatus } = useLanyardPreview(discordUserId);

  const statusConfig = {
    idle:       { color: "#666",     icon: <WifiOff className="w-3 h-3" />, label: "Digite seu Discord ID" },
    connecting: { color: "#f0b232",  icon: <Wifi className="w-3 h-3" />,    label: "Conectando ao Lanyard..." },
    connected:  { color: "#23a559",  icon: <Wifi className="w-3 h-3" />,    label: "Conectado · dados ao vivo" },
    error:      { color: "#f23f43",  icon: <WifiOff className="w-3 h-3" />, label: "ID inválido ou não monitorado pelo Lanyard" },
  }[lanyardStatus];

  return (
    <div className="space-y-8">

      {/* ─── Header ─── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Integrações</p>
        <p className="text-xs text-[#333] font-mono">Conecte serviços externos ao seu perfil</p>
      </div>

      {/* ─── Discord / Lanyard ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#111] pb-2">
          <div className="w-6 h-6 rounded bg-[#5865f2]/20 border border-[#5865f2]/30 flex items-center justify-center">
            <span className="text-sm">💬</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#555] font-black">Discord · Lanyard</p>
        </div>

        {/* Input */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">
            Discord User ID
          </label>
          <div className="flex border border-[#1a1a1f] focus-within:border-[#5865f2]/40 transition-colors">
            <span className="inline-flex items-center px-3 py-2.5 bg-[#080809] text-[#333] text-[10px] border-r border-[#1a1a1f] font-mono select-none">
              ID
            </span>
            <input
              value={discordUserId}
              onChange={(e) => setDiscordUserId(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 200207310625177602"
              maxLength={20}
              className="flex-1 px-4 py-2.5 bg-[#0d0d10] text-white text-sm placeholder-[#333] outline-none font-mono"
            />
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 mt-2" style={{ color: statusConfig.color }}>
            {statusConfig.icon}
            <span className="text-[10px] font-mono">{statusConfig.label}</span>
          </div>
          <p className="text-[10px] text-[#2a2a2a] font-mono mt-1">
            Clique direito no seu nome no Discord → Copiar ID de usuário
          </p>
        </div>

        {/* Live preview */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#333] mb-3 font-black">
            Preview do card Discord
          </p>

          <AnimatePresence mode="wait">
            {lanyardStatus === "idle" && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 border border-dashed border-[#1a1a1f] rounded-xl gap-3"
              >
                <div className="w-12 h-12 rounded-full border border-[#1a1a1f] bg-[#0a0a0d] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#222]" />
                </div>
                <p className="text-[10px] text-[#222] uppercase tracking-widest">
                  Digite seu Discord ID para ver o preview
                </p>
              </motion.div>
            )}

            {lanyardStatus === "connecting" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-10 border border-[#1a1a1f] rounded-xl"
              >
                <motion.div
                  className="w-4 h-4 rounded-full border border-[#5865f2]/30 border-t-[#5865f2]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-[11px] text-[#333] font-mono">Conectando ao Lanyard...</span>
              </motion.div>
            )}

            {lanyardStatus === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 py-8 border border-red-900/20 rounded-xl bg-red-900/5"
              >
                <WifiOff className="w-6 h-6 text-red-500/40" />
                <p className="text-[11px] text-red-500/60 font-mono text-center px-4">
                  Não foi possível buscar dados.<br />
                  Verifique se o ID está correto e se você está no Lanyard.
                </p>
                <a
                  href="https://lanyard.rest"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] text-[#5865f2]/60 hover:text-[#5865f2] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Saiba mais sobre o Lanyard
                </a>
              </motion.div>
            )}

            {lanyardStatus === "connected" && lanyardData && (
              <LanyardMiniCard key="card" data={lanyardData} profile={profile} />
            )}
          </AnimatePresence>
        </div>

        {/* Info box */}
        <div className="border border-[#5865f2]/10 bg-[#5865f2]/5 px-4 py-3 flex items-start gap-3">
          <span className="text-sm flex-shrink-0 mt-0.5">💬</span>
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#5865f2]/70 font-mono">
              O Lanyard exibe seu status, atividade e servidor Discord em tempo real.
            </p>
            <p className="text-[9px] text-[#333] font-mono">
              Para funcionar, você precisa estar no servidor do Lanyard:
            </p>
            <a
              href="https://discord.gg/lanyard"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[9px] text-[#5865f2]/60 hover:text-[#5865f2] transition-colors mt-1"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              discord.gg/lanyard
            </a>
          </div>
        </div>
      </div>

      {/* ─── Outros recursos bloqueados ─── */}
      {[
        { title: "Domínio Personalizado", icon: <Globe className="h-4 w-4" />, color: "#f97316" },
        { title: "CSS Personalizado",     icon: <Code2 className="h-4 w-4" />, color: "#8b5cf6" },
      ].map((feat) => (
        <div key={feat.title} className="relative border border-[#1a1a1f] bg-[#080809] p-5 overflow-hidden">
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ backdropFilter: "blur(4px)", background: "rgba(5,5,7,0.7)" }}
          >
            <div className="text-center">
              <div
                className="flex items-center gap-2 px-3 py-1.5 border mx-auto w-fit mb-2"
                style={{ borderColor: `${feat.color}40`, background: `${feat.color}10` }}
              >
                <Lock className="h-3 w-3" style={{ color: feat.color }} />
                <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: feat.color }}>Em Breve</span>
              </div>
              <p className="text-xs text-[#555] font-mono">{feat.title} estará disponível em breve.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 opacity-10">
            <span className="text-[#333]">{feat.icon}</span>
            <p className="text-[10px] uppercase tracking-widest text-[#333] font-black">{feat.title}</p>
          </div>
          <div className="h-12 bg-[#0d0d10] border border-[#111] opacity-10" />
        </div>
      ))}

      <p className="text-[10px] text-[#222] font-mono uppercase tracking-widest pt-2 border-t border-[#0f0f0f]">
        Em breve: Spotify, GitHub, Steam...
      </p>
    </div>
  );
}
