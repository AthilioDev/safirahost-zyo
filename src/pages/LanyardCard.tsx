// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LanyardCard.tsx
// Drop-in replacement card that fetches real Discord data via
// the Lanyard API (https://api.lanyard.rest/v1/users/:id)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useEffect, useState } from "react";
import { Eye, MapPin, ExternalLink, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null;
    display_name?: string;
  };
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: LanyardActivity[];
  listening_to_spotify?: boolean;
  spotify?: {
    song: string;
    artist: string;
    album_art_url: string;
    track_id: string;
  } | null;
  guild_member_data?: {
    guild: {
      id: string;
      name: string;
      icon: string | null;
      approximate_member_count: number;
      approximate_presence_count: number;
    };
  };
}

interface LanyardActivity {
  id: string;
  name: string;
  type: number;
  details?: string;
  state?: string;
  assets?: {
    large_image?: string;
    large_text?: string;
  };
  application_id?: string;
}

interface SafiraProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl?: string;
  cardBorderColor: string;
  showViews: boolean;
  showDiscord: boolean;
  showBadges: boolean;
  views: number;
  links: { label: string; url: string; icon: string }[];
  badges: { id: string; name: string; icon: string; color: string }[];
  discordUserId?: string;
  discordTag?: string;
  isVerified?: boolean;
  location?: string;
}

// ─────────────────────────────────────────────
// Status dot colors
// ─────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  online: "#23a559",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  idle: "Ausente",
  dnd: "Não Perturbe",
  offline: "Offline",
};

// ─────────────────────────────────────────────
// Lanyard hook
// ─────────────────────────────────────────────
function useLanyard(userId: string | undefined) {
  const [data, setData] = useState<LanyardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || userId.trim() === "") return;

    setLoading(true);
    setError(null);

    const ws = new WebSocket("wss://api.lanyard.rest/socket");
    let heartbeatInterval: ReturnType<typeof setInterval>;

    ws.onopen = () => {
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.op === 1) {
        // Hello — start heartbeat
        heartbeatInterval = setInterval(() => {
          ws.send(JSON.stringify({ op: 3 }));
        }, msg.d.heartbeat_interval);
      }

      if (msg.op === 0) {
        if (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE") {
          setData(msg.d);
          setLoading(false);
        }
      }
    };

    ws.onerror = () => {
      setError("Erro ao conectar ao Lanyard");
      setLoading(false);
    };

    ws.onclose = () => {
      clearInterval(heartbeatInterval);
    };

    return () => {
      clearInterval(heartbeatInterval);
      ws.close();
    };
  }, [userId]);

  return { data, loading, error };
}

// ─────────────────────────────────────────────
// Avatar URL helper
// ─────────────────────────────────────────────
function discordAvatarUrl(userId: string, hash: string | null, size = 128) {
  if (!hash) return `https://cdn.discordapp.com/embed/avatars/${Number(userId) % 5}.png`;
  const prefix = hash.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/avatars/${userId}/${hash}.${prefix}?size=${size}`;
}

function guildIconUrl(guildId: string, hash: string | null) {
  if (!hash) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${hash}.webp?size=64`;
}

// ─────────────────────────────────────────────
// Social icon map (simple emoji fallback)
// ─────────────────────────────────────────────
const LINK_ICONS: Record<string, string> = {
  website: "🌐",
  github: "🐙",
  twitter: "✖️",
  instagram: "📷",
  discord: "💬",
};

