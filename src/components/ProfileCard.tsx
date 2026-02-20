import { motion, AnimatePresence } from "framer-motion";
import { StatusIndicator, VerifiedBadge } from "./StatusIndicator";
import { SocialLink } from "./SocialLink";
import { BadgeIcon } from "./BadgeIcon";
import { ProfileEffect } from "./ProfileEffects";
import {
  Copy, Music, Github, Twitter, Instagram, Globe,
  MessageCircle, Volume2, VolumeX, Users, MapPin,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface ProfileLink {
  label: string;
  url: string;
  icon?: string;
}

interface BadgeData {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner?: string;
  discordTag: string;
  status: "online" | "idle" | "dnd" | "offline";
  isVerified: boolean;
  themeColor?: string;
  views: number;
  links: ProfileLink[];
  badges?: BadgeData[];
  cardTemplate?: string;
  profileEffect?: string;
  showDiscord?: boolean;
  showBadges?: boolean;
  showViews?: boolean;
  backgroundUrl?: string;
  backgroundVideoUrl?: string;
  songUrl?: string;
  bannerBlur?: number;
  discordUserId?: string;
  discord_user_id?: string;
  // New fields
  location?: string;
  cardOpacity?: number;
  cardBgColor?: string;
  cardBorderColor?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  github:    <Github className="h-4 w-4" />,
  twitter:   <Twitter className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  website:   <Globe className="h-4 w-4" />,
  discord:   <MessageCircle className="h-4 w-4" />,
};

interface ProfileCardProps {
  profile: ProfileData;
  isFullPage?: boolean;
  cardBackgroundColor?: string;
}

// ─── STATUS helpers ───────────────────────────────────────
const LANYARD_STATUS_COLOR: Record<string, string> = {
  online:  "#23a559",
  idle:    "#f0b232",
  dnd:     "#f23f43",
  offline: "#80848e",
};
const LANYARD_STATUS_LABEL: Record<string, string> = {
  online:  "Online",
  idle:    "Ausente",
  dnd:     "Não Perturbe",
  offline: "Offline",
};

function discordAvatarUrl(userId: string, hash: string | null, size = 128) {
  if (!hash)
    return `https://cdn.discordapp.com/embed/avatars/${Number(userId) % 5}.png`;
  const ext = hash.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/avatars/${userId}/${hash}.${ext}?size=${size}`;
}

function guildIconUrl(guildId: string, hash: string | null) {
  if (!hash) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${hash}.webp?size=64`;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "17, 17, 21";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// ─── LANYARD WebSocket hook ───────────────────────────────
function useLanyard(rawId: string | undefined | null) {
  const [data, setData] = useState<any>(null);
  const wsRef           = useRef<WebSocket | null>(null);
  const hbRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef      = useRef(true);
  const reconnectRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = rawId ? String(rawId).replace(/\D/g, "").trim() : "";

  const cleanup = () => {
    if (hbRef.current)       { clearInterval(hbRef.current);   hbRef.current = null; }
    if (reconnectRef.current){ clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    if (wsRef.current) {
      wsRef.current.onopen    = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror   = null;
      wsRef.current.onclose   = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const connect = useCallback(() => {
    cleanup();
    if (!userId || userId.length < 10) {
      if (mountedRef.current) setData(null);
      return;
    }
    const ws = new WebSocket("wss://api.lanyard.rest/socket");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
    };
    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.op === 1) {
          hbRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN)
              ws.send(JSON.stringify({ op: 3 }));
          }, msg.d.heartbeat_interval);
        }
        if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
          setData(msg.d);
        }
      } catch (_) {}
    };
    ws.onerror = () => {
      if (!mountedRef.current) return;
      reconnectRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, 5000);
    };
    ws.onclose = () => {
      if (hbRef.current) { clearInterval(hbRef.current); hbRef.current = null; }
      if (!mountedRef.current) return;
      reconnectRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, 3000);
    };
  }, [userId]); // eslint-disable-line

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => { mountedRef.current = false; cleanup(); };
  }, [connect]);

  return data;
}

