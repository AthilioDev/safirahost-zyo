import { useState, useEffect } from "react";
import {
  Gem, Eye, Settings, User, Link2, Award, Palette, Sliders, Zap,
  LogOut, Bell, ChevronDown, Copy, ExternalLink,
  Image as ImgIcon, Globe, Code2, Lock, Save, Plus,
  Trash2, Camera, Upload, Home, BarChart2, Users, Star, Check,
  X, Menu, Shield, Edit3, Hash, MousePointer2, Trash
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

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

/* ═══════════════════════════════════════════════════════════
   BADGE ICON RENDERER
   Handles: emoji, short text/code, image URLs, SVG strings,
   and gracefully falls back so it never shows raw garbage
═══════════════════════════════════════════════════════════ */
function BadgeIcon({ icon, size = 28, color = "#f97316" }: { icon: string; size?: number; color?: string }) {
  if (!icon || icon.trim() === "") {
    return <span style={{ fontSize: size * 0.65, color, lineHeight: 1 }}>✦</span>;
  }

  const trimmed = icon.trim();

  // URL de imagem
  if (trimmed.startsWith("http") || trimmed.startsWith("/") || trimmed.startsWith("data:")) {
    return (
      <img
        src={trimmed}
        alt=""
        style={{ width: size, height: size, objectFit: "contain" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }

  // String SVG inline
  if (trimmed.startsWith("<svg")) {
    return (
      <span
        style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  // Conta quantos "grapheme clusters" visíveis tem (emoji count)
  const graphemes = [...new Intl.Segmenter().segment(trimmed)];
  const isEmoji = graphemes.length <= 3 && /\p{Emoji}/u.test(trimmed);
  const isShortSymbol = graphemes.length <= 2 && !isEmoji;

  if (isEmoji) {
    return (
      <span style={{ fontSize: size * 0.78, lineHeight: 1, userSelect: "none", display: "block" }}>
        {trimmed}
      </span>
    );
  }

  if (isShortSymbol || trimmed.length <= 3) {
    return (
      <span style={{
        fontSize: Math.max(size * 0.42, 10),
        fontFamily: "monospace",
        fontWeight: 900,
        color,
        letterSpacing: "-0.03em",
        display: "block",
        lineHeight: 1,
      }}>
        {trimmed}
      </span>
    );
  }

  // Texto mais longo — mostra só os primeiros 4 chars como iniciais
  return (
    <span style={{
      fontSize: Math.max(size * 0.36, 9),
      fontFamily: "monospace",
      fontWeight: 900,
      color,
      letterSpacing: "-0.04em",
      display: "block",
      lineHeight: 1,
    }}>
      {trimmed.slice(0, 4).toUpperCase()}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   BADGE CARD INDIVIDUAL
═══════════════════════════════════════════════════════════ */
function BadgeCard({
  badge,
  equipped,
  onToggle,
  index,
}: {
  badge: { id: string; name: string; icon: string; color: string; description: string };
  equipped: boolean;
  onToggle: () => void;
  index: number;
}) {
  const accent = badge.color || "#f97316";
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative text-left focus:outline-none w-full group"
      style={{
        animation: `fadeSlideIn 0.3s ease both`,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Main card */}
      <div
        className="relative overflow-hidden transition-all duration-200"
        style={{
          border: `2px solid ${equipped ? accent : hovered ? "#2a2a2a" : "#141418"}`,
          background: equipped
            ? `linear-gradient(135deg, ${accent}0d 0%, #080809 60%)`
            : hovered
            ? "#0d0d10"
            : "#080809",
          boxShadow: equipped
            ? `0 0 24px ${accent}18, inset 0 0 20px ${accent}08`
            : hovered
            ? `0 0 12px #00000060`
            : "none",
        }}
      >
        {/* Top shimmer when equipped */}
        {equipped && (
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }}
          />
        )}

        {/* Check badge top-right */}
        <div
          className="absolute top-2.5 right-2.5 transition-all duration-200"
          style={{
            opacity: equipped ? 1 : hovered ? 0.3 : 0,
            transform: equipped ? "scale(1)" : "scale(0.7)",
          }}
        >
          <div
            className="w-5 h-5 flex items-center justify-center"
            style={{
              background: equipped ? accent : "transparent",
              border: `1.5px solid ${equipped ? accent : "#444"}`,
            }}
          >
            <Check className="h-3 w-3" style={{ color: equipped ? "#000" : "#666" }} strokeWidth={3} />
          </div>
        </div>

        <div className="p-4 pb-3">
          {/* Icon box */}
          <div
            className="w-14 h-14 flex items-center justify-center mb-3 transition-all duration-200"
            style={{
              border: `1.5px solid ${equipped ? `${accent}50` : hovered ? `${accent}25` : "#1a1a1f"}`,
              background: equipped ? `${accent}14` : hovered ? `${accent}0a` : "#0d0d10",
              boxShadow: equipped ? `0 0 16px ${accent}22` : "none",
            }}
          >
            <BadgeIcon icon={badge.icon} size={26} color={accent} />
          </div>

          {/* Name */}
          <p
            className="text-[11px] font-black uppercase tracking-widest leading-tight mb-1.5 pr-6 truncate transition-colors duration-200"
            style={{ color: equipped ? accent : hovered ? "#ccc" : "#888" }}
          >
            {badge.name}
          </p>

          {/* Description */}
          <p
            className="text-[10px] font-mono leading-relaxed transition-colors duration-200"
            style={{ color: equipped ? "#6a6a6a" : "#383838" }}
          >
            {badge.description || "Sem descrição"}
          </p>
        </div>

        {/* Bottom bar */}
        <div
          className="h-0.5 transition-all duration-300"
          style={{
            background: equipped
              ? `linear-gradient(to right, transparent, ${accent}, transparent)`
              : hovered
              ? `linear-gradient(to right, transparent, ${accent}40, transparent)`
              : "transparent",
          }}
        />
      </div>

      {/* Action label strip */}
      <div
        className="text-center py-1.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200"
        style={{
          borderLeft: `2px solid ${equipped ? `${accent}50` : "#141418"}`,
          borderRight: `2px solid ${equipped ? `${accent}50` : "#141418"}`,
          borderBottom: `2px solid ${equipped ? `${accent}50` : "#141418"}`,
          background: equipped ? `${accent}08` : hovered ? "#0d0d10" : "transparent",
          color: equipped ? `${accent}90` : hovered ? "#555" : "#222",
        }}
      >
        {equipped ? "✕ remover" : "+ equipar"}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   BADGES TAB COMPLETA
═══════════════════════════════════════════════════════════ */
function BadgesTab({
  userBadges,
  equippedBadgeIds,
  toggleBadgeEquip,
}: {
  userBadges: any[];
  equippedBadgeIds: Set<string>;
  toggleBadgeEquip: (id: string) => void;
}) {
  const equippedCount = equippedBadgeIds.size;
  const equipped = userBadges.filter((ub) => equippedBadgeIds.has(ub.badge_id));
  const available = userBadges.filter((ub) => !equippedBadgeIds.has(ub.badge_id));

  if (userBadges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[#1a1a1f] gap-5">
        <div className="w-20 h-20 border border-[#1a1a1f] bg-[#0a0a0d] flex items-center justify-center">
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
    <div className="space-y-7">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header com slot counter ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#f97316] font-black">Suas Badges</p>
          <p className="text-[10px] text-[#2a2a2a] font-mono mt-0.5">
            {userBadges.length} disponíve{userBadges.length !== 1 ? "is" : "l"}
          </p>
        </div>

        {/* Slot indicator visual */}
        <div className="flex items-center gap-2 border border-[#1a1a1f] bg-[#080809] px-3 py-2">
          <div className="flex gap-1 items-center">
            {Array.from({ length: MAX_EQUIPPED }).map((_, i) => (
              <div
                key={i}
                className="transition-all duration-300"
                style={{
                  width: i < equippedCount ? 10 : 8,
                  height: i < equippedCount ? 10 : 8,
                  border: `1.5px solid ${i < equippedCount ? "#f97316" : "#222"}`,
                  background: i < equippedCount ? "#f97316" : "transparent",
                  boxShadow: i < equippedCount ? "0 0 6px #f9731660" : "none",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-black tabular-nums" style={{ color: equippedCount > 0 ? "#f97316" : "#333" }}>
            {equippedCount}/{MAX_EQUIPPED}
          </span>
        </div>
      </div>

      {/* ── EQUIPADAS ── */}
      {equipped.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, #f97316, transparent)" }} />
            <div className="flex items-center gap-1.5">
              <Check className="h-2.5 w-2.5 text-[#f97316]" strokeWidth={3} />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#f97316]">Equipadas</span>
            </div>
            <div className="h-px w-8 bg-[#111]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {equipped.map((ub, i) => (
              <BadgeCard
                key={ub.id}
                index={i}
                badge={{
                  id: ub.badges.id,
                  name: ub.badges.name,
                  icon: ub.badges.icon,
                  color: ub.badges.color,
                  description: ub.badges.description,
                }}
                equipped
                onToggle={() => toggleBadgeEquip(ub.badge_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── DISPONÍVEIS ── */}
      {available.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-[#111]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#2a2a2a]">Disponíveis</span>
            <div className="h-px flex-1 bg-[#111]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {available.map((ub, i) => (
              <BadgeCard
                key={ub.id}
                index={i}
                badge={{
                  id: ub.badges.id,
                  name: ub.badges.name,
                  icon: ub.badges.icon,
                  color: ub.badges.color,
                  description: ub.badges.description,
                }}
                equipped={false}
                onToggle={() => {
                  if (equippedBadgeIds.size >= MAX_EQUIPPED) {
                    toast.error(`Máximo de ${MAX_EQUIPPED} badges equipadas ao mesmo tempo.`);
                    return;
                  }
                  toggleBadgeEquip(ub.badge_id);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Dica ── */}
      <div className="border border-[#f97316]/10 bg-[#f97316]/5 px-4 py-3 flex items-start gap-3">
        <Award className="h-3.5 w-3.5 text-[#f97316]/40 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[10px] text-[#555] font-mono">Clique em uma badge para equipar ou remover. As equipadas aparecem no seu perfil público.</p>
          <p className="text-[9px] text-[#2a2a2a] font-mono">Máx. {MAX_EQUIPPED} equipadas por vez. Salve o perfil para aplicar as mudanças.</p>
        </div>
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

  const [activePage, setActivePage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);
  const [profile, setProfile] = useState({
    username: "", displayName: "", bio: "", discordTag: "",
    avatarUrl: "", bannerUrl: "", cardTemplate: "classic",
    profileEffect: "none", cardBorderColor: "#f97316",
    showDiscord: true, showBadges: true, showViews: true,
    backgroundUrl: "", backgroundVideoUrl: "", songUrl: "",
    bannerBlur: 0, cursorUrl: "", views: 0, isVerified: false,
    links: [] as { id?: string; label: string; url: string; icon: string }[],
    badges: [] as any[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState("profile");
  const [links, setLinks] = useState([] as { id?: string; label: string; url: string; icon: string }[]);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState(0);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [equippedBadgeIds, setEquippedBadgeIds] = useState<Set<string>>(new Set());
  const [discordUserId, setDiscordUserId] = useState("");
  const [cursorUploading, setCursorUploading] = useState(false);
  const [cursorPreview, setCursorPreview] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authProfile) {
      const cursorVal = (authProfile as any).cursor_url || "";
      setProfile({
        username: authProfile.username || "",
        displayName: authProfile.display_name || "",
        bio: authProfile.bio || "",
        discordTag: authProfile.discord_tag || "",
        avatarUrl: authProfile.avatar_url || "",
        bannerUrl: authProfile.banner_url || "",
        cardTemplate: authProfile.card_template || "classic",
        profileEffect: authProfile.profile_effect || "none",
        cardBorderColor: authProfile.card_border_color || "#f97316",
        showDiscord: authProfile.show_discord ?? true,
        showBadges: authProfile.show_badges ?? true,
        showViews: authProfile.show_views ?? true,
        backgroundUrl: (authProfile as any).background_url || "",
        backgroundVideoUrl: (authProfile as any).background_video_url || "",
        songUrl: (authProfile as any).song_url || "",
        bannerBlur: (authProfile as any).banner_blur ?? 0,
        cursorUrl: cursorVal,
        views: authProfile.views || 0,
        isVerified: authProfile.is_verified || false,
        links: [], badges: [],
      });
      setCursorPreview(cursorVal);
      setDiscordUserId((authProfile as any).discord_user_id || "");
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
    if (!isAllowed) { toast.error("Formato inválido. Use PNG, GIF, WebP, SVG, CUR ou ANI."); return; }
    if (file.size > 500 * 1024) { toast.error("Arquivo muito grande. Máximo: 500KB."); return; }
    setCursorUploading(true);
    const url = await uploadFile(file, "cursors");
    if (url) { setProfile({ ...profile, cursorUrl: url }); setCursorPreview(url); toast.success("Cursor enviado! Salve para aplicar."); }
    setCursorUploading(false);
  };

  const removeCursor = () => { setProfile({ ...profile, cursorUrl: "" }); setCursorPreview(""); toast.success("Cursor removido."); };

  const toggleBadgeEquip = (badgeId: string) => {
    setEquippedBadgeIds((prev) => {
      const next = new Set(prev);
      if (next.has(badgeId)) { next.delete(badgeId); }
      else { next.add(badgeId); }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.displayName, username: profile.username, bio: profile.bio,
      discord_tag: profile.discordTag, avatar_url: profile.avatarUrl, banner_url: profile.bannerUrl,
      card_template: profile.cardTemplate, profile_effect: profile.profileEffect,
      card_border_color: profile.cardBorderColor, show_discord: profile.showDiscord,
      show_badges: profile.showBadges, show_views: profile.showViews,
      background_url: profile.backgroundUrl, background_video_url: profile.backgroundVideoUrl,
      song_url: profile.songUrl, banner_blur: profile.bannerBlur,
      cursor_url: profile.cursorUrl || null, discord_user_id: discordUserId.trim() || null,
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
    toast.success("Perfil salvo com sucesso!");
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const copyLink = () => { navigator.clipboard?.writeText(`safirahost.xyz/${profile.username}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const addLink = () => setLinks([...links, { label: "Novo Link", url: "https://", icon: "website" }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: string, value: string) => setLinks(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  const nav = (page: string) => setActivePage(page);

  const equippedBadges = userBadges
    .filter((ub: any) => equippedBadgeIds.has(ub.badge_id))
    .map((ub: any) => ({ id: ub.badges.id, name: ub.badges.name, icon: ub.badges.icon, color: ub.badges.color, description: ub.badges.description }));

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}
      className="min-h-screen bg-[#0c0c0f] text-white flex overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 bg-[#0a0a0d] border-r border-[#1a1a1f] flex flex-col transition-all duration-300 h-screen sticky top-0 z-40`}>
        <div className="h-14 border-b border-[#1a1a1f] flex items-center px-4 gap-3">
          <Gem className="h-5 w-5 text-[#f97316] flex-shrink-0" />
          {sidebarOpen && <span className="font-black text-base tracking-widest text-[#f97316] uppercase">Safira</span>}
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
          <div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-2 px-3 py-2 text-[#444] hover:text-[#777] transition-colors">
              {sidebarOpen && <span className="text-[10px] uppercase tracking-widest font-black flex-1 text-left">Painel</span>}
              <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
            </button>
            <SidebarItem icon={<Home className="h-4 w-4" />} label="Início" active={activePage === "home"} onClick={() => nav("home")} open={sidebarOpen} />
            <SidebarItem icon={<BarChart2 className="h-4 w-4" />} label="Analytics" active={activePage === "analytics"} onClick={() => nav("analytics")} open={sidebarOpen} badge="breve" />
          </div>
          <div className="pt-3">
            <button onClick={() => setAccountOpen(!accountOpen)} className="w-full flex items-center gap-2 px-3 py-2 text-[#444] hover:text-[#777] transition-colors">
              {sidebarOpen && <span className="text-[10px] uppercase tracking-widest font-black flex-1 text-left">Conta</span>}
              <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${accountOpen ? "" : "-rotate-90"}`} />
            </button>
            {accountOpen && (
              <>
                <SidebarItem icon={<Settings className="h-4 w-4" />} label="Configurações" active={activePage === "settings"} onClick={() => nav("settings")} open={sidebarOpen} />
                <SidebarItem icon={<Hash className="h-4 w-4" />} label="Histórico" active={activePage === "history"} onClick={() => nav("history")} open={sidebarOpen} />
              </>
            )}
          </div>
          <div className="pt-3">
            {sidebarOpen && <p className="px-3 py-2 text-[10px] uppercase tracking-widest font-black text-[#444]">Editor</p>}
            <SidebarItem icon={<User className="h-4 w-4" />} label="Perfil" active={activePage === "editor" && activeEditorTab === "profile"} onClick={() => { nav("editor"); setActiveEditorTab("profile"); }} open={sidebarOpen} />
            <SidebarItem icon={<Link2 className="h-4 w-4" />} label="Links" active={activePage === "editor" && activeEditorTab === "links"} onClick={() => { nav("editor"); setActiveEditorTab("links"); }} open={sidebarOpen} />
            <SidebarItem icon={<Award className="h-4 w-4" />} label="Badges" active={activePage === "editor" && activeEditorTab === "badges"} onClick={() => { nav("editor"); setActiveEditorTab("badges"); }} open={sidebarOpen} />
            <SidebarItem icon={<Palette className="h-4 w-4" />} label="Estilo" active={activePage === "editor" && activeEditorTab === "style"} onClick={() => { nav("editor"); setActiveEditorTab("style"); }} open={sidebarOpen} />
            <SidebarItem icon={<Sliders className="h-4 w-4" />} label="Avançado" active={activePage === "editor" && activeEditorTab === "advanced"} onClick={() => { nav("editor"); setActiveEditorTab("advanced"); }} open={sidebarOpen} />
            <SidebarItem icon={<Zap className="h-4 w-4" />} label="Integrações" active={activePage === "editor" && activeEditorTab === "integrations"} onClick={() => { nav("editor"); setActiveEditorTab("integrations"); }} open={sidebarOpen} />
          </div>
        </nav>
        <div className="border-t border-[#1a1a1f] p-3">
          <div className="flex items-center gap-2">
            <img src={profile.avatarUrl} className="h-8 w-8 rounded-full border border-[#1a1a1f] flex-shrink-0 object-cover" alt="avatar" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">@{profile.username}</p>
                <p className="text-[10px] text-[#444] truncate">safirahost.xyz/{profile.username}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={() => signOut()} className="p-1 hover:text-[#f97316] text-[#333] transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#1a1a1f] bg-[#0a0a0d] sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-[#111] rounded text-[#444] hover:text-[#888] transition-colors">
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">
              {activePage === "home" && "Dashboard"}
              {activePage === "editor" && "Editor de Perfil"}
              {activePage === "preview" && "Preview do Perfil"}
              {activePage === "settings" && "Configurações"}
              {activePage === "analytics" && "Analytics"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => nav("preview")} className="flex items-center gap-2 px-4 py-1.5 border border-[#222] text-[#555] hover:border-[#444] hover:text-[#999] text-[10px] uppercase tracking-widest transition-colors">
              <Eye className="h-3.5 w-3.5" /> Ver Perfil
            </button>
            {activePage === "editor" && (
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${saved ? "bg-green-500/20 border border-green-500/40 text-green-400" : "bg-[#f97316] text-black hover:bg-[#e06210]"} disabled:opacity-40`}>
                {saved ? <><Check className="h-3.5 w-3.5" />Salvo!</> : saving ? "Salvando..." : <><Save className="h-3.5 w-3.5" />Salvar</>}
              </button>
            )}
            <button className="relative p-2 hover:bg-[#111] text-[#444] hover:text-[#888] transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#f97316] rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">

          {/* HOME */}
          {activePage === "home" && (
            <div className="p-6 max-w-6xl mx-auto space-y-6">
              <div className="border border-[#1a1a1f] bg-[#0a0a0d] p-6">
                <h2 className="text-xl font-black text-white mb-1">Visão Geral</h2>
                <p className="text-xs text-[#444] font-mono">Bem-vindo ao seu painel Safira. Aqui você tem uma visão rápida do seu perfil, análises e configurações.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Eye className="h-5 w-5 text-blue-400" />} label="Visualizações" value={profile.views.toString()} color="blue" />
                <StatCard icon={<Gem className="h-5 w-5 text-[#f97316]" />} label="Coins" value="0" color="orange" />
                <StatCard icon={<Award className="h-5 w-5 text-[#555]" />} label="Insígnias" value={userBadges.length.toString()} badge="BREVE" color="gray" />
                <StatCard icon={<Star className="h-5 w-5 text-[#f97316]" />} label="Conta" value="Grátis" color="orange" />
              </div>
              <div className="border border-[#1a1a1f] bg-[#0a0a0d] p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={profile.avatarUrl} className="h-16 w-16 object-cover border-2 border-[#f97316]/30 rounded-full" alt="avatar" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0a0a0d] rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-white">@{profile.username}</p>
                    <p className="text-xs text-[#444] font-mono">{profile.displayName}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <ActionBtn icon={<Eye className="h-3 w-3" />} label="Ver Perfil" primary onClick={() => nav("preview")} />
                      <ActionBtn icon={<Camera className="h-3 w-3" />} label="Editar Imagens" onClick={() => { nav("editor"); setActiveEditorTab("profile"); }} />
                      <ActionBtn icon={<Link2 className="h-3 w-3" />} label="Editar Links" onClick={() => { nav("editor"); setActiveEditorTab("links"); }} />
                      <ActionBtn icon={<Copy className="h-3 w-3" />} label={copied ? "Copiado!" : "Copiar Link"} onClick={copyLink} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] p-4 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] uppercase tracking-widest border border-[#f97316]/30 text-[#f97316] px-2 py-0.5 font-black">BREVE</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Gerenciamento de Grupos</p>
                        <p className="text-[10px] text-[#444] font-mono">Em breve você poderá criar seus próprios grupos, convidar amigos entre outros.</p>
                      </div>
                    </div>
                    <div className="border border-[#1a1a1f] bg-[#070709] px-3 py-2 flex items-center gap-2 mb-3">
                      <X className="h-3 w-3 text-[#444]" />
                      <span className="text-[10px] text-[#333] font-mono flex-1">Este recurso ainda se encontra em construção.</span>
                      <X className="h-3 w-3 text-[#333] cursor-pointer hover:text-[#555]" />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { icon: <Users className="h-5 w-5" />, label: "Criar Grupo" },
                        { icon: <Plus className="h-5 w-5" />, label: "Convidar Amigos" },
                        { icon: <ImgIcon className="h-5 w-5" />, label: "Adicionar Imagem" },
                        { icon: <Edit3 className="h-5 w-5" />, label: "Editar Descrição" },
                        { icon: <Copy className="h-5 w-5" />, label: "Copiar Link" },
                      ].map((btn) => (
                        <button key={btn.label} className="flex flex-col items-center gap-2 p-3 border border-[#1a1a1f] bg-[#0d0d10] opacity-40 cursor-not-allowed">
                          <span className="text-[#555]">{btn.icon}</span>
                          <span className="text-[9px] text-[#444] text-center font-mono leading-tight">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border border-[#1a1a1f] bg-[#0a0a0d] p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Seus Grupos</p>
                        <p className="text-[10px] text-[#444] font-mono">Em breve você poderá gerenciar seus próprios grupos.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Grupo Aberto", tag: "ATH", status: "Open", members: 24, color: "green" },
                        { label: "Grupo Fechado", tag: "ATH2", status: "Closed", members: 8, color: "red" },
                        { label: "Grupo Trancado", tag: "ATH3", status: "Request", members: 15, color: "yellow" },
                      ].map((g) => (
                        <div key={g.tag} className="border border-[#1a1a1f] bg-[#0d0d10] p-3 opacity-40">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-[#111] border border-[#1a1a1f] flex items-center justify-center">
                              <span className="text-[10px] font-black text-[#555]">Z</span>
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">{g.label}</p>
                              <span className="text-[9px] border border-[#222] text-[#444] px-1">{g.tag}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black ${g.color === "green" ? "text-green-400" : g.color === "red" ? "text-red-400" : "text-yellow-400"}`}>● {g.status}</span>
                            <span className="text-[9px] text-[#444] font-mono">👤 {g.members} membros</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border border-[#1a1a1f] bg-[#0a0a0d] p-4 h-fit">
                  <div className="flex items-center gap-2 mb-4 border-b border-[#111] pb-3">
                    <Bell className="h-4 w-4 text-blue-400" />
                    <p className="text-xs font-black text-white uppercase tracking-widest">Atualizações do Painel</p>
                  </div>
                  <p className="text-[10px] text-[#444] font-mono mb-4">Fique por dentro das atualizações da plataforma.</p>
                  <div className="space-y-3">
                    {ANNOUNCEMENTS.map((a, i) => (
                      <div key={i} className={`p-3 border transition-colors cursor-pointer ${announcement === i ? "border-blue-500/30 bg-blue-500/5" : "border-[#111] hover:border-[#1a1a1f]"}`} onClick={() => setAnnouncement(i)}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-[11px] font-black text-white leading-tight">{a.title}</p>
                          <span className="text-[9px] text-[#333] font-mono flex-shrink-0">{a.date}</span>
                        </div>
                        {announcement === i && <p className="text-[10px] text-[#555] font-mono mt-2 leading-relaxed">{a.body}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#111]">
                    <p className="text-xs font-black text-white mb-2">Melhore sua experiência</p>
                    <p className="text-[10px] text-[#444] font-mono mb-3">Desbloqueie recursos premium e destaque seu perfil</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Moldura","Tag premium","Neon no card","Cor do Neon","Tag verificado","Favicon"].map((f) => (
                        <div key={f} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 border border-blue-500/40 bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          </div>
                          <span className="text-[9px] text-[#555] font-mono">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {activePage === "preview" && (
            <div className="min-h-full bg-[#050507] flex items-center justify-center p-8">
              <div className="text-center mb-8 absolute top-20 left-1/2 -translate-x-1/2">
                <p className="text-[10px] uppercase tracking-widest text-[#333] font-mono">safirahost.xyz/{profile.username}</p>
              </div>
              <ProfileCard profile={{ ...profile, links, badges: equippedBadges }} />
            </div>
          )}

          {/* EDITOR */}
          {activePage === "editor" && (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
              {/* Tab bar */}
              <div className="flex flex-wrap border-b border-[#1a1a1f]">
                {[
                  { id: "profile", label: "Perfil" },
                  { id: "links", label: "Links" },
                  { id: "badges", label: "Badges", count: equippedBadgeIds.size },
                  { id: "style", label: "Estilo" },
                  { id: "advanced", label: "Avançado" },
                  { id: "integrations", label: "Integrações" },
                ].map((t) => (
                  <button key={t.id} onClick={() => setActiveEditorTab(t.id)}
                    className={`relative px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeEditorTab === t.id ? "border-[#f97316] text-[#f97316]" : "border-transparent text-[#444] hover:text-[#888]"
                    }`}>
                    {t.label}
                    {t.count != null && t.count > 0 && (
                      <span className="text-[8px] font-black px-1 py-0.5 leading-none" style={{ background: "#f97316", color: "#000" }}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* PERFIL TAB */}
              {activeEditorTab === "profile" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Avatar</label>
                      <div className="flex items-center gap-4">
                        <img src={profile.avatarUrl} className="h-20 w-20 object-cover border border-[#1a1a1f]" alt="avatar" />
                        <label className="flex items-center gap-2 px-4 py-2.5 border border-[#222] text-[#555] hover:border-[#f97316]/40 hover:text-[#f97316] transition-colors cursor-pointer text-[10px] uppercase tracking-widest">
                          <Camera className="h-3.5 w-3.5" /> Alterar
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Banner</label>
                      <div className="relative h-24 border border-[#1a1a1f] group overflow-hidden bg-[#0d0d10] flex items-center justify-center">
                        {profile.bannerUrl ? <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="banner" /> : <span className="text-[#2a2a2a] text-[10px] uppercase tracking-widest">Sem banner</span>}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="h-5 w-5 text-[#666]" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Field label="Nome de exibição" value={profile.displayName} onChange={(v) => setProfile({ ...profile, displayName: v })} />
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Username</label>
                      <div className="flex border border-[#1a1a1f] focus-within:border-[#f97316]/40 transition-colors">
                        <span className="inline-flex items-center px-4 py-3 bg-[#080809] text-[#333] text-[10px] border-r border-[#1a1a1f] font-mono">safirahost.xyz/</span>
                        <input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                          className="flex-1 px-4 py-3 bg-[#0d0d10] text-white text-sm placeholder-[#333] outline-none font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Bio</label>
                      <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={200} rows={3}
                        className="w-full px-4 py-3 bg-[#0d0d10] border border-[#1a1a1f] text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none resize-none font-mono transition-colors" />
                      <p className="text-[10px] text-[#333] mt-1 text-right">{profile.bio.length}/200</p>
                    </div>
                    <Field label="Discord Tag" value={profile.discordTag} onChange={(v) => setProfile({ ...profile, discordTag: v })} placeholder="usuario#1234" />
                  </div>
                </div>
              )}

              {/* LINKS TAB */}
              {activeEditorTab === "links" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-[#444]">Seus Links ({links.length})</p>
                    <button onClick={addLink} className="flex items-center gap-2 px-4 py-2 border border-[#222] text-[#555] hover:border-[#f97316]/40 hover:text-[#f97316] text-[10px] uppercase tracking-widest transition-colors">
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </button>
                  </div>
                  {links.length === 0 ? (
                    <div className="text-center py-14 border border-dashed border-[#1a1a1f]">
                      <p className="text-[#333] text-[10px] uppercase tracking-widest">Nenhum link adicionado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.map((link, i) => (
                        <div key={i} className="p-4 bg-[#0a0a0d] border border-[#1a1a1f] hover:border-[#2a2a2f] transition-colors">
                          <div className="flex gap-3 mb-3">
                            <select value={link.icon} onChange={(e) => updateLink(i, "icon", e.target.value)}
                              className="px-3 py-2.5 bg-[#111] border border-[#1a1a1f] text-[#666] text-[10px] font-mono min-w-[120px] outline-none focus:border-[#f97316]/40 transition-colors">
                              <option value="website">🌐 Website</option>
                              <option value="github">🐙 GitHub</option>
                              <option value="twitter">✖️ Twitter</option>
                              <option value="instagram">📷 Instagram</option>
                              <option value="discord">💬 Discord</option>
                            </select>
                            <input value={link.label} onChange={(e) => updateLink(i, "label", e.target.value)}
                              className="flex-1 px-4 py-2.5 bg-[#111] border border-[#1a1a1f] text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
                            <button onClick={() => removeLink(i)} className="p-2.5 border border-[#1a1a1f] hover:border-red-900/40 text-[#444] hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <input value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#111] border border-[#1a1a1f] text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ════ BADGES TAB ════ */}
              {activeEditorTab === "badges" && (
                <BadgesTab
                  userBadges={userBadges}
                  equippedBadgeIds={equippedBadgeIds}
                  toggleBadgeEquip={toggleBadgeEquip}
                />
              )}

              {/* STYLE TAB */}
              {activeEditorTab === "style" && (
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#444] mb-4">Cor da Borda</p>
                    <div className="flex items-center gap-5 mb-5">
                      <input type="color" value={profile.cardBorderColor} onChange={(e) => setProfile({ ...profile, cardBorderColor: e.target.value })}
                        className="w-14 h-14 cursor-pointer border border-[#1a1a1f] bg-transparent" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#444]">Cor atual</p>
                        <p className="font-mono text-sm text-white mt-1">{profile.cardBorderColor}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => setProfile({ ...profile, cardBorderColor: c })}
                          className={`w-10 h-10 border-2 transition-all ${profile.cardBorderColor === c ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="mt-5 h-16 border-2 bg-[#0a0a0d] flex items-center justify-center" style={{ borderColor: profile.cardBorderColor }}>
                      <span className="text-[#333] text-[10px] uppercase tracking-widest font-mono">Preview da borda</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ADVANCED TAB */}
              {activeEditorTab === "advanced" && (
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-2">Mídia de Fundo</p>
                  <Field label="🎵 Música de fundo" value={profile.songUrl} onChange={(v) => setProfile({ ...profile, songUrl: v })} placeholder="Link direto .mp3 / .ogg" />
                  <Field label="🖼️ Imagem de fundo" value={profile.backgroundUrl} onChange={(v) => setProfile({ ...profile, backgroundUrl: v })} placeholder="URL da imagem" />
                  <Field label="🎬 Vídeo de fundo" value={profile.backgroundVideoUrl} onChange={(v) => setProfile({ ...profile, backgroundVideoUrl: v })} placeholder="URL do vídeo" />
                  <div className="pt-4 border-t border-[#111]">
                    <div className="flex items-center gap-2 mb-1">
                      <MousePointer2 className="h-3.5 w-3.5 text-[#f97316]" />
                      <p className="text-[10px] uppercase tracking-widest text-[#f97316]">Cursor Personalizado</p>
                    </div>
                    <p className="text-[10px] text-[#333] font-mono mb-5">Defina um cursor exclusivo que aparece somente na sua página de perfil. Suporta PNG, GIF, WebP, SVG, CUR, ANI. Máx: 500KB.</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Enviar imagem</label>
                        <label className={`flex flex-col items-center justify-center gap-3 h-32 border-2 border-dashed transition-colors cursor-pointer group ${cursorUploading ? "border-[#f97316]/40 bg-[#f97316]/5" : "border-[#1a1a1f] hover:border-[#f97316]/40 hover:bg-[#f97316]/5"}`}>
                          {cursorUploading ? (
                            <><div className="h-5 w-5 border border-[#f97316] border-t-transparent rounded-full animate-spin" /><span className="text-[10px] text-[#f97316] uppercase tracking-widest">Enviando...</span></>
                          ) : (
                            <><MousePointer2 className="h-6 w-6 text-[#333] group-hover:text-[#f97316] transition-colors" /><span className="text-[10px] text-[#444] uppercase tracking-widest group-hover:text-[#f97316] transition-colors">Clique para enviar</span><span className="text-[9px] text-[#222] font-mono">PNG, GIF, WebP, SVG, CUR, ANI</span></>
                          )}
                          <input type="file" accept="image/png,image/gif,image/webp,image/svg+xml,.cur,.ani" className="hidden" onChange={handleCursorUpload} disabled={cursorUploading} />
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Preview</label>
                        <div className="h-32 border border-[#1a1a1f] bg-[#0a0a0d] flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                          style={cursorPreview && cursorPreview !== "none" ? { cursor: `url(${cursorPreview}), auto` } : {}}>
                          {cursorPreview && cursorPreview !== "none" ? (
                            <><img src={cursorPreview} className="h-10 w-10 object-contain" alt="cursor preview" /><span className="text-[9px] text-[#555] font-mono uppercase tracking-widest">Passe o mouse aqui</span></>
                          ) : (
                            <span className="text-[10px] text-[#222] uppercase tracking-widest">Nenhum cursor definido</span>
                          )}
                        </div>
                        <div className="mt-3">
                          <label className="text-[10px] uppercase tracking-widest text-[#333] mb-1.5 block">Ou cole uma URL</label>
                          <input value={profile.cursorUrl} onChange={(e) => { setProfile({ ...profile, cursorUrl: e.target.value }); setCursorPreview(e.target.value); }}
                            placeholder="https://...cursor.png"
                            className="w-full px-3 py-2 bg-[#0d0d10] border border-[#1a1a1f] text-white text-xs placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
                        </div>
                        {profile.cursorUrl && (
                          <button onClick={removeCursor} className="mt-2 flex items-center gap-1.5 text-[10px] text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-widest">
                            <Trash className="h-3 w-3" /> Remover cursor
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 border border-[#f97316]/10 bg-[#f97316]/5 px-4 py-3 flex items-start gap-3">
                      <MousePointer2 className="h-3.5 w-3.5 text-[#f97316]/60 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#f97316]/80 font-mono">O cursor personalizado aparece apenas na sua página pública.</p>
                        <p className="text-[9px] text-[#444] font-mono">Para melhor resultado use imagens de 32×32px ou 64×64px com fundo transparente.</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#111]">
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-4">Visibilidade</p>
                    <div className="space-y-4">
                      {[
                        { label: "Mostrar Discord Tag", key: "showDiscord" },
                        { label: "Mostrar Badges", key: "showBadges" },
                        { label: "Mostrar Contador de Views", key: "showViews" },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                          <span className="text-xs text-[#666] group-hover:text-[#999] transition-colors uppercase tracking-widest">{item.label}</span>
                          <div onClick={() => setProfile({ ...profile, [item.key]: !profile[item.key] })}
                            className={`w-10 h-5 transition-colors flex items-center px-0.5 cursor-pointer ${profile[item.key] ? "bg-[#f97316]" : "bg-[#1a1a1f]"}`}>
                            <div className={`w-4 h-4 bg-white transform transition-transform ${profile[item.key] ? "translate-x-5" : "translate-x-0"}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#111]">
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-4">Desfoque do Banner</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-4xl font-black text-white tabular-nums">{profile.bannerBlur}</span>
                      <span className="text-xs text-[#444] mb-1">px</span>
                    </div>
                    <input type="range" min={0} max={20} step={1} value={profile.bannerBlur}
                      onChange={(e) => setProfile({ ...profile, bannerBlur: Number(e.target.value) })}
                      className="w-full h-1.5 appearance-none outline-none cursor-pointer mb-2"
                      style={{ background: `linear-gradient(to right, #f97316 0%, #f97316 ${(profile.bannerBlur / 20) * 100}%, #1a1a1f ${(profile.bannerBlur / 20) * 100}%, #1a1a1f 100%)` }} />
                  </div>
                </div>
              )}

              {/* INTEGRATIONS TAB */}
              {activeEditorTab === "integrations" && (
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">Integrações</p>
                    <p className="text-xs text-[#333] font-mono">Conecte serviços externos ao seu perfil</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#555] font-black border-b border-[#111] pb-2">Discord</p>
                    <Field label="Discord User ID" value={discordUserId} onChange={(v) => setDiscordUserId(v)} placeholder="Ex: 200207310625177602" />
                    <p className="text-[10px] text-[#333] font-mono">Clique direito no seu nome → Copiar ID de usuário</p>
                  </div>
                  {[
                    { title: "Domínio Personalizado", icon: <Globe className="h-4 w-4" />, color: "#f97316" },
                    { title: "CSS Personalizado", icon: <Code2 className="h-4 w-4" />, color: "#8b5cf6" },
                  ].map((feat) => (
                    <div key={feat.title} className="relative border border-[#1a1a1f] bg-[#080809] p-5 overflow-hidden">
                      <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backdropFilter: "blur(4px)", background: "rgba(5,5,7,0.7)" }}>
                        <div className="text-center">
                          <div className="flex items-center gap-2 px-3 py-1.5 border mx-auto w-fit mb-2" style={{ borderColor: `${feat.color}40`, background: `${feat.color}10` }}>
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
                  <p className="text-[10px] text-[#222] font-mono uppercase tracking-widest pt-2 border-t border-[#0f0f0f]">Em breve: Spotify, GitHub, Steam...</p>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activePage === "settings" && (
            <div className="p-6 max-w-2xl mx-auto">
              <div className="border border-[#1a1a1f] bg-[#0a0a0d] p-6">
                <p className="text-[10px] uppercase tracking-widest text-[#f97316] mb-4">Configurações da Conta</p>
                <div className="space-y-4">
                  <Field label="E-mail" value={user?.email || ""} onChange={() => {}} />
                  <Field label="Senha atual" value="" onChange={() => {}} type="password" placeholder="••••••••" />
                  <Field label="Nova senha" value="" onChange={() => {}} type="password" placeholder="••••••••" />
                  <button className="px-6 py-2.5 bg-[#f97316] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors">Salvar Alterações</button>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activePage === "analytics" && (
            <div className="p-6 max-w-3xl mx-auto">
              <div className="text-center py-24 border border-dashed border-[#1a1a1f]">
                <BarChart2 className="h-12 w-12 text-[#222] mx-auto mb-4" />
                <p className="text-[#333] text-xs uppercase tracking-widest">Analytics em breve</p>
                <p className="text-[#222] text-[10px] mt-2 font-mono">Estatísticas detalhadas do seu perfil estarão disponíveis em breve</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #f97316; cursor: pointer; border: 2px solid #0c0c0f; }
        input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; background: #f97316; cursor: pointer; border: 2px solid #0c0c0f; border-radius: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #080809; }
        ::-webkit-scrollbar-thumb { background: #1a1a1f; }
        ::-webkit-scrollbar-thumb:hover { background: #2a2a2f; }
      `}</style>
    </div>
  );
}

/* ─── SUB-COMPONENTS ─────────────────────────────────────── */

function SidebarItem({ icon, label, active, onClick, open, badge }: any) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left group rounded-none ${active ? "bg-[#f97316]/10 text-[#f97316]" : "text-[#444] hover:text-[#888] hover:bg-[#0d0d10]"}`}>
      <span className="flex-shrink-0">{icon}</span>
      {open && <span className="flex-1 text-[11px] font-black uppercase tracking-widest truncate">{label}</span>}
      {open && badge && <span className="text-[8px] border border-[#f97316]/30 text-[#f97316] px-1.5 py-0.5 font-black uppercase tracking-widest">{badge}</span>}
    </button>
  );
}

function StatCard({ icon, label, value, color, badge }: any) {
  const borderColors: any = { orange: "#f97316", blue: "#3b82f6", gray: "#333" };
  return (
    <div className="border border-[#1a1a1f] bg-[#0a0a0d] p-4 relative overflow-hidden">
      {badge && <div className="absolute top-2 right-2"><span className="text-[8px] uppercase tracking-widest border border-[#f97316]/30 text-[#f97316] px-1.5 py-0.5 font-black">{badge}</span></div>}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 border flex items-center justify-center" style={{ borderColor: `${borderColors[color]}30`, background: `${borderColors[color]}10` }}>{icon}</div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[#444] mb-1">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, primary }: any) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${primary ? "bg-blue-600 hover:bg-blue-500 text-white" : "border border-[#222] text-[#555] hover:border-[#f97316]/40 hover:text-[#f97316]"}`}>
      {icon}{label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#0d0d10] border border-[#1a1a1f] text-white text-sm placeholder-[#333] focus:border-[#f97316]/40 outline-none font-mono transition-colors" />
    </div>
  );
}

function ProfileCard({ profile }: any) {
  return (
    <div className="w-[340px] bg-[#080809] border-2 overflow-hidden" style={{ borderColor: profile.cardBorderColor, fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="relative h-24 bg-gradient-to-br from-[#111] to-[#0a0a0a] overflow-hidden">
        {profile.bannerUrl
          ? <img src={profile.bannerUrl} className="w-full h-full object-cover opacity-60" alt="banner" style={{ filter: profile.bannerBlur > 0 ? `blur(${profile.bannerBlur}px)` : undefined }} />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${profile.cardBorderColor}20 0%, transparent 60%)` }} />
        }
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#080809] to-transparent" />
      </div>
      <div className="px-5 -mt-8 relative z-10 flex items-end justify-between">
        <div className="relative">
          <img src={profile.avatarUrl} className="w-16 h-16 border-2 border-[#080809] object-cover rounded-full" alt="avatar" style={{ outline: `2px solid ${profile.cardBorderColor}40` }} />
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#080809] rounded-full" />
        </div>
        {profile.showViews && (
          <div className="flex items-center gap-1.5 mb-1 text-[#444]">
            <Eye className="h-3 w-3" />
            <span className="text-[10px] font-mono">{profile.views ?? 0}</span>
          </div>
        )}
      </div>
      <div className="px-5 pt-2 pb-5 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm">{profile.displayName || profile.username}</span>
            {profile.isVerified && <Shield className="h-3.5 w-3.5 text-blue-400" />}
          </div>
          <span className="text-[10px] text-[#444] font-mono">@{profile.username}</span>
        </div>
        {profile.bio && <p className="text-[11px] text-[#777] font-mono leading-relaxed">{profile.bio}</p>}
        {profile.showDiscord && profile.discordTag && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#5865F2]/10 border border-[#5865F2]/20">
            <span className="text-[10px] text-[#5865F2] font-mono">{profile.discordTag}</span>
          </div>
        )}
        {profile.links?.length > 0 && (
          <div className="space-y-1.5">
            {profile.links.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 border border-[#1a1a1f] hover:border-[#f97316]/30 text-[#666] hover:text-white transition-colors group">
                <span className="text-sm">{LINK_ICONS[link.icon] || "🔗"}</span>
                <span className="text-[11px] font-mono flex-1">{link.label}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}
        {/* ── Badges no card — com BadgeIcon ── */}
        {profile.showBadges && profile.badges?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.badges.map((b: any) => (
              <div
                key={b.id}
                className="flex items-center gap-1.5 px-2 py-1 border text-[9px] font-black font-mono uppercase tracking-widest"
                style={{ borderColor: `${b.color}40`, background: `${b.color}0d`, color: b.color }}
              >
                <BadgeIcon icon={b.icon} size={11} color={b.color} />
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 