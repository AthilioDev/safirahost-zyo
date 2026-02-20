import { motion } from "framer-motion";
import { StatusIndicator, VerifiedBadge } from "./StatusIndicator";
import { SocialLink } from "./SocialLink";
import { BadgeIcon } from "./BadgeIcon";
import { ProfileEffect } from "./ProfileEffects";
import { Copy, Music, Github, Twitter, Instagram, Globe, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
}

const iconMap: Record<string, React.ReactNode> = {
  github: <Github className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  discord: <MessageCircle className="h-4 w-4" />,
};

interface ProfileCardProps {
  profile: ProfileData;
  isFullPage?: boolean;
  cardBackgroundColor?: string;
}

// 3D perspective tilt hook
const useTilt = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.4s ease-out",
    });
  };

  return { ref, style, handleMouseMove, handleMouseLeave };
};

// Music player — laranja RGB quando tocando
const MusicPlayer = ({ songUrl }: { songUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="flex items-center gap-2 mb-4">
      <audio ref={audioRef} src={songUrl} loop autoPlay />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium w-full transition-colors"
        style={
          playing
            ? {
                background: "rgba(249, 115, 22, 0.10)",
                borderColor: "rgba(249, 115, 22, 0.30)",
              }
            : undefined
        }
      >
        {playing ? (
          <Volume2
            className="h-3.5 w-3.5"
            style={{ color: "rgb(249, 115, 22)" }}
          />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Music
          className="h-3 w-3"
          style={playing ? { color: "rgb(249, 115, 22)" } : undefined}
        />
        <span
          className="truncate flex-1 text-left"
          style={
            playing
              ? { color: "rgb(249, 115, 22)" }
              : { color: "var(--muted-foreground)" }
          }
        >
          {playing ? "Tocando..." : "Tocar música"}
        </span>
        {playing && (
          <div className="flex items-end gap-[2px] h-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-[2px] rounded-full"
                style={{ backgroundColor: "rgb(249, 115, 22)" }}
                animate={{ height: ["4px", "12px", "4px"] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}
      </motion.button>
    </div>
  );
};

// Shared sub-components
const ProfileInfo = ({ profile }: { profile: ProfileData }) => (
  <div className="text-left space-y-1 mb-4">
    <div className="flex items-center gap-2">
      <h2 className="text-xl font-bold text-foreground">{profile.displayName}</h2>
      {profile.isVerified && <VerifiedBadge />}
    </div>
    {profile.bio && (
      <p className="text-sm text-secondary-foreground/80 leading-relaxed pt-1">{profile.bio}</p>
    )}
  </div>
);

const DiscordButton = ({
  discordTag,
  copied,
  copyDiscord,
}: {
  discordTag: string;
  copied: boolean;
  copyDiscord: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={copyDiscord}
    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[hsl(235,86%,65%)]/10 border border-[hsl(235,86%,65%)]/20 text-sm font-medium mb-4 transition-all hover:bg-[hsl(235,86%,65%)]/20"
  >
    <MessageCircle className="h-4 w-4 text-[hsl(235,86%,65%)]" />
    <span className="flex-1 text-left">{copied ? "Copiado!" : discordTag}</span>
    <Copy className="h-3 w-3 text-muted-foreground" />
  </motion.button>
);

const BadgesRow = ({ badges }: { badges: BadgeData[] }) => (
  <div className="flex flex-wrap gap-1.5 mb-4">
    {badges.map((badge) => (
      <motion.div
        key={badge.id}
        whileHover={{ scale: 1.15, y: -2 }}
        title={badge.name}
        className="p-1.5 rounded-lg bg-surface border border-border/50 cursor-default"
      >
        <BadgeIcon icon={badge.icon} color={badge.color} size={16} />
      </motion.div>
    ))}
  </div>
);

const LinksSection = ({ links }: { links: ProfileLink[] }) => (
  <div className="space-y-2">
    {links.map((link, i) => (
      <motion.div
        key={link.url + i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * i }}
      >
        <SocialLink
          label={link.label}
          url={link.url}
          icon={iconMap[link.icon || ""] || <Globe className="h-4 w-4" />}
        />
      </motion.div>
    ))}
  </div>
);

// ── BANNER com blur no fundo ──
const BannerSection = ({ profile }: { profile: ProfileData }) => {
  const blurValue = profile.bannerBlur ?? 0;

  return (
    <div className="relative h-48 overflow-hidden">
      {profile.banner ? (
        <>
          <img
            src={profile.banner}
            alt="Banner"
            className="w-full h-full object-cover"
            style={{
              filter: blurValue > 0 ? `blur(${blurValue}px)` : "none",
              transform: blurValue > 0 ? "scale(1.08)" : "scale(1)",
              transition: "filter 0.3s, transform 0.3s",
            }}
          />
        </>
      ) : (
        <div
          className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10"
          style={{
            filter: blurValue > 0 ? `blur(${blurValue}px)` : "none",
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/30" />
    </div>
  );
};

// ── CLASSIC ──
const CardContent = ({
  profile,
  copied,
  copyDiscord,
}: {
  profile: ProfileData;
  copied: boolean;
  copyDiscord: () => void;
}) => (
  <div
    className="relative glass rounded-2xl overflow-hidden w-full max-w-2xl mx-auto"
    style={{ backdropFilter: "blur(20px)" }}
  >
    <ProfileEffect effect={profile.profileEffect || "none"} />
    <BannerSection profile={profile} />

    <div className="relative px-6 pb-6 -mt-16">
      <div className="flex items-end gap-4 mb-4">
        <div className="relative">
          <img
            src={profile.avatar}
            alt={profile.displayName}
            className="h-20 w-20 rounded-full border-4 border-card object-cover"
          />
          <div className="absolute -bottom-1 -right-1">
            <StatusIndicator status={profile.status} size="lg" />
          </div>
        </div>
        <div className="pb-1 flex-1 min-w-0">
          <ProfileInfo profile={profile} />
        </div>
      </div>

      {profile.songUrl && <MusicPlayer songUrl={profile.songUrl} />}

      {profile.showBadges !== false && profile.badges && profile.badges.length > 0 && (
        <BadgesRow badges={profile.badges} />
      )}

      {profile.showDiscord !== false && profile.discordTag && (
        <DiscordButton discordTag={profile.discordTag} copied={copied} copyDiscord={copyDiscord} />
      )}

      <LinksSection links={profile.links} />

      {profile.showViews !== false && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          {profile.views.toLocaleString()} views
        </p>
      )}
    </div>
  </div>
);

// ── CYBERPUNK ──
const CyberpunkContent = ({
  profile,
  copied,
  copyDiscord,
}: {
  profile: ProfileData;
  copied: boolean;
  copyDiscord: () => void;
}) => {
  const blurValue = profile.bannerBlur ?? 0;

  return (
    <div
      className="relative rounded-2xl overflow-hidden w-full max-w-2xl mx-auto"
      style={{
        boxShadow: "0 0 30px hsl(270 100% 65% / 0.3), inset 0 0 30px hsl(270 100% 65% / 0.05)",
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
              filter: `hue-rotate(20deg) saturate(1.5)${blurValue > 0 ? ` blur(${blurValue}px)` : ""}`,
              transform: blurValue > 0 ? "scale(1.08)" : "scale(1)",
              transition: "filter 0.3s, transform 0.3s",
            }}
          />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-r from-primary via-accent to-primary animate-gradient-shift"
            style={{
              backgroundSize: "200% 200%",
              filter: blurValue > 0 ? `blur(${blurValue}px)` : "none",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/25" />
        <div className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-mono rounded bg-primary/20 border border-primary/40 text-primary">
          safirahost.xyz
        </div>
      </div>
      <div className="bg-card/90 backdrop-blur-xl border-t border-primary/30 px-6 pb-6">
        <div className="flex items-end gap-4 -mt-16 mb-4">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className="h-20 w-20 rounded-lg border-2 border-primary/50 object-cover"
              style={{ boxShadow: "0 0 15px hsl(270 100% 65% / 0.3)" }}
            />
            <div className="absolute -bottom-1 -right-1">
              <StatusIndicator status={profile.status} size="lg" />
            </div>
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{profile.displayName}</h2>
              {profile.isVerified && <VerifiedBadge />}
            </div>
          </div>
        </div>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-4 border-l-2 border-primary/40 pl-3">
            {profile.bio}
          </p>
        )}
        {profile.songUrl && <MusicPlayer songUrl={profile.songUrl} />}
        {profile.showBadges !== false && profile.badges && profile.badges.length > 0 && (
          <BadgesRow badges={profile.badges} />
        )}
        {profile.showDiscord !== false && profile.discordTag && (
          <DiscordButton discordTag={profile.discordTag} copied={copied} copyDiscord={copyDiscord} />
        )}
        <LinksSection links={profile.links} />
        {profile.showViews !== false && (
          <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
            {profile.views.toLocaleString()} views
          </p>
        )}
      </div>
    </div>
  );
};

// ── MINIMAL (sem banner, não aplica blur) ──
const MinimalContent = ({
  profile,
  copied,
  copyDiscord,
}: {
  profile: ProfileData;
  copied: boolean;
  copyDiscord: () => void;
}) => (
  <div className="relative glass rounded-2xl overflow-hidden w-full max-w-lg mx-auto p-8 text-center">
    <ProfileEffect effect={profile.profileEffect || "none"} />
    <img
      src={profile.avatar}
      alt={profile.displayName}
      className="h-20 w-20 rounded-full border-2 border-border mx-auto mb-4 object-cover"
    />
    <div className="space-y-1 mb-4">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-xl font-bold text-foreground">{profile.displayName}</h2>
        {profile.isVerified && <VerifiedBadge />}
      </div>
      {profile.bio && (
        <p className="text-sm text-secondary-foreground/80 leading-relaxed pt-1">{profile.bio}</p>
      )}
    </div>
    {profile.songUrl && <MusicPlayer songUrl={profile.songUrl} />}
    {profile.showBadges !== false && profile.badges && profile.badges.length > 0 && (
      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        {profile.badges.map((b) => (
          <motion.div
            key={b.id}
            whileHover={{ scale: 1.15 }}
            title={b.name}
            className="p-1.5 rounded-lg bg-surface border border-border/50"
          >
            <BadgeIcon icon={b.icon} color={b.color} size={16} />
          </motion.div>
        ))}
      </div>
    )}
    {profile.showDiscord !== false && profile.discordTag && (
      <DiscordButton discordTag={profile.discordTag} copied={copied} copyDiscord={copyDiscord} />
    )}
    <LinksSection links={profile.links} />
    {profile.showViews !== false && (
      <p className="text-xs text-muted-foreground mt-4">{profile.views.toLocaleString()} views</p>
    )}
  </div>
);

const templateMap: Record<
  string,
  React.FC<{ profile: ProfileData; copied: boolean; copyDiscord: () => void }>
> = {
  classic: CardContent,
  minimal: MinimalContent,
  cyberpunk: CyberpunkContent,
};

export const CARD_TEMPLATES = [
  { id: "classic",   label: "Clássico",     desc: "Banner + avatar lateral" },
  { id: "minimal",   label: "Minimalista",  desc: "Limpo e centralizado"    },
  { id: "cyberpunk", label: "Cyberpunk",    desc: "Estilo futurista com neon"},
];

export const ProfileCard = ({ profile, isFullPage, cardBackgroundColor }: ProfileCardProps) => {
  const [copied, setCopied] = useState(false);
  const tilt = useTilt();

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
      <Template profile={profile} copied={copied} copyDiscord={copyDiscord} />
    </motion.div>
  );
};