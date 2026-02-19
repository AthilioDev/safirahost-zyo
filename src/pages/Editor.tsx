import { useState, useEffect } from "react";
import { ProfileCard, CARD_TEMPLATES } from "@/components/ProfileCard";
import { EFFECT_OPTIONS } from "@/components/ProfileEffects";
import { BadgeIcon } from "@/components/BadgeIcon";
import {
  Save,
  Plus,
  Trash2,
  Eye,
  Gem,
  LogOut,
  Upload,
  Camera,
  Music,
  Image as LucideImage,
  Film,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#facc15",
  "#ffffff",
];

const Editor = () => {
  const { user, profile: authProfile, signOut, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "links" | "badges" | "style" | "advanced" | "integrations"
  >("profile");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [discordTag, setDiscordTag] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [cardTemplate, setCardTemplate] = useState("classic");
  const [profileEffect, setProfileEffect] = useState("none");
  const [cardBorderColor, setCardBorderColor] = useState("#f97316");
  const [showDiscord, setShowDiscord] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showViews, setShowViews] = useState(true);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [bannerBlur, setBannerBlur] = useState(0);
  const [links, setLinks] = useState<{ id?: string; label: string; url: string; icon: string }[]>([]);

  const [discordUserId, setDiscordUserId] = useState("");

  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [equippedBadgeIds, setEquippedBadgeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authProfile) {
      setDisplayName(authProfile.display_name || "");
      setUsername(authProfile.username || "");
      setBio(authProfile.bio || "");
      setDiscordTag(authProfile.discord_tag || "");
      setAvatarUrl(authProfile.avatar_url || "");
      setBannerUrl(authProfile.banner_url || "");
      setCardTemplate(authProfile.card_template || "classic");
      setProfileEffect(authProfile.profile_effect || "none");
      setCardBorderColor(authProfile.card_border_color || "#f97316");
      setShowDiscord(authProfile.show_discord ?? true);
      setShowBadges(authProfile.show_badges ?? true);
      setShowViews(authProfile.show_views ?? true);
      setBackgroundUrl((authProfile as any).background_url || "");
      setBackgroundVideoUrl((authProfile as any).background_video_url || "");
      setSongUrl((authProfile as any).song_url || "");
      setBannerBlur((authProfile as any).banner_blur ?? 0);
      setDiscordUserId(authProfile.discord_user_id || "");
    }
  }, [authProfile]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("social_links")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .then(({ data }) => {
        if (data)
          setLinks(
            data.map((l) => ({ id: l.id, label: l.label, url: l.url, icon: l.icon || "website" }))
          );
      });

    supabase.from("badges").select("*").then(({ data }) => {
      if (data) setAllBadges(data);
    });

    supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setUserBadges(data);
          setEquippedBadgeIds(
            new Set(data.filter((ub: any) => ub.equipped).map((ub: any) => ub.badge_id))
          );
        }
      });
  }, [user]);

  const uploadFile = async (file: File, bucket: string) => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      toast.error("Falha no upload");
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "avatars");
    if (url) setAvatarUrl(url);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "banners");
    if (url) setBannerUrl(url);
  };

  const toggleBadgeEquip = (badgeId: string) => {
    setEquippedBadgeIds((prev) => {
      const next = new Set(prev);
      next.has(badgeId) ? next.delete(badgeId) : next.add(badgeId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        username,
        bio,
        discord_tag: discordTag,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        card_template: cardTemplate,
        profile_effect: profileEffect,
        card_border_color: cardBorderColor,
        show_discord: showDiscord,
        show_badges: showBadges,
        show_views: showViews,
        background_url: backgroundUrl,
        background_video_url: backgroundVideoUrl,
        song_url: songUrl,
        banner_blur: bannerBlur,
        discord_user_id: discordUserId.trim() || null,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    await supabase.from("social_links").delete().eq("user_id", user.id);
    if (links.length > 0) {
      await supabase.from("social_links").insert(
        links.map((l, i) => ({
          user_id: user.id,
          label: l.label,
          url: l.url,
          icon: l.icon,
          sort_order: i,
        }))
      );
    }

    for (const ub of userBadges) {
      const shouldEquip = equippedBadgeIds.has(ub.badge_id);
      if (ub.equipped !== shouldEquip) {
        await supabase.from("user_badges").update({ equipped: shouldEquip }).eq("id", ub.id);
      }
    }

    await refreshProfile();
    toast.success("Perfil salvo com sucesso!");
    setSaving(false);
  };

  const addLink = () => setLinks([...links, { label: "Novo Link", url: "https://", icon: "website" }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: string, value: string) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

  const equippedBadges = userBadges
    .filter((ub: any) => equippedBadgeIds.has(ub.badge_id))
    .map((ub: any) => ({
      id: ub.badges.id,
      name: ub.badges.name,
      icon: ub.badges.icon,
      color: ub.badges.color,
      description: ub.badges.description,
    }));

  const previewProfile = {
    username,
    displayName,
    bio,
    avatar: avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`,
    banner: bannerUrl || undefined,
    discordTag,
    status: "online" as const,
    isVerified: authProfile?.is_verified || false,
    views: authProfile?.views || 0,
    links: links.map((l) => ({ label: l.label, url: l.url, icon: l.icon })),
    badges: equippedBadges,
    cardTemplate,
    profileEffect,
    cardBorderColor,
    showDiscord,
    showBadges,
    showViews,
    backgroundUrl: backgroundUrl || undefined,
    backgroundVideoUrl: backgroundVideoUrl || undefined,
    songUrl: songUrl || undefined,
    bannerBlur,
  };

  if (authLoading) return null;

  const tabs = [
    { id: "profile",      label: "Perfil" },
    { id: "links",        label: "Links" },
    { id: "badges",       label: "Badges" },
    { id: "style",        label: "Estilo" },
    { id: "advanced",     label: "Personalização Avançada" },
    { id: "integrations", label: "Integrações" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono">

      {/* ── HEADER ── */}
      <header className="border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between bg-[#080808] sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-[#f97316]" />
          <span className="font-black text-lg tracking-widest text-[#f97316] uppercase">Safira</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/${username}`}
            className="flex items-center gap-2 text-xs text-[#555] hover:text-[#999] transition-colors uppercase tracking-widest"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#f97316] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e06210] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar"}
          </button>

          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="p-2 hover:bg-[#111] transition-colors"
          >
            <LogOut className="h-4 w-4 text-[#444] hover:text-[#888]" />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-49px)]">

        {/* ── LEFT PANEL ── */}
        <div className="flex-1 p-6 lg:p-10 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-8">

            {/* ── TABS ── */}
            <div className="flex flex-wrap border-b border-[#1a1a1a]">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                    activeTab === t.id
                      ? "border-[#f97316] text-[#f97316]"
                      : "border-transparent text-[#444] hover:text-[#888]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ═══════════════════════════════════════
                TAB: PERFIL
            ═══════════════════════════════════════ */}
            {activeTab === "profile" && (
              <div className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Avatar</label>
                    <div className="flex items-center gap-4">
                      <img
                        src={avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`}
                        className="h-20 w-20 object-cover border border-[#1a1a1a] grayscale"
                      />
                      <label className="flex items-center gap-2 px-4 py-2.5 border border-[#222] text-[#666] hover:border-[#444] hover:text-[#999] transition-colors cursor-pointer text-xs uppercase tracking-widest">
                        <Camera className="h-3.5 w-3.5" />
                        Alterar
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#444] mb-3 block">Banner do Card</label>
                    <div className="relative h-28 border border-[#1a1a1a] group overflow-hidden">
                      {bannerUrl ? (
                        <img
                          src={bannerUrl}
                          alt="Banner"
                          className="w-full h-full object-cover grayscale opacity-60"
                          style={{
                            filter: `grayscale(1) opacity(0.6)${bannerBlur > 0 ? ` blur(${bannerBlur}px)` : ""}`,
                            transform: bannerBlur > 0 ? "scale(1.08)" : "scale(1)",
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#0d0d0d] flex items-center justify-center">
                          <span className="text-[#2a2a2a] text-xs uppercase tracking-widest">Sem banner</span>
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="h-6 w-6 text-[#555]" />
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Nome de exibição</label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                      placeholder="Seu nome visível"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Username</label>
                    <div className="flex border border-[#1a1a1a] focus-within:border-[#f97316] transition-colors">
                      <span className="inline-flex items-center px-4 py-3 bg-[#0a0a0a] text-[#333] text-xs border-r border-[#1a1a1a]">
                        safirahost.xyz/
                      </span>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className="flex-1 px-4 py-3 bg-[#0d0d0d] text-white text-sm placeholder-[#333] outline-none font-mono"
                        placeholder="seuusername"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={200}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm placeholder-[#333] focus:border-[#f97316] outline-none resize-none font-mono transition-colors"
                      placeholder="Fale um pouco sobre você..."
                    />
                    <p className="text-[10px] text-[#333] mt-1 text-right">{bio.length}/200</p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Discord Tag</label>
                    <input
                      value={discordTag}
                      onChange={(e) => setDiscordTag(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                      placeholder="seuusuario#1234"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════
                TAB: LINKS
            ═══════════════════════════════════════ */}
            {activeTab === "links" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#444]">Seus Links</h3>
                  <button
                    onClick={addLink}
                    className="flex items-center gap-2 px-4 py-2 border border-[#222] text-[#555] hover:border-[#444] hover:text-[#999] text-xs uppercase tracking-widest transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </button>
                </div>

                {links.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-[#1a1a1a]">
                    <p className="text-[#333] text-xs uppercase tracking-widest">Nenhum link adicionado</p>
                    <p className="text-[#222] text-xs mt-2">Clique em "Adicionar" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {links.map((link, index) => (
                      <div
                        key={index}
                        className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors"
                      >
                        <div className="flex gap-3 mb-3">
                          <select
                            value={link.icon}
                            onChange={(e) => updateLink(index, "icon", e.target.value)}
                            className="px-3 py-2.5 bg-[#111] border border-[#1a1a1a] text-[#666] text-xs font-mono min-w-[130px] outline-none focus:border-[#f97316] transition-colors"
                          >
                            <option value="website">🌐 Website</option>
                            <option value="github">🗽 GitHub</option>
                            <option value="twitter">❌ Twitter</option>
                            <option value="instagram">🤓 Instagram</option>
                            <option value="discord">🥴 Discord</option>
                          </select>

                          <input
                            value={link.label}
                            onChange={(e) => updateLink(index, "label", e.target.value)}
                            placeholder="Nome do link"
                            className="flex-1 px-4 py-2.5 bg-[#111] border border-[#1a1a1a] text-white text-sm placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                          />

                          <button
                            onClick={() => removeLink(index)}
                            className="p-2.5 border border-[#1a1a1a] hover:border-red-900/40 text-[#444] hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <input
                          value={link.url}
                          onChange={(e) => updateLink(index, "url", e.target.value)}
                          placeholder="https://..."
                          className="w-full px-4 py-2.5 bg-[#111] border border-[#1a1a1a] text-white text-sm placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════
                TAB: BADGES
            ═══════════════════════════════════════ */}
            {activeTab === "badges" && (
              <div className="space-y-8">
                <h3 className="text-[10px] uppercase tracking-widest text-[#444]">Suas Badges Equipadas</h3>

                {userBadges.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-[#1a1a1a]">
                    <p className="text-[#333] text-xs uppercase tracking-widest">Nenhuma badge</p>
                    <p className="text-[#222] text-xs mt-2">Badges são concedidas pela equipe Safira</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {userBadges.map((ub: any) => {
                      const badge = ub.badges;
                      const isEquipped = equippedBadgeIds.has(ub.badge_id);
                      return (
                        <button
                          key={ub.id}
                          onClick={() => toggleBadgeEquip(ub.badge_id)}
                          className={`p-4 border text-left transition-colors ${
                            isEquipped
                              ? "border-[#f97316]/40 bg-[#f97316]/5"
                              : "border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <BadgeIcon icon={badge.icon} color={badge.color} size={28} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono text-white truncate">{badge.name}</p>
                              <p className="text-xs text-[#444] truncate mt-0.5 font-mono">{badge.description}</p>
                            </div>
                            <div
                              className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${
                                isEquipped ? "border-[#f97316] bg-[#f97316]/20" : "border-[#333]"
                              }`}
                            >
                              {isEquipped && <span className="text-[#f97316] text-[8px] font-black">✓</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {allBadges.length > 0 && (
                  <div className="pt-6 border-t border-[#111]">
                    <h3 className="text-[10px] uppercase tracking-widest text-[#444] mb-5">Badges Disponíveis</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {allBadges.map((badge) => {
                        const owned = userBadges.some((ub: any) => ub.badge_id === badge.id);
                        return (
                          <div
                            key={badge.id}
                            className={`p-3 border text-center transition-colors ${
                              owned
                                ? "border-[#f97316]/20 bg-[#0d0d0d]"
                                : "border-[#111] bg-[#080808] opacity-40"
                            }`}
                          >
                            <BadgeIcon icon={badge.icon} color={badge.color} size={24} className="mx-auto mb-2" />
                            <p className="text-xs font-mono text-[#666]">{badge.name}</p>
                            {!owned && <p className="text-[10px] text-[#2a2a2a] mt-0.5">🔒</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════
                TAB: ESTILO
            ═══════════════════════════════════════ */}
            {activeTab === "style" && (
              <div className="space-y-8">

                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-[#444] mb-5">Modelo do Card</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {CARD_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setCardTemplate(t.id)}
                        className={`p-4 border text-center transition-colors ${
                          cardTemplate === t.id
                            ? "border-[#f97316]/50 bg-[#f97316]/5"
                            : "border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]"
                        }`}
                      >
                        <p className="text-sm font-mono text-white">{t.label}</p>
                        <p className="text-[10px] text-[#444] mt-1.5 font-mono">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-[#111]">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#444] mb-5">Efeito do Perfil</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {EFFECT_OPTIONS.map((eff) => (
                      <button
                        key={eff.id}
                        onClick={() => setProfileEffect(eff.id)}
                        className={`p-4 border text-center transition-colors ${
                          profileEffect === eff.id
                            ? "border-[#f97316]/50 bg-[#f97316]/5"
                            : "border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]"
                        }`}
                      >
                        <p className="text-2xl mb-2">{eff.emoji}</p>
                        <p className="text-xs font-mono text-[#666]">{eff.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-[#111]">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#444] mb-6">Cor da Borda do Card</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs text-[#555] mb-3 block uppercase tracking-widest">Cor personalizada</label>
                      <div className="flex items-center gap-5">
                        <input
                          type="color"
                          value={cardBorderColor}
                          onChange={(e) => setCardBorderColor(e.target.value)}
                          className="w-14 h-14 cursor-pointer border border-[#1a1a1a] bg-transparent"
                        />
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[#444]">Cor atual</p>
                          <p className="font-mono text-sm text-white mt-1">{cardBorderColor}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[#555] mb-3 block uppercase tracking-widest">Cores rápidas</label>
                      <div className="flex flex-wrap gap-3">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setCardBorderColor(color)}
                            className={`w-10 h-10 border-2 transition-all ${
                              cardBorderColor === color
                                ? "border-white scale-110"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#444] mb-3">Preview da borda</p>
                      <div
                        className="h-24 border-2 bg-[#0a0a0a] flex items-center justify-center"
                        style={{ borderColor: cardBorderColor }}
                      >
                        <span className="text-[#333] text-xs uppercase tracking-widest font-mono">
                          Borda na cor escolhida
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════
                TAB: PERSONALIZAÇÃO AVANÇADA
                — Mídia de Fundo
                — Visibilidade
                — Desfoque do Banner
            ═══════════════════════════════════════ */}
            {activeTab === "advanced" && (
              <div className="space-y-0">

                {/* ── MÍDIA DE FUNDO ── */}
                <div className="pb-10">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-6">
                    Mídia de Fundo
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 flex items-center gap-2 block">
                        <Music className="h-3 w-3" />
                        Música de fundo
                      </label>
                      <input
                        value={songUrl}
                        onChange={(e) => setSongUrl(e.target.value)}
                        placeholder="Link direto .mp3 / .ogg"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-sm text-white placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 flex items-center gap-2 block">
                        <LucideImage className="h-3 w-3" />
                        Imagem de fundo
                      </label>
                      <input
                        value={backgroundUrl}
                        onChange={(e) => setBackgroundUrl(e.target.value)}
                        placeholder="Link da imagem"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-sm text-white placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 flex items-center gap-2 block">
                        <Film className="h-3 w-3" />
                        Video de fundo
                      </label>
                      <input
                        value={backgroundVideoUrl}
                        onChange={(e) => setBackgroundVideoUrl(e.target.value)}
                        placeholder="Link do video"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-sm text-white placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* ── VISIBILIDADE ── */}
                <div className="py-10 border-t border-[#111]">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-6">
                    Visibilidade
                  </h3>
                  <div className="space-y-5">
                    {[
                      { label: "Mostrar Discord Tag",       value: showDiscord, setter: setShowDiscord },
                      { label: "Mostrar Badges",            value: showBadges,  setter: setShowBadges  },
                      { label: "Mostrar Contador de Views", value: showViews,   setter: setShowViews   },
                    ].map((item) => (
                      <label key={item.label} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs text-[#666] group-hover:text-[#999] transition-colors uppercase tracking-widest">
                          {item.label}
                        </span>
                        <div
                          onClick={() => item.setter(!item.value)}
                          className={`w-10 h-5 transition-colors duration-200 flex items-center px-0.5 ${
                            item.value ? "bg-[#f97316]" : "bg-[#1a1a1a]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white transform transition-transform duration-200 ${
                              item.value ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── DESFOQUE DO BANNER ── */}
                <div className="pt-10 border-t border-[#111] space-y-6">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-[#f97316] mb-1">
                      Desfoque do Banner
                    </h3>
                    <p className="text-xs text-[#333] font-mono">
                      Controla o desfoque da imagem do banner dentro do card de perfil.
                    </p>
                  </div>

                  {/* Número grande */}
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-black text-white tabular-nums leading-none">
                      {bannerBlur}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-[#444] pb-2">px</span>
                  </div>

                  {/* Slider */}
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={bannerBlur}
                      onChange={(e) => setBannerBlur(Number(e.target.value))}
                      className="w-full h-1.5 appearance-none outline-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f97316 0%, #f97316 ${
                          (bannerBlur / 20) * 100
                        }%, #1a1a1a ${(bannerBlur / 20) * 100}%, #1a1a1a 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-[#333] uppercase tracking-widest font-mono">
                      <span>0 — Nítido</span>
                      <span>20 — Máximo</span>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Off",   value: 0  },
                      { label: "Suave", value: 4  },
                      { label: "Médio", value: 10 },
                      { label: "Forte", value: 20 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setBannerBlur(preset.value)}
                        className={`py-3 text-xs font-mono uppercase tracking-widest border transition-colors ${
                          bannerBlur === preset.value
                            ? "border-[#f97316]/50 text-[#f97316] bg-[#f97316]/5"
                            : "border-[#1a1a1a] text-[#444] hover:border-[#2a2a2a] hover:text-[#666]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Preview do blur no banner */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#444] mb-3">
                      Preview — Banner do card
                    </p>
                    <div className="relative h-28 overflow-hidden border border-[#1a1a1a]">
                      {bannerUrl ? (
                        <img
                          src={bannerUrl}
                          alt="preview banner"
                          className="w-full h-full object-cover"
                          style={{
                            filter: bannerBlur > 0 ? `blur(${bannerBlur}px)` : "none",
                            transform: bannerBlur > 0 ? "scale(1.08)" : "scale(1)",
                            transition: "filter 0.2s, transform 0.2s",
                          }}
                        />
                      ) : (
                        <>
                          {/* Fundo simulado quando sem banner */}
                          <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-40">
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: PRESET_COLORS[i] }}
                              />
                            ))}
                          </div>
                          <div
                            className="absolute inset-0"
                            style={{
                              backdropFilter: bannerBlur > 0 ? `blur(${bannerBlur}px)` : "none",
                              background: "rgba(10,10,10,0.3)",
                            }}
                          />
                        </>
                      )}
                      <div className="absolute bottom-2 left-3">
                        <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                          {bannerBlur === 0 ? "Sem desfoque" : `Desfoque: ${bannerBlur}px`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════
                TAB: INTEGRAÇÕES
            ═══════════════════════════════════════ */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h3 className="text-[10px] uppercase tracking-widest text-[#444]">Integrações</h3>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#444] mb-2 block">Discord User ID</label>
                    <input
                      value={discordUserId}
                      onChange={(e) => setDiscordUserId(e.target.value.trim())}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm placeholder-[#333] focus:border-[#f97316] outline-none font-mono transition-colors"
                      placeholder="Ex: 200207310625177602"
                    />
                    <p className="text-[10px] text-[#333] mt-2 font-mono">
                      Clique direito no seu nome → Copiar ID de usuário
                    </p>
                  </div>

                  <div className="pt-5 border-t border-[#111]">
                    <p className="text-xs text-[#2a2a2a] font-mono uppercase tracking-widest">
                      Em breve: Spotify, GitHub, Steam...
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT PANEL: PREVIEW ── */}
        <div className="hidden lg:block lg:w-[520px] border-l border-[#111] bg-[#040404] p-10">
          <div className="sticky top-10">
            <p className="text-[10px] uppercase tracking-widest text-[#333] mb-5 font-mono">Preview</p>
            <div className="border border-[#1a1a1a] overflow-hidden">
              <ProfileCard profile={previewProfile} />
            </div>
          </div>
        </div>

      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #050505;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #050505;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
};

export default Editor;