// ─── LANYARD SECTION ──────────────────────────────────────
const LanyardSection = ({ lanyardData }: { lanyardData: any }) => {
  const du    = lanyardData.discord_user;
  const st    = lanyardData.discord_status ?? "offline";
  const sp    = lanyardData.spotify;
  const guild = lanyardData.guild_member_data?.guild;

  return (
    <div className="space-y-2 mt-3">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-200"
      >
        <div className="relative flex-shrink-0">
          <img
            src={discordAvatarUrl(du.id, du.avatar)}
            alt={du.username}
            className="w-10 h-10 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2.5px rgba(0,0,0,0.4), 0 0 0 4px ${LANYARD_STATUS_COLOR[st]}60` }}
          />
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card"
            style={{ backgroundColor: LANYARD_STATUS_COLOR[st] }}
            title={LANYARD_STATUS_LABEL[st]}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate leading-tight">
            {du.global_name || du.display_name || du.username}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">Discord Member</p>
        </div>
        <motion.a
          href={`https://discord.com/users/${du.id}`}
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-foreground border border-border hover:bg-surface transition-all"
        >
          Profile
        </motion.a>
      </motion.div>

      {sp && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-[#1db954]/20 bg-[#1db954]/[0.05] hover:bg-[#1db954]/[0.08] transition-all duration-200"
        >
          <img src={sp.album_art_url} alt={sp.song} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-foreground truncate">{sp.song}</p>
            <p className="text-[10px] text-muted-foreground truncate">{sp.artist}</p>
          </div>
          <div className="flex items-end gap-[2px] h-3 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-[2px] rounded-full bg-[#1db954]"
                animate={{ height: ["3px", "10px", "3px"] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {guild && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-200"
        >
          {guildIconUrl(guild.id, guild.icon) ? (
            <img src={guildIconUrl(guild.id, guild.icon)!} alt={guild.name} className="w-10 h-10 rounded-[30%] object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-[30%] bg-surface border border-border/50 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate leading-tight">{guild.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              <span className="text-[#23a559]">●</span>{" "}
              {guild.approximate_presence_count >= 1000
                ? `${(guild.approximate_presence_count / 1000).toFixed(1)}k`
                : guild.approximate_presence_count?.toLocaleString() ?? "?"}{" "}
              Online <span className="opacity-30">·</span>{" "}
              {guild.approximate_member_count >= 1000
                ? `${(guild.approximate_member_count / 1000).toFixed(1)}k`
                : guild.approximate_member_count?.toLocaleString() ?? "?"}{" "}
              Membros
            </p>
          </div>
          <motion.span
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#5865f2] hover:bg-[#4752c4] transition-all cursor-default"
          >
            Join
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};

// ─── Tilt hook ────────────────────────────────────────────
const useTilt = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    setStyle({ transform: `perspective(800px) rotateY(${x*12}deg) rotateX(${-y*12}deg) scale3d(1.02,1.02,1.02)`, transition: "transform 0.1s ease-out" });
  };
  const handleMouseLeave = () =>
    setStyle({ transform: "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)", transition: "transform 0.4s ease-out" });
  return { ref, style, handleMouseMove, handleMouseLeave };
};

// ─── Music Player ─────────────────────────────────────────
const MusicPlayer = ({ songUrl }: { songUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);
  const toggle = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play().catch(() => {});
    setPlaying(!playing);
  };
  useEffect(() => { audioRef.current?.play().catch(() => {}); }, []);
  return (
    <div className="flex items-center gap-2 mb-4">
      <audio ref={audioRef} src={songUrl} loop autoPlay />
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium w-full transition-colors"
        style={playing ? { background: "rgba(249,115,22,0.10)", borderColor: "rgba(249,115,22,0.30)" } : undefined}>
        {playing
          ? <Volume2 className="h-3.5 w-3.5" style={{ color: "rgb(249,115,22)" }} />
          : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
        <Music className="h-3 w-3" style={playing ? { color: "rgb(249,115,22)" } : undefined} />
        <span className="truncate flex-1 text-left" style={playing ? { color: "rgb(249,115,22)" } : { color: "var(--muted-foreground)" }}>
          {playing ? "Tocando..." : "Tocar música"}
        </span>
        {playing && (
          <div className="flex items-end gap-[2px] h-3">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-[2px] rounded-full" style={{ backgroundColor: "rgb(249,115,22)" }}
                animate={{ height: ["4px","12px","4px"] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }} />
            ))}
          </div>
        )}
      </motion.button>
    </div>
  );
};

// ─── Shared small components ──────────────────────────────
const DiscordButton = ({ discordTag, copied, copyDiscord }: { discordTag: string; copied: boolean; copyDiscord: () => void }) => (
  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={copyDiscord}
    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[hsl(235,86%,65%)]/10 border border-[hsl(235,86%,65%)]/20 text-sm font-medium mb-4 transition-all hover:bg-[hsl(235,86%,65%)]/20">
    <MessageCircle className="h-4 w-4 text-[hsl(235,86%,65%)]" />
    <span className="flex-1 text-left">{copied ? "Copiado!" : discordTag}</span>
    <Copy className="h-3 w-3 text-muted-foreground" />
  </motion.button>
);

const BadgesRow = ({ badges }: { badges: BadgeData[] }) => (
  <div className="flex flex-wrap gap-1.5 mb-4">
    {badges.map(badge => (
      <motion.div key={badge.id} whileHover={{ scale: 1.15, y: -2 }} title={badge.name}
        className="p-1.5 rounded-lg bg-surface border border-border/50 cursor-default">
        <BadgeIcon icon={badge.icon} color={badge.color} size={16} />
      </motion.div>
    ))}
  </div>
);

const LinksSection = ({ links }: { links: ProfileLink[] }) => (
  <div className="space-y-2">
    {links.map((link, i) => (
      <motion.div key={link.url + i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
        <SocialLink label={link.label} url={link.url} icon={iconMap[link.icon || ""] || <Globe className="h-4 w-4" />} />
      </motion.div>
    ))}
  </div>
);

// Location row component
const LocationRow = ({ location, accentColor }: { location: string; accentColor?: string }) => (
  <div className="flex items-center gap-1.5 mb-3">
    <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: `${accentColor || "#f97316"}80` }} />
    <span className="text-[11px] text-muted-foreground font-mono">{location}</span>
  </div>
);

const LanyardBlock = ({ lanyardData, templateKey }: { lanyardData: any; templateKey: string }) => (
  <AnimatePresence>
    {lanyardData && (
      <motion.div key={`lanyard-${templateKey}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}>
        <div className="w-full h-px bg-border/30 mt-4 mb-1" />
        <LanyardSection lanyardData={lanyardData} />
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── CLASSIC ──────────────────────────────────────────────
const CardContent = ({
  profile,
  copied,
  copyDiscord,
  lanyardData,
}: {
  profile: ProfileData;
  copied: boolean;
  copyDiscord: () => void;
  lanyardData: any;
}) => {
  const blur = profile.bannerBlur ?? 0;
  const liveStatus = lanyardData?.discord_status ?? profile.status;
  const cardOpacity = profile.cardOpacity ?? 1;
  const bgColor = profile.cardBgColor || "#1a1a1f";
  const accentColor = profile.cardBorderColor || "#f97316";

  return (
    <div
      className="relative rounded-2xl overflow-hidden w-full max-w-2xl mx-auto"
      style={{
        backdropFilter: cardOpacity < 1 ? "blur(20px)" : undefined,
        background: `rgba(${hexToRgb(bgColor)}, ${cardOpacity})`,
        border: `1px solid rgba(${hexToRgb(bgColor === "#1a1a1f" ? "#333333" : bgColor)}, ${Math.min(cardOpacity + 0.2, 1)})`,
      }}
    >
      <ProfileEffect effect={profile.profileEffect || "none"} />

      {/* ── BANNER ── */}
      <div className="relative w-full h-44 overflow-hidden">
        {profile.banner ? (
          <img
            src={profile.banner}
            alt="Banner"
            className="w-full h-full object-cover"
            style={{
              filter: blur > 0 ? `blur(${blur}px)` : "none",
              transform: blur > 0 ? "scale(1.08)" : "scale(1)",
              transition: "filter 0.3s, transform 0.3s",
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 60%)`,
              filter: blur > 0 ? `blur(${blur}px)` : "none"
            }}
          />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, rgba(${hexToRgb(bgColor)}, 0.6))` }} />
      </div>

      {/* ── AVATAR ── */}
      <div className="relative flex justify-center" style={{ marginTop: "-48px", zIndex: 10 }}>
        <div className="relative">
          <img
            src={profile.avatar}
            alt={profile.displayName}
            className="h-24 w-24 rounded-full object-cover shadow-xl"
            style={{
              border: `4px solid rgba(${hexToRgb(bgColor)}, ${Math.max(cardOpacity, 0.7)})`,
              boxShadow: lanyardData
                ? `0 0 0 3px ${LANYARD_STATUS_COLOR[liveStatus]}60`
                : undefined
            }}
          />
          <div className="absolute -bottom-1 -right-1">
            <StatusIndicator status={liveStatus} size="lg" />
          </div>
        </div>
      </div>

      {/* ── NOME + BIO centralizados ── */}
      <div className="flex flex-col items-center text-center px-6 pt-3 pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground leading-tight">
            {profile.displayName}
          </h2>
          {profile.isVerified && <VerifiedBadge />}
        </div>
        {profile.bio && (
          <p className="text-sm text-secondary-foreground/80 leading-relaxed max-w-sm">
            {profile.bio}
          </p>
        )}
        {/* LOCATION */}
        {profile.location && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: `${accentColor}80` }} />
            <span className="text-[12px] text-muted-foreground/70 font-mono">{profile.location}</span>
          </div>
        )}
      </div>

      {/* ── RESTANTE DO CONTEÚDO ── */}
      <div className="px-6 pb-6">
        {profile.songUrl && <MusicPlayer songUrl={profile.songUrl} />}
        {profile.showBadges !== false && profile.badges && profile.badges.length > 0 && (
          <BadgesRow badges={profile.badges} />
        )}
        {profile.showDiscord !== false && profile.discordTag && (
          <DiscordButton discordTag={profile.discordTag} copied={copied} copyDiscord={copyDiscord} />
        )}
        <LinksSection links={profile.links} />
        <LanyardBlock lanyardData={lanyardData} templateKey="classic" />
        {profile.showViews !== false && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {profile.views.toLocaleString()} views
          </p>
        )}
      </div>
    </div>
  );
};

// ─── CYBERPUNK ────────────────────────────────────────────
const CyberpunkContent = ({
  profile,
  copied,
  copyDiscord,
  lanyardData,
}: {
  profile: ProfileData;
  copied: boolean;
  copyDiscord: () => void;
  lanyardData: any;
}) => {
  const blur = profile.bannerBlur ?? 0;
  const cardOpacity = profile.cardOpacity ?? 1;
  const bgColor = profile.cardBgColor || "#0d0d12";
  const accentColor = profile.cardBorderColor || "#f97316";

  return (
    <div
      className="relative rounded-2xl overflow-hidden w-full max-w-2xl mx-auto"
      style={{
        boxShadow: `0 0 30px ${accentColor}50, inset 0 0 30px ${accentColor}08`,
        backdropFilter: cardOpacity < 1 ? "blur(16px)" : undefined,
      }}
    >
      <ProfileEffect effect={profile.profileEffect || "none"} />
      <div className="h-48 relative overflow-hidden">
        {profile.banner ? (
          <img
            src={profile.banner}
            alt="Banner"
            className="w-full h-full object-cover"
            style={{
              filter: `hue-rotate(20deg) saturate(1.5)${blur > 0 ? ` blur(${blur}px)` : ""}`,
              transform: blur > 0 ? "scale(1.08)" : "scale(1)",
              transition: "filter 0.3s, transform 0.3s",
            }}
          />
        ) : (
          <div
            className="w-full h-full animate-gradient-shift"
            style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10, ${accentColor}30)`, backgroundSize: "200% 200%", filter: blur > 0 ? `blur(${blur}px)` : "none" }}
          />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, rgba(${hexToRgb(bgColor)}, 0.25))` }} />
        <div className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-mono rounded" style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}>
          safirahost.xyz
        </div>
      </div>
      <div className="backdrop-blur-xl border-t px-6 pb-6" style={{ background: `rgba(${hexToRgb(bgColor)}, ${cardOpacity})`, borderColor: `${accentColor}30` }}>
        <div className="flex items-end gap-4 -mt-16 mb-4">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className="h-20 w-20 rounded-lg object-cover"
              style={{
                border: `2px solid ${accentColor}50`,
                boxShadow: lanyardData
                  ? `0 0 15px ${LANYARD_STATUS_COLOR[lanyardData.discord_status ?? "offline"]}60`
                  : `0 0 15px ${accentColor}30`,
              }}
            />
            <div className="absolute -bottom-1 -right-1">
              <StatusIndicator status={lanyardData?.discord_status ?? profile.status} size="lg" />
            </div>
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{profile.displayName}</h2>
              {profile.isVerified && <VerifiedBadge />}
            </div>
            {/* LOCATION */}
            {profile.location && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: `${accentColor}70` }} />
                <span className="text-[11px] text-muted-foreground font-mono">{profile.location}</span>
              </div>
            )}
          </div>
        </div>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-4 border-l-2 pl-3" style={{ borderColor: `${accentColor}40` }}>{profile.bio}</p>
        )}
        {profile.songUrl && <MusicPlayer songUrl={profile.songUrl} />}
        {profile.showBadges !== false && profile.badges && profile.badges.length > 0 && (
          <BadgesRow badges={profile.badges} />
        )}
        {profile.showDiscord !== false && profile.discordTag && (
          <DiscordButton discordTag={profile.discordTag} copied={copied} copyDiscord={copyDiscord} />
        )}
        <LinksSection links={profile.links} />
        <LanyardBlock lanyardData={lanyardData} templateKey="cyberpunk" />
        {profile.showViews !== false && (
          <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
            {profile.views.toLocaleString()} views
          </p>
        )}
      </div>
    </div>
  );
};

// ─── MINIMAL ──────────────────────────────────────────────
const MinimalContent = ({
  profile,
  copied,
  copyDiscord,
  lanyardData,
}: {
  profile: ProfileData;
  copied: boolean;
  copyDiscord: () => void;
  lanyardData: any;
}) => {
  const cardOpacity = profile.cardOpacity ?? 1;
  const bgColor = profile.cardBgColor || "#1a1a1f";
  const accentColor = profile.cardBorderColor || "#f97316";

  return (
    <div className="relative rounded-2xl overflow-hidden w-full max-w-lg mx-auto p-8 text-center"
      style={{
        background: `rgba(${hexToRgb(bgColor)}, ${cardOpacity})`,
        backdropFilter: cardOpacity < 1 ? "blur(20px)" : undefined,
        border: `1px solid rgba(255,255,255,0.06)`,
      }}>
      <ProfileEffect effect={profile.profileEffect || "none"} />
      <div className="relative inline-block mb-4">
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="h-20 w-20 rounded-full border-2 border-border object-cover"
          style={
            lanyardData
              ? { boxShadow: `0 0 0 3px ${LANYARD_STATUS_COLOR[lanyardData.discord_status ?? "offline"]}50` }
              : undefined
          }
        />
        {lanyardData && (
          <div
            className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-card"
            style={{ backgroundColor: LANYARD_STATUS_COLOR[lanyardData.discord_status ?? "offline"] }}
            title={LANYARD_STATUS_LABEL[lanyardData.discord_status ?? "offline"]}
          />
        )}
      </div>
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-bold text-foreground">{profile.displayName}</h2>
          {profile.isVerified && <VerifiedBadge />}
        </div>
        {profile.bio && (
          <p className="text-sm text-secondary-foreground/80 leading-relaxed pt-1">{profile.bio}</p>
        )}
        {/* LOCATION */}
        {profile.location && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: `${accentColor}80` }} />
            <span className="text-[12px] text-muted-foreground/70 font-mono">{profile.location}</span>
          </div>
        )}
      </div>
      {profile.songUrl && <MusicPlayer songUrl={profile.songUrl} />}
      {profile.showBadges !== false && profile.badges && profile.badges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {profile.badges.map(b => (
            <motion.div key={b.id} whileHover={{ scale: 1.15 }} title={b.name} className="p-1.5 rounded-lg bg-surface border border-border/50">
              <BadgeIcon icon={b.icon} color={b.color} size={16} />
            </motion.div>
          ))}
        </div>
      )}
      {profile.showDiscord !== false && profile.discordTag && (
        <DiscordButton discordTag={profile.discordTag} copied={copied} copyDiscord={copyDiscord} />
      )}
      <LinksSection links={profile.links} />
      <div className="text-left">
        <LanyardBlock lanyardData={lanyardData} templateKey="minimal" />
      </div>
      {profile.showViews !== false && (
        <p className="text-xs text-muted-foreground mt-4">{profile.views.toLocaleString()} views</p>
      )}
    </div>
  );
};

// ─── Template map ─────────────────────────────────────────
const templateMap: Record<
  string,
  React.FC<{ profile: ProfileData; copied: boolean; copyDiscord: () => void; lanyardData: any }>
> = {
  classic:   CardContent,
  minimal:   MinimalContent,
  cyberpunk: CyberpunkContent,
};

export const CARD_TEMPLATES = [
  { id: "classic",   label: "Clássico",    desc: "Banner + avatar centralizado" },
  { id: "minimal",   label: "Minimalista", desc: "Limpo e centralizado"         },
  { id: "cyberpunk", label: "Cyberpunk",   desc: "Estilo futurista com neon"    },
];

// ─── PROFILECARD — componente principal ───────────────────
export const ProfileCard = ({ profile, isFullPage, cardBackgroundColor }: ProfileCardProps) => {
  const [copied, setCopied] = useState(false);
  const tilt = useTilt();

  const discordUserId =
    (profile.discordUserId   || "").toString().replace(/\D/g,"").trim() ||
    (profile.discord_user_id || "").toString().replace(/\D/g,"").trim() ||
    "";

  const lanyardData = useLanyard(discordUserId || null);

  const copyDiscord = () => {
    navigator.clipboard.writeText(profile.discordTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Template = templateMap[profile.cardTemplate || "classic"] || CardContent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      ref={tilt.ref}
      style={isFullPage ? tilt.style : undefined}
      onMouseMove={isFullPage ? tilt.handleMouseMove : undefined}
      onMouseLeave={isFullPage ? tilt.handleMouseLeave : undefined}
      className="w-full"
    >
      <Template
        profile={profile}
        copied={copied}
        copyDiscord={copyDiscord}
        lanyardData={lanyardData}
      />
    </motion.div>
  );
};