// ─────────────────────────────────────────────
// Particle background (subtle floating dots)
// ─────────────────────────────────────────────
function Particles() {
  const dots = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-white/10"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
          }}
          animate={{
            y: [-6, 6, -6],
            opacity: [0.1, 0.35, 0.1],
          }}
          transition={{
            duration: d.duration,
            repeat: Infinity,
            delay: d.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Discord Member Row
// ─────────────────────────────────────────────
function DiscordMemberRow({
  lanyardData,
  profile,
}: {
  lanyardData: LanyardData;
  profile: SafiraProfile;
}) {
  const du = lanyardData.discord_user;
  const status = lanyardData.discord_status;
  const avatarUrl = discordAvatarUrl(du.id, du.avatar);
  const displayName = du.global_name || du.display_name || du.username;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-200 group"
    >
      {/* Avatar with status ring */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover"
          style={{
            boxShadow: `0 0 0 2.5px #111, 0 0 0 4px ${STATUS_COLOR[status]}60`,
          }}
        />
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111]"
          style={{ backgroundColor: STATUS_COLOR[status] }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white truncate leading-tight">
            {displayName}
          </span>
          {/* Nitro badge if available */}
          {lanyardData.activities?.some((a) => a.name === "Spotify") && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1db954]/20 text-[#1db954] font-bold uppercase tracking-wider flex-shrink-0">
              ♫
            </span>
          )}
        </div>
        <span className="text-[11px] text-white/40 font-mono">
          Discord Member
        </span>
      </div>

      {/* Profile button */}
      <motion.a
        href={`https://discord.com/users/${du.id}`}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all"
      >
        Profile
      </motion.a>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Spotify Row
// ─────────────────────────────────────────────
function SpotifyRow({ spotify }: { spotify: NonNullable<LanyardData["spotify"]> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-[#1db954]/20 bg-[#1db954]/[0.05] hover:bg-[#1db954]/[0.08] transition-all duration-200"
    >
      <div className="relative flex-shrink-0">
        <img
          src={spotify.album_art_url}
          alt={spotify.song}
          className="w-10 h-10 rounded-lg object-cover"
        />
        {/* Animated equalizer overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-1 gap-[2px]">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-[2px] rounded-full bg-[#1db954]"
              animate={{ height: ["3px", "8px", "3px"] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white truncate">{spotify.song}</p>
        <p className="text-[10px] text-white/40 truncate">{spotify.artist}</p>
      </div>
      <a
        href={`https://open.spotify.com/track/${spotify.track_id}`}
        target="_blank"
        rel="noreferrer"
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#1db954]/20 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5 text-[#1db954]" />
      </a>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Guild / Server Row  
// ─────────────────────────────────────────────
function GuildRow({ guild }: { guild: NonNullable<LanyardData["guild_member_data"]>["guild"] }) {
  const iconUrl = guildIconUrl(guild.id, guild.icon);
  const onlineK =
    guild.approximate_presence_count >= 1000
      ? `${(guild.approximate_presence_count / 1000).toFixed(1)}k`
      : guild.approximate_presence_count.toLocaleString("pt-BR");
  const totalK =
    guild.approximate_member_count >= 1000
      ? `${(guild.approximate_member_count / 1000).toFixed(1)}k`
      : guild.approximate_member_count.toLocaleString("pt-BR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-200"
    >
      {iconUrl ? (
        <img src={iconUrl} alt={guild.name} className="w-10 h-10 rounded-[30%] object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-[30%] bg-white/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-white/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate leading-tight">{guild.name}</p>
        <p className="text-[10px] text-white/40 font-mono">
          <span className="text-[#23a559]">●</span> {onlineK} Online{" "}
          <span className="text-white/20">·</span> {totalK} Membros
        </p>
      </div>
      <motion.a
        href={`https://discord.gg`}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#5865f2] hover:bg-[#4752c4] transition-all"
      >
        Join
      </motion.a>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main LanyardCard
// ─────────────────────────────────────────────
export function LanyardCard({
  profile,
  isPreview = false,
}: {
  profile: SafiraProfile;
  isPreview?: boolean;
}) {
  const { data: lanyardData, loading, error } = useLanyard(profile.discordUserId);

  const status = lanyardData?.discord_status ?? "offline";
  const spotify = lanyardData?.spotify;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-[340px] rounded-[20px] overflow-hidden select-none"
      style={{
        background: "linear-gradient(145deg, #1a1a20 0%, #111115 60%, #0d0d12 100%)",
        border: `1.5px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.6), 0 0 40px ${profile.cardBorderColor}18`,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] z-10"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${profile.cardBorderColor}80 50%, transparent 100%)`,
        }}
      />

      <Particles />

      {/* Card body */}
      <div className="relative z-10 p-6 flex flex-col items-center gap-4">

        {/* Views counter */}
        {profile.showViews && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-white/30">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{profile.views}</span>
          </div>
        )}

        {/* Avatar + status */}
        <div className="relative mt-2">
          <motion.img
            src={
              lanyardData?.discord_user?.avatar
                ? discordAvatarUrl(lanyardData.discord_user.id, lanyardData.discord_user.avatar)
                : profile.avatarUrl
            }
            alt={profile.displayName}
            className="w-[90px] h-[90px] rounded-full object-cover"
            style={{
              boxShadow: `0 0 0 3px #111115, 0 0 0 5px ${STATUS_COLOR[status]}50, 0 8px 32px rgba(0,0,0,0.5)`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Status dot */}
          <motion.div
            className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-[#111115]"
            style={{ backgroundColor: STATUS_COLOR[status] }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
            title={STATUS_LABEL[status]}
          />
        </div>

        {/* Name + bio */}
        <div className="text-center space-y-1">
          <h2 className="text-[17px] font-bold text-white tracking-tight leading-tight">
            {lanyardData?.discord_user?.global_name ||
              lanyardData?.discord_user?.username ||
              profile.displayName}
          </h2>
          {profile.bio && (
            <p className="text-[12px] text-white/45 leading-relaxed max-w-[240px] mx-auto">
              {profile.bio}
            </p>
          )}
          {/* Location if set */}
          {(profile as any).location && (
            <div className="flex items-center justify-center gap-1 text-white/35 mt-1">
              <MapPin className="w-3 h-3" />
              <span className="text-[11px]">{(profile as any).location}</span>
            </div>
          )}
        </div>

        {/* Social link icons row */}
        {profile.links?.length > 0 && (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {profile.links.map((link, i) => (
              <motion.a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/20 transition-all text-base"
                title={link.label}
              >
                {LINK_ICONS[link.icon] || "🔗"}
              </motion.a>
            ))}
          </motion.div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-white/[0.06]" />

        {/* Lanyard Discord section */}
        <div className="w-full space-y-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-3 text-white/30">
              <motion.div
                className="w-4 h-4 rounded-full border border-white/20 border-t-white/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-[11px] font-mono">Carregando Discord...</span>
            </div>
          )}

          {error && !loading && (
            <p className="text-center text-[11px] text-red-400/60 font-mono py-2">{error}</p>
          )}

          <AnimatePresence>
            {lanyardData && (
              <>
                {/* Discord Member Row */}
                <DiscordMemberRow lanyardData={lanyardData} profile={profile} />

                {/* Spotify (if listening) */}
                {spotify && <SpotifyRow spotify={spotify} />}

                {/* Guild row (if Lanyard has guild data) */}
                {lanyardData.guild_member_data && (
                  <GuildRow guild={lanyardData.guild_member_data.guild} />
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default LanyardCard;
