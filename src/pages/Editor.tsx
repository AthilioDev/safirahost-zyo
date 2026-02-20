import { useState, useEffect, useRef } from "react";
import {
  Gem, Eye, Settings, User, Link2, Award, Palette, Sliders, Zap,
  LogOut, Bell, ChevronDown, Copy, ExternalLink,
  Image as ImgIcon, Globe, Code2, Lock, Save, Plus,
  Trash2, Camera, Upload, Home, BarChart2, Users, Star, Check,
  X, Menu, Shield, Edit3, Hash, MousePointer2, Trash,
  Wifi, WifiOff, MapPin, TrendingUp, Monitor, Smartphone,
  Tablet, Percent, Circle, ChevronRight, Sparkles,
  ToggleLeft, ToggleRight, Volume2, Paintbrush, Type,
  RefreshCw, Info, CheckCircle2, AlertCircle, Layers
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const LINK_ICONS: Record<string, string> = {
  website: "🌐", github: "🐙", twitter: "✖️", instagram: "📷", discord: "💬",
};

const PRESET_COLORS = [
  "#f97316","#ec4899","#8b5cf6","#3b82f6",
  "#10b981","#ef4444","#facc15","#ffffff",
];

const ANNOUNCEMENTS = [
  {
    title: "Próximas Evoluções da Plataforma!",
    date: "09/02/2026 · 16:46",
    body: "Iremos implementar efeito 3D com perspective nos cards de usuários, adicionando profundidade dinâmica ao hover, além de novos sistemas visuais interativos que complementam o rank e elevam a experiência da dashboard. - Ainda hoje!",
  },
  {
    title: "Melhore sua experiência",
    date: "08/02/2026 · 10:00",
    body: "Desbloqueie recursos premium e destaque seu perfil com badges exclusivos.",
  },
];

const MAX_EQUIPPED = 6;

// Editor sections mapped to sidebar
const EDITOR_SECTIONS: Record<string, string> = {
  profile: "Perfil",
  links: "Links",
  badges: "Badges",
  style: "Estilo",
  advanced: "Avançado",
  integrations: "Integrações",
};

// ─── MOCK ANALYTICS DATA ───────────────────────────────────
const MOCK_VIEWS_7D = [
  { day: "Seg", views: 12 },
  { day: "Ter", views: 28 },
  { day: "Qua", views: 19 },
  { day: "Qui", views: 35 },
  { day: "Sex", views: 42 },
  { day: "Sáb", views: 31 },
  { day: "Dom", views: 24 },
];
const MOCK_DEVICES = [
  { label: "Desktop", value: 58, icon: <Monitor className="w-3.5 h-3.5" />, color: "#f97316" },
  { label: "Mobile", value: 34, icon: <Smartphone className="w-3.5 h-3.5" />, color: "#3b82f6" },
  { label: "Tablet", value: 8, icon: <Tablet className="w-3.5 h-3.5" />, color: "#8b5cf6" },
];

// ─── LANYARD ──────────────────────────────────────────────
function useLanyard(userId: string) {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const hbRef = useRef<any>(null);

  useEffect(() => {
    if (wsRef.current) { wsRef.current.close(); clearInterval(hbRef.current); }
    if (!userId || userId.trim().length < 10) { setData(null); setStatus("idle"); return; }
    setStatus("connecting");
    const ws = new WebSocket("wss://api.lanyard.rest/socket");
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId.trim() } }));
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.op === 1) {
        hbRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
        }, msg.d.heartbeat_interval);
      }
      if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
        setData(msg.d); setStatus("connected");
      }
    };
    ws.onerror = () => setStatus("error");
    ws.onclose = () => clearInterval(hbRef.current);
    return () => { clearInterval(hbRef.current); ws.close(); };
  }, [userId]);

  return { data, status };
}

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
function guildIconUrl(guildId: string, hash: string | null) {
  if (!hash) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${hash}.webp?size=64`;
}

// ─── LANYARD SECTION ──────────────────────────────────────
function LanyardSection({ lanyardData }: { lanyardData: any }) {
  const du = lanyardData.discord_user;
  const st = lanyardData.discord_status;
  const sp = lanyardData.spotify;
  const guild = lanyardData.guild_member_data?.guild;

  return (
    <div className="space-y-2 mt-3">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-200">
        <div className="relative flex-shrink-0">
          <img src={discordAvatarUrl(du.id, du.avatar)} alt={du.username}
            className="w-10 h-10 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2.5px #111115, 0 0 0 4px ${STATUS_COLOR[st]}60` }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111115]"
            style={{ backgroundColor: STATUS_COLOR[st] }} title={STATUS_LABEL[st]} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight">
            {du.global_name || du.display_name || du.username}
          </p>
          <p className="text-[10px] text-white/40 font-mono">Discord Member</p>
        </div>
        <motion.a href={`https://discord.com/users/${du.id}`} target="_blank" rel="noreferrer"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all">
          Profile
        </motion.a>
      </motion.div>
      {sp && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex items-center gap-3 p-3 rounded-2xl border border-[#1db954]/20 bg-[#1db954]/[0.05] hover:bg-[#1db954]/[0.08] transition-all duration-200">
          <img src={sp.album_art_url} alt={sp.song} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{sp.song}</p>
            <p className="text-[10px] text-white/40 truncate">{sp.artist}</p>
          </div>
          <div className="flex items-end gap-[2px] h-3 flex-shrink-0">
            {[0,1,2].map((i) => (
              <motion.div key={i} className="w-[2px] rounded-full bg-[#1db954]"
                animate={{ height: ["3px","10px","3px"] }} transition={{ duration: 0.5, repeat: Infinity, delay: i*0.15 }} />
            ))}
          </div>
        </motion.div>
      )}
      {guild && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-200">
          {guildIconUrl(guild.id, guild.icon)
            ? <img src={guildIconUrl(guild.id, guild.icon)!} alt={guild.name} className="w-10 h-10 rounded-[30%] object-cover flex-shrink-0" />
            : <div className="w-10 h-10 rounded-[30%] bg-white/10 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-white/40" /></div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{guild.name}</p>
            <p className="text-[10px] text-white/40 font-mono">
              <span className="text-[#23a559]">●</span>{" "}
              {guild.approximate_presence_count >= 1000 ? `${(guild.approximate_presence_count/1000).toFixed(1)}k` : guild.approximate_presence_count?.toLocaleString("pt-BR") ?? "?"} Online
              <span className="text-white/20"> · </span>
              {guild.approximate_member_count >= 1000 ? `${(guild.approximate_member_count/1000).toFixed(1)}k` : guild.approximate_member_count?.toLocaleString("pt-BR") ?? "?"} Membros
            </p>
          </div>
          <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-[#5865f2] hover:bg-[#4752c4] transition-all cursor-default">
            Join
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}

// ─── BADGE ICON ────────────────────────────────────────────
function BadgeIcon({ icon, size = 28, color = "#f97316" }: { icon: string; size?: number; color?: string }) {
  if (!icon || icon.trim() === "") return <span style={{ fontSize: size * 0.65, color, lineHeight: 1 }}>✦</span>;
  const trimmed = icon.trim();
  if (trimmed.startsWith("http") || trimmed.startsWith("/") || trimmed.startsWith("data:")) {
    return <img src={trimmed} alt="" style={{ width: size, height: size, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  if (trimmed.startsWith("<svg")) return <span style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: trimmed }} />;
  const graphemes = [...new Intl.Segmenter().segment(trimmed)];
  const isEmoji = graphemes.length <= 3 && /\p{Emoji}/u.test(trimmed);
  if (isEmoji) return <span style={{ fontSize: size * 0.78, lineHeight: 1, userSelect: "none", display: "block" }}>{trimmed}</span>;
  if (trimmed.length <= 3) return <span style={{ fontSize: Math.max(size * 0.42, 10), fontFamily: "monospace", fontWeight: 900, color, letterSpacing: "-0.03em", display: "block", lineHeight: 1 }}>{trimmed}</span>;
  return <span style={{ fontSize: Math.max(size * 0.36, 9), fontFamily: "monospace", fontWeight: 900, color, letterSpacing: "-0.04em", display: "block", lineHeight: 1 }}>{trimmed.slice(0,4).toUpperCase()}</span>;
}

// ─── BADGE CARD ────────────────────────────────────────────
function BadgeCard({ badge, equipped, onToggle, index }: {
  badge: { id: string; name: string; icon: string; color: string; description: string };
  equipped: boolean; onToggle: () => void; index: number;
}) {
  const accent = badge.color || "#f97316";
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
        style={{
          background: equipped ? `linear-gradient(135deg, ${accent}18 0%, #141418 100%)` : hovered ? "#141418" : "#0f0f12",
          border: `1.5px solid ${equipped ? accent + "60" : hovered ? "#2a2a2f" : "#1a1a1f"}`,
          boxShadow: equipped ? `0 0 20px ${accent}15, inset 0 0 30px ${accent}06` : "none",
        }}
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {equipped && (
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent}70, transparent)` }} />
        )}
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
            style={{ background: equipped ? `${accent}20` : hovered ? `${accent}10` : "#0a0a0d", border: `1.5px solid ${equipped ? `${accent}40` : "#1a1a1f"}`, boxShadow: equipped ? `0 0 12px ${accent}25` : "none" }}>
            <BadgeIcon icon={badge.icon} size={22} color={accent} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-white truncate">{badge.name}</p>
            <p className="text-[10px] text-[#555] font-mono truncate mt-0.5">{badge.description || "Sem descrição"}</p>
          </div>
          <div className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200"
            style={{ background: equipped ? `${accent}20` : hovered ? "#1a1a1f" : "transparent", border: `1.5px solid ${equipped ? accent + "50" : "#222"}`, color: equipped ? accent : "#555" }}>
            {equipped ? "Remover" : "Equipar"}
          </div>
        </div>
        <div className="h-0.5 transition-all duration-300"
          style={{ background: equipped ? `linear-gradient(to right, transparent, ${accent}60, transparent)` : "transparent" }} />
      </div>
    </motion.div>
  );
}

// ─── BADGES TAB ───────────────────────────────────────────
function BadgesTab({ userBadges, equippedBadgeIds, toggleBadgeEquip }: {
  userBadges: any[]; equippedBadgeIds: Set<string>; toggleBadgeEquip: (id: string) => void;
}) {
  const equippedCount = equippedBadgeIds.size;
  const [filter, setFilter] = useState<"all" | "equipped" | "available">("all");

  const equipped = userBadges.filter((ub) => equippedBadgeIds.has(ub.badge_id));
  const available = userBadges.filter((ub) => !equippedBadgeIds.has(ub.badge_id));
  const filtered = filter === "equipped" ? equipped : filter === "available" ? available : userBadges;

  if (userBadges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[#1a1a1f] rounded-3xl gap-5">
        <div className="w-20 h-20 border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl flex items-center justify-center">
          <Award className="h-8 w-8 text-[#1a1a1f]" />
        </div>
        <div className="text-center">
          <p className="text-xs font-black text-[#2a2a2a] uppercase tracking-widest">Nenhuma badge</p>
          <p className="text-[10px] text-[#1a1a1f] font-mono mt-1">Você ainda não possui badges na sua conta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">Suas Badges</p>
          <p className="text-[10px] text-[#444] font-mono mt-0.5">{userBadges.length} badge{userBadges.length !== 1 ? "s" : ""} disponível{userBadges.length !== 1 ? "is" : ""}</p>
        </div>
        <div className="flex items-center gap-2 border border-[#1a1a1f] bg-[#0a0a0d] rounded-2xl px-4 py-2.5">
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: MAX_EQUIPPED }).map((_, i) => (
              <div key={i} className="rounded-sm transition-all duration-300" style={{
                width: i < equippedCount ? 10 : 8, height: i < equippedCount ? 10 : 8,
                border: `1.5px solid ${i < equippedCount ? "#f97316" : "#222"}`,
                background: i < equippedCount ? "#f97316" : "transparent",
                boxShadow: i < equippedCount ? "0 0 6px #f9731660" : "none",
              }} />
            ))}
          </div>
          <span className="text-[11px] font-black tabular-nums" style={{ color: equippedCount > 0 ? "#f97316" : "#333" }}>
            {equippedCount}/{MAX_EQUIPPED}
          </span>
        </div>
      </div>

      <div className="flex border border-[#1a1a1f] rounded-2xl overflow-hidden bg-[#0a0a0d]">
        {[
          { key: "all", label: `Todas (${userBadges.length})` },
          { key: "equipped", label: `Equipadas (${equippedCount})` },
          { key: "available", label: `Disponíveis (${available.length})` },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key as any)}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab.key ? "bg-[#f97316] text-black" : "text-[#444] hover:text-[#888]"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((ub, i) => (
          <BadgeCard key={ub.id} index={i}
            badge={{ id: ub.badges.id, name: ub.badges.name, icon: ub.badges.icon, color: ub.badges.color, description: ub.badges.description }}
            equipped={equippedBadgeIds.has(ub.badge_id)}
            onToggle={() => {
              if (!equippedBadgeIds.has(ub.badge_id) && equippedBadgeIds.size >= MAX_EQUIPPED) {
                toast.error(`Máximo de ${MAX_EQUIPPED} badges equipadas ao mesmo tempo.`);
                return;
              }
              toggleBadgeEquip(ub.badge_id);
            }}
          />
        ))}
      </div>

      <div className="border border-[#f97316]/10 bg-[#f97316]/5 rounded-2xl px-4 py-3 flex items-start gap-3">
        <Award className="h-3.5 w-3.5 text-[#f97316]/40 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[10px] text-[#555] font-mono">Clique em uma badge para equipar ou remover. As equipadas aparecem no seu perfil público.</p>
          <p className="text-[9px] text-[#2a2a2a] font-mono">Máx. {MAX_EQUIPPED} equipadas por vez. Salve o perfil para aplicar as mudanças.</p>
        </div>
      </div>
    </div>
  );
}

// ─── MINI PROFILE CARD PREVIEW ────────────────────────────
function ProfileCard({ profile, discordUserId }: any) {
  const { data: lanyardData } = useLanyard(discordUserId || "");
  const cardOpacity = profile.cardOpacity ?? 1;
  const bgColor = profile.cardBgColor || "#111115";

  return (
    <div className="w-[340px] overflow-hidden" style={{
      background: `rgba(${hexToRgb(bgColor)}, ${cardOpacity})`,
      border: `2px solid ${profile.cardBorderColor}`,
      fontFamily: "'JetBrains Mono', monospace",
      boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.6), 0 0 40px ${profile.cardBorderColor}18`,
      borderRadius: "20px",
      backdropFilter: cardOpacity < 1 ? "blur(12px)" : undefined,
    }}>
      <div className="h-[1.5px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${profile.cardBorderColor}80, transparent)` }} />
      <div className="relative h-24 overflow-hidden" style={{ borderRadius: "18px 18px 0 0" }}>
        {profile.bannerUrl
          ? <img src={profile.bannerUrl} className="w-full h-full object-cover opacity-60" alt="banner" style={{ filter: profile.bannerBlur > 0 ? `blur(${profile.bannerBlur}px)` : undefined, transform: profile.bannerBlur > 0 ? "scale(1.08)" : undefined }} />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${profile.cardBorderColor}20 0%, transparent 60%)` }} />
        }
        <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: `linear-gradient(to top, ${bgColor}, transparent)` }} />
      </div>
      <div className="px-5 -mt-8 relative z-10 flex items-end justify-between">
        <div className="relative">
          <img src={lanyardData?.discord_user?.avatar ? discordAvatarUrl(lanyardData.discord_user.id, lanyardData.discord_user.avatar) : profile.avatarUrl}
            className="w-16 h-16 border-2 object-cover rounded-full" alt="avatar"
            style={{ borderColor: bgColor, outline: `2px solid ${profile.cardBorderColor}40`, boxShadow: lanyardData ? `0 0 0 3.5px ${STATUS_COLOR[lanyardData.discord_status] ?? "#80848e"}50` : undefined }} />
          {lanyardData && (
            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
              style={{ backgroundColor: STATUS_COLOR[lanyardData.discord_status] ?? "#80848e", borderColor: bgColor }} title={STATUS_LABEL[lanyardData.discord_status]} />
          )}
        </div>
        {profile.showViews && (
          <div className="flex items-center gap-1.5 mb-1 text-[#444]">
            <Eye className="h-3 w-3" /><span className="text-[10px] font-mono">{profile.views ?? 0}</span>
          </div>
        )}
      </div>
      <div className="px-5 pt-2 pb-5 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm">{lanyardData?.discord_user?.global_name || lanyardData?.discord_user?.username || profile.displayName || profile.username}</span>
            {profile.isVerified && <Shield className="h-3.5 w-3.5 text-blue-400" />}
          </div>
          <span className="text-[10px] text-[#444] font-mono">@{profile.username}</span>
        </div>
        {profile.bio && <p className="text-[11px] text-[#777] font-mono leading-relaxed">{profile.bio}</p>}
        {/* Location */}
        {profile.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-[#f97316]/60 flex-shrink-0" />
            <span className="text-[10px] text-[#555] font-mono">{profile.location}</span>
          </div>
        )}
        {profile.links?.length > 0 && (
          <div className="space-y-1.5">
            {profile.links.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 border border-[#1a1a1f] hover:border-[#f97316]/30 text-[#666] hover:text-white transition-colors group rounded-xl">
                <span className="text-sm">{LINK_ICONS[link.icon] || "🔗"}</span>
                <span className="text-[11px] font-mono flex-1">{link.label}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}
        {profile.showBadges && profile.badges?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.badges.map((b: any) => (
              <div key={b.id} className="flex items-center gap-1.5 px-2 py-1 border text-[9px] font-black font-mono uppercase tracking-widest rounded-xl"
                style={{ borderColor: `${b.color}40`, background: `${b.color}0d`, color: b.color }}>
                <BadgeIcon icon={b.icon} size={11} color={b.color} />
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        )}
        <AnimatePresence>
          {lanyardData && (
            <motion.div key="lanyard" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
              <div className="w-full h-px bg-white/[0.06] mb-3" />
              <LanyardSection lanyardData={lanyardData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Utility to convert hex to rgb
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "17, 17, 21";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// ─── ANALYTICS ────────────────────────────────────────────
function MiniBarChart({ data }: { data: { day: string; views: number }[] }) {
  const max = Math.max(...data.map((d) => d.views));
  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <motion.div className="w-full rounded-t-sm relative overflow-hidden"
            initial={{ height: 0 }} animate={{ height: `${(d.views / max) * 100}%` }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            style={{ background: `linear-gradient(to top, #f97316, #f9731660)`, minHeight: 4 }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#f97316" }} />
          </motion.div>
          <span className="text-[8px] text-[#333] font-mono">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function DeviceDonut({ data }: { data: typeof MOCK_DEVICES }) {
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
            <span style={{ color: d.color }}>{d.icon}</span>
            <span className="text-[10px] text-[#555] font-mono">{d.label}</span>
          </div>
          <div className="flex-1 h-1.5 bg-[#111] rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${d.value}%` }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: "easeOut" }}
              style={{ background: d.color }} />
          </div>
          <span className="text-[10px] font-black w-8 text-right" style={{ color: d.color }}>{d.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE COMPLETION ───────────────────────────────────
function ProfileCompletion({ profile, links, discordUserId }: any) {
  const steps = [
    { label: "Enviar um avatar", done: !!profile.avatarUrl },
    { label: "Adicionar uma descrição", done: !!profile.bio && profile.bio.length > 10 },
    { label: "Vincular conta do Discord", done: !!discordUserId },
    { label: "Adicionar redes sociais", done: links.length > 0 },
    { label: "Definir cor do perfil", done: !!profile.cardBorderColor && profile.cardBorderColor !== "#f97316" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-white">Conclusão do perfil</p>
          <p className="text-[10px] text-[#444] font-mono mt-0.5">{pct < 100 ? "Perfil incompleto" : "Perfil completo! 🎉"}</p>
        </div>
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1a1f" strokeWidth="3" />
            <motion.circle cx="18" cy="18" r="15" fill="none" stroke="#f97316" strokeWidth="3"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 15}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - pct / 100) }}
              transition={{ duration: 1, ease: "easeOut" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-[#f97316]">{pct}%</span>
          </div>
        </div>
      </div>
      <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(to right, #f97316, #facc15)" }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
      </div>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${s.done ? "bg-[#f97316]/5 border border-[#f97316]/15" : "bg-[#0d0d10] border border-[#111]"}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? "bg-[#f97316]" : "border border-[#222]"}`}>
              {s.done ? <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-[#333] block" />}
            </div>
            <span className="text-[10px] font-mono" style={{ color: s.done ? "#f97316" : "#444", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSection({ views }: { views: number }) {
  const totalWeek = MOCK_VIEWS_7D.reduce((a, b) => a + b.views, 0);
  return (
    <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-white">Estatísticas do perfil</p>
          <p className="text-[10px] text-[#444] font-mono mt-0.5">Últimos 7 dias</p>
        </div>
        <button className="text-[10px] text-[#f97316] hover:underline font-mono flex items-center gap-1">
          Ver mais <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Views totais", value: views.toString(), icon: <Eye className="w-3.5 h-3.5 text-blue-400" /> },
          { label: "Esta semana", value: totalWeek.toString(), icon: <TrendingUp className="w-3.5 h-3.5 text-[#f97316]" /> },
          { label: "Hoje", value: MOCK_VIEWS_7D[6].views.toString(), icon: <Zap className="w-3.5 h-3.5 text-[#facc15]" /> },
        ].map((s, i) => (
          <div key={i} className="bg-[#080809] border border-[#111] rounded-2xl p-3 text-center">
            <div className="flex justify-center mb-1.5">{s.icon}</div>
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-[9px] text-[#333] font-mono mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[10px] text-[#444] font-mono mb-3">Visualizações — últimos 7 dias</p>
        <MiniBarChart data={MOCK_VIEWS_7D} />
      </div>
      <div>
        <p className="text-[10px] text-[#444] font-mono mb-3">Dispositivos dos visitantes</p>
        <DeviceDonut data={MOCK_DEVICES} />
      </div>
    </div>
  );
}

// ─── APPEARANCE SETTINGS ──────────────────────────────────
function AppearanceSettings({ profile, setProfile, discordUserId }: any) {
  const [settings, setSettings] = useState({
    monoIcons: false, animatedTitle: false, invertBoxColors: false,
    volumeControl: true, useDiscordAvatar: !!discordUserId, discordAvatarDecoration: false,
  });
  const toggle = (key: string) => setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));

  const ToggleRow = ({ label, k, icon }: { label: string; k: string; icon: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#111] last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="text-[#555]">{icon}</span>
        <span className="text-[11px] font-mono text-[#777]">{label}</span>
      </div>
      <button onClick={() => toggle(k)} className={`w-10 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 ${(settings as any)[k] ? "bg-[#f97316]" : "bg-[#1a1a1f]"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${(settings as any)[k] ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Transparency */}
      <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Transparência do Card</p>
        <div className="flex items-end gap-3 mb-2">
          <span className="text-3xl font-black text-white tabular-nums">{Math.round((profile.cardOpacity ?? 1) * 100)}</span>
          <span className="text-xs text-[#444] mb-1">%</span>
        </div>
        <input type="range" min={10} max={100} step={5} value={Math.round((profile.cardOpacity ?? 1) * 100)}
          onChange={(e) => setProfile({ ...profile, cardOpacity: Number(e.target.value) / 100 })}
          className="w-full h-1.5 appearance-none outline-none cursor-pointer rounded-full"
          style={{ background: `linear-gradient(to right, #f97316 0%, #f97316 ${Math.round((profile.cardOpacity ?? 1) * 100)}%, #1a1a1f ${Math.round((profile.cardOpacity ?? 1) * 100)}%, #1a1a1f 100%)` }} />
        <p className="text-[9px] text-[#333] font-mono">Valores baixos tornam o card semi-transparente (requer fundo configurado)</p>
      </div>

      {/* Cores */}
      <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Cores do Card</p>
        {[
          { label: "Cor de destaque / borda", value: profile.cardBorderColor || "#f97316", onChange: (v: string) => setProfile({ ...profile, cardBorderColor: v }) },
          { label: "Cor de fundo do card", value: profile.cardBgColor || "#111115", onChange: (v: string) => setProfile({ ...profile, cardBgColor: v }) },
        ].map((c) => (
          <div key={c.label} className="flex items-center justify-between">
            <span className="text-[11px] text-[#666] font-mono">{c.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#333]">{c.value.toUpperCase()}</span>
              <label className="relative cursor-pointer">
                <div className="w-8 h-8 rounded-xl border border-[#222] overflow-hidden" style={{ backgroundColor: c.value }} />
                <input type="color" value={c.value} onChange={(e) => c.onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              </label>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#111]">
          {PRESET_COLORS.map((c) => (
            <button key={c} onClick={() => setProfile({ ...profile, cardBorderColor: c })}
              className={`w-7 h-7 rounded-xl border-2 transition-all ${profile.cardBorderColor === c ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Shimmer */}
      <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black mb-4">Configurações de brilho</p>
        <div className="grid grid-cols-2 gap-3">
          {["Nome de usuário", "Redes", "Badges", "Título animado"].map((label) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer group">
              <div className="w-4 h-4 border border-[#222] bg-[#0d0d10] rounded flex items-center justify-center group-hover:border-[#f97316]/40 transition-colors">
                <div className="w-2 h-2 bg-[#f97316] rounded-sm" />
              </div>
              <span className="text-[10px] text-[#555] font-mono group-hover:text-[#888] transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5">
        <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black mb-1">Personalizações</p>
        <p className="text-[10px] text-[#333] font-mono mb-4">Ajuste o visual do seu perfil público</p>
        <ToggleRow label="Ícones monocromáticos" k="monoIcons" icon={<Circle className="w-3.5 h-3.5" />} />
        <ToggleRow label="Título animado" k="animatedTitle" icon={<Sparkles className="w-3.5 h-3.5" />} />
        <ToggleRow label="Inverter cores das caixas" k="invertBoxColors" icon={<RefreshCw className="w-3.5 h-3.5" />} />
        <ToggleRow label="Controle de volume" k="volumeControl" icon={<Volume2 className="w-3.5 h-3.5" />} />
        <ToggleRow label="Usar avatar do Discord" k="useDiscordAvatar" icon={<span className="text-xs">💬</span>} />
        <ToggleRow label="Decoração de avatar Discord" k="discordAvatarDecoration" icon={<Sparkles className="w-3.5 h-3.5" />} />
      </div>
    </div>
  );
}

// ─── CUSTOM DOMAIN ────────────────────────────────────────
function CustomDomainSection({ profile, setProfile, userId }: any) {
  const [domain, setDomain] = useState(profile.customDomain || "");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [saving, setSaving] = useState(false);

  const expectedCname = `cname.safirahost.xyz`;

  const checkVerification = async () => {
    if (!domain.trim()) return;
    setVerifyStatus("checking");
    // Simulate DNS check (in production, call a backend/edge function)
    setTimeout(() => {
      // For demo: always return "failed" unless domain contains "verified" (dev testing)
      setVerifyStatus(domain.includes("verified") ? "verified" : "failed");
    }, 2000);
  };

  const saveDomain = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ custom_domain: domain.trim() || null } as any).eq("user_id", userId);
    if (error) { toast.error("Erro ao salvar domínio"); }
    else { setProfile({ ...profile, customDomain: domain.trim() }); toast.success("Domínio salvo!"); }
    setSaving(false);
  };

  const removeDomain = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ custom_domain: null } as any).eq("user_id", userId);
    setDomain(""); setProfile({ ...profile, customDomain: "" }); setVerifyStatus("idle");
    toast.success("Domínio removido.");
  };

  return (
    <div className="space-y-5">
      {/* How it works */}
      <div className="border border-[#f97316]/15 bg-[#f97316]/5 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#f97316]" />
          <p className="text-[11px] font-black text-[#f97316] uppercase tracking-widest">Como funciona</p>
        </div>
        <ol className="space-y-2">
          {[
            "Compre um domínio em qualquer registrador (ex: GoDaddy, Namecheap, Cloudflare)",
            `Crie um registro CNAME apontando para: ${expectedCname}`,
            "Cole o domínio abaixo e clique em Verificar",
            "Após verificado, seu perfil ficará acessível pelo domínio",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#f97316]/20 border border-[#f97316]/30 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-[#f97316]">{i + 1}</span>
              <span className="text-[10px] text-[#666] font-mono leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* CNAME record box */}
      <div className="border border-[#1a1a1f] bg-[#080809] rounded-3xl p-5 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-[#444] font-black">Registro CNAME necessário</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#0a0a0d] border border-[#1a1a1f] rounded-2xl">
            <p className="text-[9px] text-[#333] font-mono mb-1">TIPO</p>
            <p className="text-[11px] font-black text-white font-mono">CNAME</p>
          </div>
          <div className="p-3 bg-[#0a0a0d] border border-[#1a1a1f] rounded-2xl">
            <p className="text-[9px] text-[#333] font-mono mb-1">HOST</p>
            <p className="text-[11px] font-black text-white font-mono">@</p>
          </div>
          <div className="col-span-2 p-3 bg-[#0a0a0d] border border-[#1a1a1f] rounded-2xl">
            <p className="text-[9px] text-[#333] font-mono mb-1">VALOR / DESTINO</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black text-[#f97316] font-mono">{expectedCname}</p>
              <button onClick={() => { navigator.clipboard.writeText(expectedCname); toast.success("Copiado!"); }}
                className="p-1.5 border border-[#1a1a1f] rounded-lg hover:border-[#f97316]/30 transition-colors">
                <Copy className="h-3 w-3 text-[#444]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Domain input */}
      <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-[#444] font-black">Seu domínio personalizado</p>
        <div className="flex border border-[#1a1a1f] rounded-2xl focus-within:border-[#f97316]/40 transition-colors overflow-hidden">
          <span className="inline-flex items-center px-3 py-3 bg-[#080809] text-[#333] text-[10px] border-r border-[#1a1a1f] font-mono select-none">https://</span>
          <input value={domain} onChange={(e) => { setDomain(e.target.value.toLowerCase().replace(/\s/g, "")); setVerifyStatus("idle"); }}
            placeholder="meudominio.com"
            className="flex-1 px-4 py-3 bg-[#0d0d10] text-white text-sm placeholder-[#333] outline-none font-mono" />
        </div>

        {/* Status */}
        {verifyStatus !== "idle" && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${verifyStatus === "verified" ? "bg-green-500/5 border-green-500/20" : verifyStatus === "failed" ? "bg-red-500/5 border-red-500/20" : "bg-[#f97316]/5 border-[#f97316]/20"}`}>
            {verifyStatus === "checking" && <motion.div className="w-3.5 h-3.5 border border-[#f97316]/30 border-t-[#f97316] rounded-full flex-shrink-0" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />}
            {verifyStatus === "verified" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />}
            {verifyStatus === "failed" && <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
            <span className="text-[10px] font-mono" style={{ color: verifyStatus === "verified" ? "#4ade80" : verifyStatus === "failed" ? "#f87171" : "#f97316" }}>
              {verifyStatus === "checking" && "Verificando DNS... aguarde"}
              {verifyStatus === "verified" && "DNS verificado! Domínio ativo."}
              {verifyStatus === "failed" && "CNAME não encontrado. Aguarde propagação (até 48h) e tente novamente."}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={checkVerification} disabled={!domain.trim() || verifyStatus === "checking"}
            className="flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#1a1a1f] text-[#555] hover:border-[#f97316]/40 hover:text-[#f97316] transition-all disabled:opacity-30">
            {verifyStatus === "checking" ? "Verificando..." : "Verificar DNS"}
          </button>
          <button onClick={saveDomain} disabled={saving || !domain.trim()}
            className="flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#f97316] text-black hover:bg-[#e06210] transition-all disabled:opacity-30">
            {saving ? "Salvando..." : "Salvar domínio"}
          </button>
        </div>

        {profile.customDomain && (
          <div className="flex items-center justify-between pt-2 border-t border-[#111]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[11px] font-mono text-white">{profile.customDomain}</span>
            </div>
            <button onClick={removeDomain} className="text-[10px] text-red-500/60 hover:text-red-500 transition-colors font-mono flex items-center gap-1">
              <Trash className="h-3 w-3" /> Remover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function SafiraDashboard() {
  const { user, profile: authProfile, signOut, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // activePage: "home" | "analytics" | "preview" | "settings" | "editor:profile" | "editor:links" etc
  const [activePage, setActivePage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);
  const [profile, setProfile] = useState({
    username: "", displayName: "", bio: "", discordTag: "",
    avatarUrl: "", bannerUrl: "", cardTemplate: "classic",
    profileEffect: "none", cardBorderColor: "#f97316", cardBgColor: "#111115",
    showDiscord: true, showBadges: true, showViews: true,
    backgroundUrl: "", backgroundVideoUrl: "", songUrl: "",
    bannerBlur: 0, cursorUrl: "", views: 0, isVerified: false,
    location: "", cardOpacity: 1, customDomain: "",
    links: [] as { id?: string; label: string; url: string; icon: string }[],
    badges: [] as any[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [links, setLinks] = useState([] as { id?: string; label: string; url: string; icon: string }[]);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState(0);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [equippedBadgeIds, setEquippedBadgeIds] = useState<Set<string>>(new Set());
  const [discordUserId, setDiscordUserId] = useState("");
  const [cursorUploading, setCursorUploading] = useState(false);
  const [cursorPreview, setCursorPreview] = useState("");

  const { data: lanyardPreview, status: lanyardStatus } = useLanyard(discordUserId);

  // Determine if we're in editor mode and which section
  const isEditor = activePage.startsWith("editor:");
  const editorSection = isEditor ? activePage.replace("editor:", "") : "";

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authProfile) {
      const ap = authProfile as any;
      setProfile({
        username: ap.username || "",
        displayName: ap.display_name || "",
        bio: ap.bio || "",
        discordTag: ap.discord_tag || "",
        avatarUrl: ap.avatar_url || "",
        bannerUrl: ap.banner_url || "",
        cardTemplate: ap.card_template || "classic",
        profileEffect: ap.profile_effect || "none",
        cardBorderColor: ap.card_border_color || "#f97316",
        cardBgColor: ap.card_bg_color || "#111115",
        showDiscord: ap.show_discord ?? true,
        showBadges: ap.show_badges ?? true,
        showViews: ap.show_views ?? true,
        backgroundUrl: ap.background_url || "",
        backgroundVideoUrl: ap.background_video_url || "",
        songUrl: ap.song_url || "",
        bannerBlur: ap.banner_blur ?? 0,
        cursorUrl: ap.cursor_url || "",
        views: ap.views || 0,
        isVerified: ap.is_verified || false,
        location: ap.location || "",
        cardOpacity: ap.card_opacity ?? 1,
        customDomain: ap.custom_domain || "",
        links: [], badges: [],
      });
      setCursorPreview(ap.cursor_url || "");
      setDiscordUserId(ap.discord_user_id || "");
    }
  }, [authProfile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("social_links").select("*").eq("user_id", user.id).order("sort_order").then(({ data }) => {
      if (data) setLinks(data.map((l) => ({ id: l.id, label: l.label, url: l.url, icon: l.icon || "website" })));
    });
    supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        setUserBadges(data);
        setEquippedBadgeIds(new Set(data.filter((ub: any) => ub.equipped).map((ub: any) => ub.badge_id)));
      }
    });
  }, [user]);

  const uploadFile = async (file: File, bucket: string) => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { toast.error("Falha no upload"); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadFile(file, "avatars");
    if (url) setProfile({ ...profile, avatarUrl: url });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadFile(file, "banners");
    if (url) setProfile({ ...profile, bannerUrl: url });
  };

  const handleCursorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const allowedTypes = ["image/png","image/gif","image/webp","image/svg+xml","image/x-win-bitmap","image/vnd.microsoft.icon"];
    const isAllowed = allowedTypes.some(t => file.type === t) || file.name.endsWith(".cur") || file.name.endsWith(".ani");
    if (!isAllowed) { toast.error("Formato inválido."); return; }
    if (file.size > 500 * 1024) { toast.error("Arquivo muito grande. Máx: 500KB."); return; }
    setCursorUploading(true);
    const url = await uploadFile(file, "cursors");
    if (url) { setProfile({ ...profile, cursorUrl: url }); setCursorPreview(url); toast.success("Cursor enviado!"); }
    setCursorUploading(false);
  };

  const removeCursor = () => { setProfile({ ...profile, cursorUrl: "" }); setCursorPreview(""); };
  const toggleBadgeEquip = (badgeId: string) => {
    setEquippedBadgeIds((prev) => { const next = new Set(prev); if (next.has(badgeId)) next.delete(badgeId); else next.add(badgeId); return next; });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.displayName, username: profile.username, bio: profile.bio,
      discord_tag: profile.discordTag, avatar_url: profile.avatarUrl, banner_url: profile.bannerUrl,
      card_template: profile.cardTemplate, profile_effect: profile.profileEffect,
      card_border_color: profile.cardBorderColor, card_bg_color: profile.cardBgColor,
      show_discord: profile.showDiscord, show_badges: profile.showBadges, show_views: profile.showViews,
      background_url: profile.backgroundUrl, background_video_url: profile.backgroundVideoUrl,
      song_url: profile.songUrl, banner_blur: profile.bannerBlur,
      cursor_url: profile.cursorUrl || null, discord_user_id: discordUserId.trim() || null,
      location: profile.location || null, card_opacity: profile.cardOpacity,
    } as any).eq("user_id", user.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    await supabase.from("social_links").delete().eq("user_id", user.id);
    if (links.length > 0) {
      await supabase.from("social_links").insert(links.map((l, i) => ({ user_id: user.id, label: l.label, url: l.url, icon: l.icon, sort_order: i })));
    }
    for (const ub of userBadges) {
      const shouldEquip = equippedBadgeIds.has(ub.badge_id);
      if (ub.equipped !== shouldEquip) await supabase.from("user_badges").update({ equipped: shouldEquip }).eq("id", ub.id);
    }
    await refreshProfile();
    toast.success("Perfil salvo!");
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const copyLink = () => { navigator.clipboard?.writeText(`safirahost.xyz/${profile.username}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const addLink = () => setLinks([...links, { label: "Novo Link", url: "https://", icon: "website" }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: string, value: string) => setLinks(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

  const equippedBadges = userBadges
    .filter((ub: any) => equippedBadgeIds.has(ub.badge_id))
    .map((ub: any) => ({ id: ub.badges.id, name: ub.badges.name, icon: ub.badges.icon, color: ub.badges.color }));

  const lanyardStatusConfig = {
    idle:       { color: "#555",    icon: <WifiOff className="w-3 h-3" />, label: "Digite seu Discord ID" },
    connecting: { color: "#f0b232", icon: <Wifi className="w-3 h-3" />,    label: "Conectando ao Lanyard..." },
    connected:  { color: "#23a559", icon: <Wifi className="w-3 h-3" />,    label: "Conectado · dados ao vivo" },
    error:      { color: "#f23f43", icon: <WifiOff className="w-3 h-3" />, label: "ID inválido ou não monitorado" },
  }[lanyardStatus];

  const nav = (page: string) => setActivePage(page);

  // ─── Sidebar items config ─────────────────────────────
  const sidebarPanelItems = [
    { id: "home", icon: <Home className="h-4 w-4" />, label: "Início" },
    { id: "analytics", icon: <BarChart2 className="h-4 w-4" />, label: "Analytics" },
  ];
  const sidebarEditorItems = [
    { id: "editor:profile", icon: <User className="h-4 w-4" />, label: "Perfil" },
    { id: "editor:links", icon: <Link2 className="h-4 w-4" />, label: "Links" },
    { id: "editor:badges", icon: <Award className="h-4 w-4" />, label: "Badges", count: equippedBadgeIds.size },
    { id: "editor:style", icon: <Palette className="h-4 w-4" />, label: "Estilo" },
    { id: "editor:advanced", icon: <Sliders className="h-4 w-4" />, label: "Avançado" },
    { id: "editor:integrations", icon: <Zap className="h-4 w-4" />, label: "Integrações" },
  ];
  const sidebarAccountItems = [
    { id: "settings", icon: <Settings className="h-4 w-4" />, label: "Configurações" },
    { id: "history", icon: <Hash className="h-4 w-4" />, label: "Histórico" },
  ];

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}
      className="min-h-screen bg-[#080809] text-white flex overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 bg-[#060608] border-r border-[#111] flex flex-col transition-all duration-300 h-screen sticky top-0 z-40`}>
        <div className="h-14 border-b border-[#111] flex items-center px-4 gap-3">
          <Gem className="h-5 w-5 text-[#f97316] flex-shrink-0" />
          {sidebarOpen && <span className="font-black text-base tracking-widest text-[#f97316] uppercase">Safira</span>}
        </div>
        <nav className="flex-1 p-2.5 space-y-1 overflow-auto">
          {/* Panel */}
          {sidebarOpen && <p className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-black text-[#222]">Painel</p>}
          {sidebarPanelItems.map((item) => (
            <SidebarItem key={item.id} icon={item.icon} label={item.label} active={activePage === item.id} onClick={() => nav(item.id)} open={sidebarOpen} />
          ))}

          {/* Editor */}
          <div className="pt-2">
            {sidebarOpen && <p className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-black text-[#222]">Editor</p>}
            {sidebarEditorItems.map((item) => (
              <SidebarItem key={item.id} icon={item.icon} label={item.label} active={activePage === item.id} onClick={() => nav(item.id)} open={sidebarOpen} badge={item.count && item.count > 0 ? item.count.toString() : undefined} />
            ))}
          </div>

          {/* Account */}
          <div className="pt-2">
            <button onClick={() => setAccountOpen(!accountOpen)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[#333] hover:text-[#666] transition-colors rounded-xl">
              {sidebarOpen && <span className="text-[9px] uppercase tracking-widest font-black flex-1 text-left text-[#222]">Conta</span>}
              <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${accountOpen ? "" : "-rotate-90"}`} />
            </button>
            {accountOpen && sidebarAccountItems.map((item) => (
              <SidebarItem key={item.id} icon={item.icon} label={item.label} active={activePage === item.id} onClick={() => nav(item.id)} open={sidebarOpen} />
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-[#111] p-3">
          <div className="flex items-center gap-2">
            <img src={profile.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`} className="h-8 w-8 rounded-full border border-[#111] flex-shrink-0 object-cover" alt="avatar" />
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">@{profile.username}</p>
                  <p className="text-[9px] text-[#333] truncate">safirahost.xyz/{profile.username}</p>
                </div>
                <button onClick={() => signOut()} className="p-1 hover:text-[#f97316] text-[#333] transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-14 border-b border-[#111] bg-[#060608] sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-[#0f0f12] rounded-xl text-[#333] hover:text-[#666] transition-colors">
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: "#f97316" }} />
              <h1 className="text-sm font-black uppercase tracking-widest text-white">
                {activePage === "home" && "Dashboard"}
                {isEditor && EDITOR_SECTIONS[editorSection]}
                {activePage === "preview" && "Preview"}
                {activePage === "settings" && "Configurações"}
                {activePage === "analytics" && "Analytics"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => nav("preview")}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-[#1a1a1f] text-[#555] hover:border-[#333] hover:text-[#999] text-[10px] uppercase tracking-widest transition-all">
              <Eye className="h-3.5 w-3.5" /> Ver Perfil
            </button>
            {isEditor && (
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${saved ? "bg-green-500/20 border border-green-500/40 text-green-400" : "bg-[#f97316] text-black hover:bg-[#e06210]"} disabled:opacity-40`}>
                {saved ? <><Check className="h-3.5 w-3.5" />Salvo!</> : saving ? "Salvando..." : <><Save className="h-3.5 w-3.5" />Salvar</>}
              </button>
            )}
            <button className="relative p-2 hover:bg-[#0f0f12] rounded-xl text-[#333] hover:text-[#666] transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#f97316] rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">

          {/* ══ HOME ══════════════════════════════════════════ */}
          {activePage === "home" && (
            <div className="p-6 max-w-6xl mx-auto space-y-5">
              <div className="relative overflow-hidden border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-6">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #f97316, transparent)", transform: "translate(30%, -30%)" }} />
                <div className="relative">
                  <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black mb-1">Bem-vindo de volta</p>
                  <h2 className="text-xl font-black text-white mb-1">@{profile.username || "usuário"}</h2>
                  <p className="text-[11px] text-[#444] font-mono">Gerencie seu perfil, analise visitas e configure integrações.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Eye className="h-5 w-5 text-blue-400" />} label="Visualizações" value={profile.views.toString()} color="blue" />
                <StatCard icon={<Gem className="h-5 w-5 text-[#f97316]" />} label="Coins" value="0" color="orange" />
                <StatCard icon={<Award className="h-5 w-5 text-purple-400" />} label="Badges" value={userBadges.length.toString()} color="purple" />
                <StatCard icon={<Star className="h-5 w-5 text-[#f97316]" />} label="Conta" value="Grátis" color="orange" />
              </div>

              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={profile.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`} className="h-16 w-16 object-cover border-2 border-[#f97316]/30 rounded-2xl" alt="avatar" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0a0a0d] rounded-full" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-white">@{profile.username}</p>
                        <p className="text-[11px] text-[#444] font-mono">{profile.displayName}</p>
                        {profile.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-[#f97316]/50" />
                            <span className="text-[10px] text-[#444] font-mono">{profile.location}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <ActionBtn icon={<Eye className="h-3 w-3" />} label="Ver Perfil" primary onClick={() => nav("preview")} />
                          <ActionBtn icon={<Camera className="h-3 w-3" />} label="Editar" onClick={() => nav("editor:profile")} />
                          <ActionBtn icon={<Link2 className="h-3 w-3" />} label="Links" onClick={() => nav("editor:links")} />
                          <ActionBtn icon={<Copy className="h-3 w-3" />} label={copied ? "Copiado!" : "Copiar"} onClick={copyLink} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <AnalyticsSection views={profile.views} />
                </div>
                <div className="space-y-5">
                  <ProfileCompletion profile={profile} links={links} discordUserId={discordUserId} />
                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-4">
                    <div className="flex items-center gap-2 mb-4 border-b border-[#0f0f12] pb-3">
                      <Bell className="h-4 w-4 text-blue-400" />
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Atualizações</p>
                    </div>
                    <div className="space-y-2.5">
                      {ANNOUNCEMENTS.map((a, i) => (
                        <div key={i}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${announcement === i ? "border-blue-500/30 bg-blue-500/5" : "border-[#111] hover:border-[#1a1a1f]"}`}
                          onClick={() => setAnnouncement(i)}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-[11px] font-black text-white leading-tight">{a.title}</p>
                            <span className="text-[9px] text-[#333] font-mono flex-shrink-0">{a.date}</span>
                          </div>
                          {announcement === i && <p className="text-[10px] text-[#555] font-mono mt-2 leading-relaxed">{a.body}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ═════════════════════════════════════ */}
          {activePage === "analytics" && (
            <div className="p-6 max-w-5xl mx-auto space-y-5">
              <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-6">
                <h2 className="text-lg font-black text-white mb-1">Analytics</h2>
                <p className="text-[11px] text-[#444] font-mono">Estatísticas detalhadas do seu perfil</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Views totais", value: profile.views.toString(), icon: <Eye className="h-5 w-5 text-blue-400" />, color: "#3b82f6" },
                  { label: "Esta semana", value: MOCK_VIEWS_7D.reduce((a,b) => a+b.views, 0).toString(), icon: <TrendingUp className="h-5 w-5 text-[#f97316]" />, color: "#f97316" },
                  { label: "Hoje", value: MOCK_VIEWS_7D[6].views.toString(), icon: <Zap className="h-5 w-5 text-[#facc15]" />, color: "#facc15" },
                  { label: "Visitantes únicos", value: "—", icon: <Users className="h-5 w-5 text-purple-400" />, color: "#8b5cf6" },
                ].map((s, i) => (
                  <div key={i} className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-4">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1.5px solid ${s.color}30` }}>{s.icon}</div>
                    <p className="text-[10px] text-[#444] font-mono mb-1">{s.label}</p>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5">
                  <p className="text-xs font-black text-white mb-1">Visualizações do perfil</p>
                  <p className="text-[10px] text-[#444] font-mono mb-5">Últimos 7 dias</p>
                  <MiniBarChart data={MOCK_VIEWS_7D} />
                </div>
                <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5">
                  <p className="text-xs font-black text-white mb-1">Dispositivos dos visitantes</p>
                  <p className="text-[10px] text-[#444] font-mono mb-5">Últimos 7 dias</p>
                  <DeviceDonut data={MOCK_DEVICES} />
                  <div className="mt-5 pt-4 border-t border-[#111] grid grid-cols-3 gap-2">
                    {MOCK_DEVICES.map((d, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-black" style={{ color: d.color }}>{d.value}%</div>
                        <div className="text-[9px] text-[#333] font-mono">{d.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border border-dashed border-[#1a1a1f] rounded-3xl p-6 text-center">
                <BarChart2 className="h-8 w-8 text-[#222] mx-auto mb-3" />
                <p className="text-[11px] text-[#333] font-mono">Mais métricas chegando em breve: países, referências, horários de pico...</p>
              </div>
            </div>
          )}

          {/* ══ PREVIEW ═══════════════════════════════════════ */}
          {activePage === "preview" && (
            <div className="min-h-full bg-[#050507] flex items-center justify-center p-8">
              <div className="text-center mb-8 absolute top-20 left-1/2 -translate-x-1/2">
                <p className="text-[10px] uppercase tracking-widest text-[#333] font-mono">safirahost.xyz/{profile.username}</p>
              </div>
              <ProfileCard profile={{ ...profile, links, badges: equippedBadges }} discordUserId={discordUserId} />
            </div>
          )}

          {/* ══ EDITOR ════════════════════════════════════════ */}
          {isEditor && (
            <div className="p-6 max-w-3xl mx-auto space-y-6">

              {/* ─ PERFIL ─ */}
              {editorSection === "profile" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5">
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Avatar</label>
                      <div className="flex items-center gap-4">
                        <img src={profile.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`} className="h-20 w-20 object-cover border border-[#1a1a1f] rounded-2xl" alt="avatar" />
                        <label className="flex items-center gap-2 px-4 py-2.5 border border-[#1a1a1f] rounded-2xl text-[#555] hover:border-[#f97316]/40 hover:text-[#f97316] transition-all cursor-pointer text-[10px] uppercase tracking-widest">
                          <Camera className="h-3.5 w-3.5" /> Alterar
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                    </div>
                    <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5">
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Banner</label>
                      <div className="relative h-24 border border-[#1a1a1f] rounded-2xl group overflow-hidden bg-[#0d0d10] flex items-center justify-center">
                        {profile.bannerUrl ? <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="banner" /> : <span className="text-[#2a2a2a] text-[10px] uppercase tracking-widest">Sem banner</span>}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                          <Upload className="h-5 w-5 text-[#666]" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Informações pessoais</p>
                    <Field label="Nome de exibição" value={profile.displayName} onChange={(v: string) => setProfile({ ...profile, displayName: v })} />
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Username</label>
                      <div className="flex border border-[#1a1a1f] rounded-2xl focus-within:border-[#f97316]/40 transition-colors overflow-hidden">
                        <span className="inline-flex items-center px-4 py-3 bg-[#080809] text-[#333] text-[10px] border-r border-[#1a1a1f] font-mono">safirahost.xyz/</span>
                        <input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} className="flex-1 px-4 py-3 bg-[#0d0d10] text-white text-sm placeholder-[#333] outline-none font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Bio</label>
                      <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={200} rows={3} className="w-full px-4 py-3 bg-[#0d0d10] border border-[#1a1a1f] rounded-2xl text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none resize-none font-mono transition-colors" />
                      <p className="text-[10px] text-[#333] mt-1 text-right">{profile.bio.length}/200</p>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-[#f97316]/60" /> Localização
                      </label>
                      <div className="flex border border-[#1a1a1f] rounded-2xl focus-within:border-[#f97316]/40 transition-colors overflow-hidden">
                        <span className="inline-flex items-center px-3 py-3 bg-[#080809] border-r border-[#1a1a1f]">
                          <MapPin className="h-3.5 w-3.5 text-[#f97316]/40" />
                        </span>
                        <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          placeholder="Ex: São Paulo, Brasil" maxLength={60}
                          className="flex-1 px-4 py-3 bg-[#0d0d10] text-white text-sm placeholder-[#333] outline-none font-mono" />
                      </div>
                      <p className="text-[9px] text-[#333] font-mono mt-1">Aparece abaixo da bio no seu perfil público</p>
                    </div>

                    <Field label="Discord Tag" value={profile.discordTag} onChange={(v: string) => setProfile({ ...profile, discordTag: v })} placeholder="usuario#1234" />
                  </div>
                </div>
              )}

              {/* ─ LINKS ─ */}
              {editorSection === "links" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-[#444]">Seus Links ({links.length})</p>
                    <button onClick={addLink} className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#1a1a1f] text-[#555] hover:border-[#f97316]/40 hover:text-[#f97316] text-[10px] uppercase tracking-widest transition-all">
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </button>
                  </div>
                  {links.length === 0 ? (
                    <div className="text-center py-14 border border-dashed border-[#1a1a1f] rounded-3xl">
                      <p className="text-[#333] text-[10px] uppercase tracking-widest">Nenhum link adicionado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.map((link, i) => (
                        <div key={i} className="p-4 bg-[#0a0a0d] border border-[#1a1a1f] rounded-3xl hover:border-[#222] transition-colors">
                          <div className="flex gap-3 mb-3">
                            <select value={link.icon} onChange={(e) => updateLink(i, "icon", e.target.value)} className="px-3 py-2.5 bg-[#111] border border-[#1a1a1f] rounded-2xl text-[#666] text-[10px] font-mono min-w-[120px] outline-none focus:border-[#f97316]/40 transition-colors">
                              <option value="website">🌐 Website</option>
                              <option value="github">🐙 GitHub</option>
                              <option value="twitter">✖️ Twitter</option>
                              <option value="instagram">📷 Instagram</option>
                              <option value="discord">💬 Discord</option>
                            </select>
                            <input value={link.label} onChange={(e) => updateLink(i, "label", e.target.value)} className="flex-1 px-4 py-2.5 bg-[#111] border border-[#1a1a1f] rounded-2xl text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
                            <button onClick={() => removeLink(i)} className="p-2.5 border border-[#1a1a1f] rounded-2xl hover:border-red-900/40 text-[#444] hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <input value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} className="w-full px-4 py-2.5 bg-[#111] border border-[#1a1a1f] rounded-2xl text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─ BADGES ─ */}
              {editorSection === "badges" && (
                <BadgesTab userBadges={userBadges} equippedBadgeIds={equippedBadgeIds} toggleBadgeEquip={toggleBadgeEquip} />
              )}

              {/* ─ STYLE ─ */}
              {editorSection === "style" && (
                <AppearanceSettings profile={profile} setProfile={setProfile} discordUserId={discordUserId} />
              )}

              {/* ─ ADVANCED ─ */}
              {editorSection === "advanced" && (
                <div className="space-y-5">
                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Mídia de Fundo</p>
                    <Field label="🎵 Música de fundo" value={profile.songUrl} onChange={(v: string) => setProfile({ ...profile, songUrl: v })} placeholder="Link direto .mp3 / .ogg" />
                    <Field label="🖼️ Imagem de fundo" value={profile.backgroundUrl} onChange={(v: string) => setProfile({ ...profile, backgroundUrl: v })} placeholder="URL da imagem" />
                    <Field label="🎬 Vídeo de fundo" value={profile.backgroundVideoUrl} onChange={(v: string) => setProfile({ ...profile, backgroundVideoUrl: v })} placeholder="URL do vídeo" />
                  </div>

                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="h-3.5 w-3.5 text-[#f97316]" />
                      <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Cursor Personalizado</p>
                    </div>
                    <p className="text-[10px] text-[#333] font-mono">PNG, GIF, WebP, SVG, CUR, ANI. Máx: 500KB.</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Enviar imagem</label>
                        <label className={`flex flex-col items-center justify-center gap-3 h-32 border-2 border-dashed rounded-2xl transition-colors cursor-pointer group ${cursorUploading ? "border-[#f97316]/40 bg-[#f97316]/5" : "border-[#1a1a1f] hover:border-[#f97316]/40 hover:bg-[#f97316]/5"}`}>
                          {cursorUploading
                            ? <><div className="h-5 w-5 border border-[#f97316] border-t-transparent rounded-full animate-spin" /><span className="text-[10px] text-[#f97316] uppercase tracking-widest">Enviando...</span></>
                            : <><MousePointer2 className="h-6 w-6 text-[#333] group-hover:text-[#f97316] transition-colors" /><span className="text-[10px] text-[#444] uppercase tracking-widest group-hover:text-[#f97316] transition-colors">Clique para enviar</span></>
                          }
                          <input type="file" accept="image/png,image/gif,image/webp,image/svg+xml,.cur,.ani" className="hidden" onChange={handleCursorUpload} disabled={cursorUploading} />
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Preview</label>
                        <div className="h-32 border border-[#1a1a1f] rounded-2xl bg-[#0a0a0d] flex flex-col items-center justify-center gap-2" style={cursorPreview ? { cursor: `url(${cursorPreview}), auto` } : {}}>
                          {cursorPreview
                            ? <><img src={cursorPreview} className="h-10 w-10 object-contain" alt="cursor preview" /><span className="text-[9px] text-[#555] font-mono uppercase tracking-widest">Passe o mouse aqui</span></>
                            : <span className="text-[10px] text-[#222] uppercase tracking-widest">Nenhum cursor</span>
                          }
                        </div>
                        <div className="mt-3">
                          <label className="text-[10px] uppercase tracking-widest text-[#333] mb-1.5 block">Ou cole uma URL</label>
                          <input value={profile.cursorUrl} onChange={(e) => { setProfile({ ...profile, cursorUrl: e.target.value }); setCursorPreview(e.target.value); }}
                            placeholder="https://...cursor.png" className="w-full px-3 py-2 bg-[#0d0d10] border border-[#1a1a1f] rounded-xl text-white text-xs placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
                        </div>
                        {profile.cursorUrl && (
                          <button onClick={removeCursor} className="mt-2 flex items-center gap-1.5 text-[10px] text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-widest">
                            <Trash className="h-3 w-3" /> Remover cursor
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Visibilidade</p>
                    {[
                      { label: "Mostrar Discord Tag", key: "showDiscord" },
                      { label: "Mostrar Badges", key: "showBadges" },
                      { label: "Mostrar Contador de Views", key: "showViews" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between cursor-pointer group p-3 rounded-2xl border border-[#111] hover:border-[#1a1a1f] transition-colors">
                        <span className="text-xs text-[#555] group-hover:text-[#888] transition-colors font-mono">{item.label}</span>
                        <div onClick={() => setProfile({ ...profile, [item.key]: !(profile as any)[item.key] })}
                          className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${(profile as any)[item.key] ? "bg-[#f97316]" : "bg-[#1a1a1f]"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${(profile as any)[item.key] ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Desfoque do Banner</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-white tabular-nums">{profile.bannerBlur}</span>
                      <span className="text-xs text-[#444] mb-1">px</span>
                    </div>
                    <input type="range" min={0} max={20} step={1} value={profile.bannerBlur}
                      onChange={(e) => setProfile({ ...profile, bannerBlur: Number(e.target.value) })}
                      className="w-full h-1.5 appearance-none outline-none cursor-pointer rounded-full"
                      style={{ background: `linear-gradient(to right, #f97316 0%, #f97316 ${(profile.bannerBlur/20)*100}%, #1a1a1f ${(profile.bannerBlur/20)*100}%, #1a1a1f 100%)` }} />
                  </div>
                </div>
              )}

              {/* ─ INTEGRATIONS ─ */}
              {editorSection === "integrations" && (
                <div className="space-y-5">
                  {/* Discord / Lanyard */}
                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#5865f2]/20 border border-[#5865f2]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">💬</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white">Discord · Lanyard</p>
                        <p className="text-[9px] text-[#444] font-mono">Status em tempo real no perfil</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Discord User ID</label>
                      <div className="flex border border-[#1a1a1f] rounded-2xl focus-within:border-[#5865f2]/40 transition-colors overflow-hidden">
                        <span className="inline-flex items-center px-3 py-2.5 bg-[#080809] text-[#333] text-[10px] border-r border-[#1a1a1f] font-mono select-none">ID</span>
                        <input value={discordUserId} onChange={(e) => setDiscordUserId(e.target.value.replace(/\D/g, ""))}
                          placeholder="Ex: 200207310625177602" maxLength={20}
                          className="flex-1 px-4 py-2.5 bg-[#0d0d10] text-white text-sm placeholder-[#333] outline-none font-mono" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2" style={{ color: lanyardStatusConfig.color }}>
                        {lanyardStatusConfig.icon}
                        <span className="text-[10px] font-mono">{lanyardStatusConfig.label}</span>
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      {lanyardStatus === "idle" && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center py-10 border border-dashed border-[#1a1a1f] rounded-2xl gap-3">
                          <Users className="w-6 h-6 text-[#222]" />
                          <p className="text-[10px] text-[#222] uppercase tracking-widest">Digite o Discord ID para ver o preview</p>
                        </motion.div>
                      )}
                      {lanyardStatus === "connecting" && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2 py-8 border border-[#1a1a1f] rounded-2xl">
                          <motion.div className="w-4 h-4 rounded-full border border-[#5865f2]/30 border-t-[#5865f2]" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                          <span className="text-[11px] text-[#333] font-mono">Conectando ao Lanyard...</span>
                        </motion.div>
                      )}
                      {lanyardStatus === "error" && (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-2 py-8 border border-red-900/20 bg-red-900/5 rounded-2xl">
                          <WifiOff className="w-5 h-5 text-red-500/40" />
                          <p className="text-[11px] text-red-500/60 font-mono text-center px-4">ID inválido ou não monitorado pelo Lanyard.</p>
                          <a href="https://discord.gg/lanyard" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-[#5865f2]/60 hover:text-[#5865f2] transition-colors">
                            <ExternalLink className="w-3 h-3" /> discord.gg/lanyard
                          </a>
                        </motion.div>
                      )}
                      {lanyardStatus === "connected" && lanyardPreview && (
                        <motion.div key="preview" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <LanyardSection lanyardData={lanyardPreview} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Custom Domain — FUNCTIONAL */}
                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-7 h-7 rounded-xl bg-[#f97316]/20 border border-[#f97316]/30 flex items-center justify-center flex-shrink-0">
                        <Globe className="h-3.5 w-3.5 text-[#f97316]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white">Domínio Personalizado</p>
                        <p className="text-[9px] text-[#444] font-mono">Aponte seu domínio para o seu perfil Safira</p>
                      </div>
                    </div>
                    <CustomDomainSection profile={profile} setProfile={setProfile} userId={user?.id} />
                  </div>

                  {/* CSS Custom — locked */}
                  <div className="relative border border-[#1a1a1f] bg-[#080809] rounded-3xl p-5 overflow-hidden">
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl" style={{ backdropFilter: "blur(4px)", background: "rgba(5,5,7,0.75)" }}>
                      <div className="text-center">
                        <div className="flex items-center gap-2 px-3 py-1.5 border rounded-xl mx-auto w-fit mb-2" style={{ borderColor: "#8b5cf640", background: "#8b5cf610" }}>
                          <Lock className="h-3 w-3 text-purple-400" />
                          <span className="text-[10px] uppercase tracking-widest font-black text-purple-400">Em Breve</span>
                        </div>
                        <p className="text-xs text-[#555] font-mono">CSS Personalizado disponível em breve.</p>
                      </div>
                    </div>
                    <div className="opacity-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Code2 className="h-4 w-4 text-[#333]" />
                        <p className="text-[10px] uppercase tracking-widest text-[#333] font-black">CSS Personalizado</p>
                      </div>
                      <div className="h-12 bg-[#0d0d10] border border-[#111] rounded-2xl" />
                    </div>
                  </div>

                  <p className="text-[10px] text-[#222] font-mono uppercase tracking-widest pt-2 border-t border-[#0f0f0f]">Em breve: Spotify, GitHub, Steam...</p>
                </div>
              )}
            </div>
          )}

          {/* ══ SETTINGS ══════════════════════════════════════ */}
          {activePage === "settings" && (
            <div className="p-6 max-w-2xl mx-auto">
              <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-6">
                <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-4 font-black">Configurações da Conta</p>
                <div className="space-y-4">
                  <Field label="E-mail" value={user?.email || ""} onChange={() => {}} />
                  <Field label="Senha atual" value="" onChange={() => {}} type="password" placeholder="••••••••" />
                  <Field label="Nova senha" value="" onChange={() => {}} type="password" placeholder="••••••••" />
                  <button className="px-6 py-2.5 bg-[#f97316] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#e06210] rounded-2xl transition-colors">Salvar Alterações</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #f97316; cursor: pointer; border: 2px solid #080809; border-radius: 50%; }
        input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; background: #f97316; cursor: pointer; border: 2px solid #080809; border-radius: 50%; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #060608; }
        ::-webkit-scrollbar-thumb { background: #111; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #1a1a1f; }
      `}</style>
    </div>
  );
}

/* ─── SUB-COMPONENTS ───────────────────────────────────────── */

function SidebarItem({ icon, label, active, onClick, open, badge }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 transition-all text-left group rounded-xl ${active ? "bg-[#f97316]/10 text-[#f97316]" : "text-[#444] hover:text-[#777] hover:bg-[#0d0d10]"}`}>
      <span className="flex-shrink-0">{icon}</span>
      {open && <span className="flex-1 text-[10px] font-black uppercase tracking-widest truncate">{label}</span>}
      {open && badge && <span className="text-[8px] border border-[#f97316]/30 text-[#f97316] px-1.5 py-0.5 font-black uppercase tracking-widest rounded-lg">{badge}</span>}
    </button>
  );
}

function StatCard({ icon, label, value, color, badge }: any) {
  const borderColors: any = { orange: "#f97316", blue: "#3b82f6", gray: "#333", purple: "#8b5cf6" };
  return (
    <div className="border border-[#1a1a1f] bg-[#0a0a0d] rounded-3xl p-4 relative overflow-hidden">
      {badge && <div className="absolute top-2 right-2"><span className="text-[8px] uppercase tracking-widest border border-[#f97316]/30 text-[#f97316] px-1.5 py-0.5 font-black rounded-lg">{badge}</span></div>}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-2xl border flex items-center justify-center" style={{ borderColor: `${borderColors[color]}30`, background: `${borderColors[color]}10` }}>{icon}</div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[#444] mb-1">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, primary }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${primary ? "bg-blue-600 hover:bg-blue-500 text-white" : "border border-[#1a1a1f] text-[#555] hover:border-[#f97316]/40 hover:text-[#f97316]"}`}>
      {icon}{label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#0d0d10] border border-[#1a1a1f] rounded-2xl text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
    </div>
  );
}
