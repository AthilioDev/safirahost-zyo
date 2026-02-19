import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Sparkles,
  Music,
  Image as LucideImage,
  Film,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#f97316", // Laranja brabo (padrão)
  "#ec4899", // Rosa hot pink
  "#8b5cf6", // Roxo vibrante
  "#3b82f6", // Azul safira
  "#10b981", // Verde esmeralda
  "#ef4444", // Vermelho fogo
  "#facc15", // Amarelo ouro
  "#ffffff", // Branco puro
];

const Editor = () => {
  const { user, profile: authProfile, signOut, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "links" | "badges" | "style" | "integrations">("profile");

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
  const [links, setLinks] = useState<{ id?: string; label: string; url: string; icon: string }[]>([]);

  // Apenas Discord por enquanto
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
        if (data) setLinks(data.map((l) => ({ id: l.id, label: l.label, url: l.url, icon: l.icon || "website" })));
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
          setEquippedBadgeIds(new Set(data.filter((ub: any) => ub.equipped).map((ub: any) => ub.badge_id)));
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
  };

  if (authLoading) return null;

  const tabs = [
    { id: "profile", label: "Perfil" },
    { id: "links", label: "Links" },
    { id: "badges", label: "Badges" },
    { id: "style", label: "Estilo" },
    { id: "integrations", label: "Integrações" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/40 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3 group">
          <Gem className="h-6 w-6 text-[#f97316] group-hover:scale-110 transition-transform" />
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">
            Safira
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to={`/${username}`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f97316] text-black font-bold hover:bg-[#fb923c] transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>

          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="p-2.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        <div className="flex-1 p-6 lg:p-10 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex justify-center">
              <div className="inline-flex gap-2 bg-black/50 backdrop-blur-lg border border-white/10 rounded-full p-1.5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-7 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeTab === t.id
                        ? "bg-white/15 text-white shadow-[inset_0_1px_4px_rgba(255,255,255,0.1)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-sm text-gray-400 mb-3 block font-medium">Avatar</label>
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img
                          src={avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`}
                          className="h-24 w-24 rounded-full object-cover border-4 border-white/10 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                        />
                      </div>
                      <label className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#f97316]/50 hover:bg-white/10 transition-all cursor-pointer text-sm font-medium">
                        <Camera className="h-5 w-5" />
                        Alterar avatar
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-3 block font-medium">Banner do Card</label>
                    <div className="relative h-32 rounded-2xl overflow-hidden border border-white/10 group shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
                      {bannerUrl ? (
                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#f97316]/5 via-black/80 to-black flex items-center justify-center">
                          <span className="text-gray-500">Sem banner</span>
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                        <Upload className="h-8 w-8 text-white" />
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Nome de exibição</label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 focus:ring-2 focus:ring-[#f97316]/20 outline-none transition-all"
                      placeholder="Seu nome visível"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Username</label>
                    <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-[#f97316]/50 transition-all">
                      <span className="inline-flex items-center px-5 py-4 bg-black/60 text-gray-500 text-sm">
                        safirahost.xyz/
                      </span>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className="flex-1 px-5 py-4 bg-black/40 text-white placeholder-gray-500 outline-none"
                        placeholder="seuusername"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={200}
                      rows={4}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 focus:ring-2 focus:ring-[#f97316]/20 outline-none resize-none transition-all"
                      placeholder="Fale um pouco sobre você..."
                    />
                    <p className="text-xs text-gray-500 mt-2 text-right">{bio.length}/200</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Discord Tag</label>
                    <input
                      value={discordTag}
                      onChange={(e) => setDiscordTag(e.target.value)}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 focus:ring-2 focus:ring-[#f97316]/20 outline-none transition-all"
                      placeholder="seuusuario#1234"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-[#f97316]" />
                    Personalização Avançada
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                        <Music className="h-4 w-4" /> Música de fundo
                      </label>
                      <input
                        value={songUrl}
                        onChange={(e) => setSongUrl(e.target.value)}
                        placeholder="Link direto .mp3 / .ogg"
                        className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#f97316]/50 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                        <LucideImage className="h-4 w-4" /> Imagem de fundo
                      </label>
                      <input
                        value={backgroundUrl}
                        onChange={(e) => setBackgroundUrl(e.target.value)}
                        placeholder="Link da imagem"
                        className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#f97316]/50 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                        <Film className="h-4 w-4" /> Video de fundo
                      </label>
                      <input
                        value={backgroundVideoUrl}
                        onChange={(e) => setBackgroundVideoUrl(e.target.value)}
                        placeholder="Link do video"
                        className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#f97316]/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <h3 className="text-xl font-bold mb-5">Visibilidade</h3>
                  <div className="space-y-5">
                    {[
                      { label: "Mostrar Discord Tag", value: showDiscord, setter: setShowDiscord },
                      { label: "Mostrar Badges", value: showBadges, setter: setShowBadges },
                      { label: "Mostrar Contador de Views", value: showViews, setter: setShowViews },
                    ].map((item) => (
                      <label key={item.label} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-gray-300 group-hover:text-white transition-colors text-base">
                          {item.label}
                        </span>
                        <div
                          onClick={() => item.setter(!item.value)}
                          className={`w-14 h-7 rounded-full transition-colors duration-300 ease-in-out flex items-center p-1 ${
                            item.value ? "bg-[#f97316]" : "bg-gray-700"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                              item.value ? "translate-x-7" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "links" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Seus Links</h3>
                  <button
                    onClick={addLink}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-sm font-medium transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar link
                  </button>
                </div>

                {links.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-black/30">
                    <p className="text-gray-400 text-lg">Nenhum link adicionado ainda</p>
                    <p className="text-gray-500 mt-2">Clique em "Adicionar link" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {links.map((link, index) => (
                      <div
                        key={index}
                        className="p-5 bg-black/40 border border-white/10 rounded-2xl hover:border-white/30 transition-all duration-300"
                      >
                        <div className="flex gap-4 mb-4">
                          <select
                            value={link.icon}
                            onChange={(e) => updateLink(index, "icon", e.target.value)}
                            className="px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-gray-300 text-sm min-w-[140px]"
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
                            placeholder="Nome do link (ex: Meu Instagram)"
                            className="flex-1 px-5 py-3 bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 outline-none"
                          />

                          <button
                            onClick={() => removeLink(index)}
                            className="p-3 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        <input
                          value={link.url}
                          onChange={(e) => updateLink(index, "url", e.target.value)}
                          placeholder="https://..."
                          className="w-full px-5 py-3 bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "badges" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <h3 className="text-xl font-bold">Suas Badges Equipadas</h3>

                {userBadges.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-black/30">
                    <p className="text-gray-400 text-lg">Você ainda não possui badges</p>
                    <p className="text-gray-500 mt-2">Badges são concedidas pela equipe Safira</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {userBadges.map((ub: any) => {
                      const badge = ub.badges;
                      const isEquipped = equippedBadgeIds.has(ub.badge_id);

                      return (
                        <motion.button
                          key={ub.id}
                          whileHover={{ scale: 1.03, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleBadgeEquip(ub.badge_id)}
                          className={`p-5 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${
                            isEquipped
                              ? "bg-[#f97316]/10 border-[#f97316]/40 shadow-[0_0_25px_rgba(249,115,22,0.25)]"
                              : "bg-black/40 border-white/10 hover:border-white/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <BadgeIcon icon={badge.icon} color={badge.color} size={32} />
                            <div className="flex-1 text-left">
                              <p className="font-medium text-white truncate">{badge.name}</p>
                              <p className="text-sm text-gray-400 truncate mt-0.5">{badge.description}</p>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isEquipped ? "border-[#f97316] bg-[#f97316]/20" : "border-gray-600"
                              }`}
                            >
                              {isEquipped && <span className="text-[#f97316] text-xs font-bold">✓</span>}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {allBadges.length > 0 && (
                  <div className="pt-8">
                    <h3 className="text-xl font-bold mb-6">Badges Disponíveis</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allBadges.map((badge) => {
                        const owned = userBadges.some((ub: any) => ub.badge_id === badge.id);
                        return (
                          <div
                            key={badge.id}
                            className={`p-4 rounded-xl border text-center transition-all ${
                              owned
                                ? "border-[#f97316]/30 bg-[#f97316]/5"
                                : "border-white/10 bg-black/40 opacity-50"
                            }`}
                          >
                            <BadgeIcon icon={badge.icon} color={badge.color} size={28} className="mx-auto mb-3" />
                            <p className="text-sm font-medium">{badge.name}</p>
                            {!owned && <p className="text-xs text-gray-600 mt-1">🔒</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "style" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div>
                  <h3 className="text-xl font-bold mb-6">Modelo do Card</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {CARD_TEMPLATES.map((t) => (
                      <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCardTemplate(t.id)}
                        className={`p-6 rounded-2xl border text-center transition-all duration-300 ${
                          cardTemplate === t.id
                            ? "bg-[#f97316]/10 border-[#f97316]/40 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                            : "bg-black/40 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <p className="font-medium text-white">{t.label}</p>
                        <p className="text-xs text-gray-400 mt-2">{t.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-6">Efeito do Perfil</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {EFFECT_OPTIONS.map((eff) => (
                      <motion.button
                        key={eff.id}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setProfileEffect(eff.id)}
                        className={`p-6 rounded-2xl border text-center transition-all duration-300 ${
                          profileEffect === eff.id
                            ? "bg-[#f97316]/10 border-[#f97316]/40 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                            : "bg-black/40 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <p className="text-3xl mb-3">{eff.emoji}</p>
                        <p className="text-sm font-medium">{eff.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="text-[#f97316]">Cor da Borda do Card</span>
                  </h3>

                  <div className="space-y-8">
                    <div>
                      <label className="text-base text-gray-300 mb-3 block">Escolha a cor da borda</label>
                      <div className="flex items-center gap-6">
                        <input
                          type="color"
                          value={cardBorderColor}
                          onChange={(e) => setCardBorderColor(e.target.value)}
                          className="w-20 h-20 rounded-xl cursor-pointer border-2 border-white/20 bg-transparent shadow-md"
                        />
                        <div className="text-sm">
                          <p className="text-gray-400">Cor atual:</p>
                          <p className="font-mono text-white mt-1">{cardBorderColor}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-base text-gray-300 mb-3 block">Cores rápidas</label>
                      <div className="flex flex-wrap gap-4">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setCardBorderColor(color)}
                            className={`w-14 h-14 rounded-xl border-2 transition-all duration-200 ${
                              cardBorderColor === color
                                ? "border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                : "border-transparent hover:scale-110 hover:shadow-md"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <p className="text-base text-gray-300 mb-3">Como vai ficar a borda:</p>
                      <div
                        className="h-32 rounded-2xl border-4 bg-black/50 flex items-center justify-center text-gray-400 text-lg font-medium"
                        style={{ borderColor: cardBorderColor }}
                      >
                        Borda na cor escolhida
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "integrations" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <h3 className="text-xl font-bold">Integrações</h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Discord User ID</label>
                    <input
                      value={discordUserId}
                      onChange={(e) => setDiscordUserId(e.target.value.trim())}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 focus:ring-2 focus:ring-[#f97316]/20 outline-none transition-all"
                      placeholder="Ex: 200207310625177602"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Copie seu ID do Discord (clique direito no seu nome → Copiar ID de usuário)
                    </p>
                  </div>

                  {/* Campos desativados/comentados por enquanto */}
                  {/* 
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Spotify Client ID</label>
                    <input
                      value={spotifyClientId}
                      onChange={(e) => setSpotifyClientId(e.target.value)}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 outline-none transition-all opacity-50 cursor-not-allowed"
                      placeholder="Ex: dd3631db64a24da8a1d5bba2ea489a6e"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#f97316]/50 outline-none transition-all opacity-50 cursor-not-allowed"
                      placeholder="Ex: seuemail@gmail.com"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Spotify Access Token</label>
                    <div className="flex items-center gap-4">
                      <input
                        value={spotifyAccessToken}
                        readOnly
                        className="flex-1 px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 opacity-50 cursor-not-allowed"
                        placeholder="Autentique para obter"
                        disabled
                      />
                      <button
                        disabled
                        className="px-6 py-4 rounded-xl bg-[#f97316]/30 text-black font-bold cursor-not-allowed opacity-50"
                      >
                        Autenticar Spotify
                      </button>
                    </div>
                  </div>
                  */}

                  <div className="pt-6 border-t border-white/10">
                    <p className="text-sm text-gray-500">
                      Em breve: integração com Spotify, GitHub, Steam e mais...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="hidden lg:block lg:w-[560px] border-l border-white/5 bg-gradient-to-br from-black via-[#0a0a0a] to-black p-10">
          <div className="sticky top-10">
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
              <ProfileCard profile={previewProfile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;