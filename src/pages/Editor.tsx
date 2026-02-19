import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProfileCard, CARD_TEMPLATES } from "@/components/ProfileCard";
import { EFFECT_OPTIONS } from "@/components/ProfileEffects";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Save, Plus, Trash2, Eye, Gem, LogOut, Upload, Camera, Sparkles, Music, Image, Film } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Editor = () => {
  const { user, profile: authProfile, signOut, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "links" | "badges" | "style">("profile");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [discordTag, setDiscordTag] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [cardTemplate, setCardTemplate] = useState("classic");
  const [profileEffect, setProfileEffect] = useState("none");
  const [showDiscord, setShowDiscord] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showViews, setShowViews] = useState(true);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [links, setLinks] = useState<{ id?: string; label: string; url: string; icon: string }[]>([]);

  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [equippedBadgeIds, setEquippedBadgeIds] = useState<Set<string>>(new Set());

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading]);

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
      setShowDiscord(authProfile.show_discord ?? true);
      setShowBadges(authProfile.show_badges ?? true);
      setShowViews(authProfile.show_views ?? true);
      setBackgroundUrl((authProfile as any).background_url || "");
      setBackgroundVideoUrl((authProfile as any).background_video_url || "");
      setSongUrl((authProfile as any).song_url || "");
    }
  }, [authProfile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("social_links").select("*").eq("user_id", user.id).order("sort_order")
      .then(({ data }) => { if (data) setLinks(data.map(l => ({ id: l.id, label: l.label, url: l.url, icon: l.icon || "website" }))); });
    supabase.from("badges").select("*").then(({ data }) => { if (data) setAllBadges(data); });
    supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id)
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
    if (error) { toast.error("Upload failed"); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadFile(file, "avatars"); if (url) setAvatarUrl(url);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadFile(file, "banners"); if (url) setBannerUrl(url);
  };

  const toggleBadgeEquip = (badgeId: string) => {
    setEquippedBadgeIds(prev => { const next = new Set(prev); next.has(badgeId) ? next.delete(badgeId) : next.add(badgeId); return next; });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName, username, bio, discord_tag: discordTag,
      avatar_url: avatarUrl, banner_url: bannerUrl, card_template: cardTemplate,
      profile_effect: profileEffect, show_discord: showDiscord, show_badges: showBadges,
      show_views: showViews, background_url: backgroundUrl,
      background_video_url: backgroundVideoUrl, song_url: songUrl,
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
    setSaving(false);
  };

  const addLink = () => setLinks([...links, { label: "Novo Link", url: "https://", icon: "website" }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: string, value: string) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

  const equippedBadges = userBadges
    .filter((ub: any) => equippedBadgeIds.has(ub.badge_id))
    .map((ub: any) => ({ id: ub.badges.id, name: ub.badges.name, icon: ub.badges.icon, color: ub.badges.color, description: ub.badges.description }));

  const previewProfile = {
    username, displayName, bio,
    avatar: avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`,
    banner: bannerUrl || undefined,
    discordTag, status: "online" as const,
    isVerified: authProfile?.is_verified || false, views: authProfile?.views || 0,
    links: links.map(l => ({ label: l.label, url: l.url, icon: l.icon })),
    badges: equippedBadges, cardTemplate, profileEffect, showDiscord, showBadges, showViews,
    backgroundUrl: backgroundUrl || undefined,
    backgroundVideoUrl: backgroundVideoUrl || undefined,
    songUrl: songUrl || undefined,
  };

  if (authLoading) return null;

  const tabs = [
    { id: "profile" as const, label: "Perfil" },
    { id: "links" as const, label: "Links" },
    { id: "badges" as const, label: "Badges" },
    { id: "style" as const, label: "Estilo" },
  ];

  const inputClass = "w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-primary" /><span className="font-bold gradient-text">Safira</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to={`/${username}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Eye className="h-4 w-4" /> Preview
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
          </button>
          <button onClick={() => { signOut(); navigate("/"); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-57px)]">
        {/* Editor Panel */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 bg-surface rounded-lg p-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Avatar */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Avatar</label>
                  <div className="flex items-center gap-4">
                    <img src={avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id}`}
                      className="h-16 w-16 rounded-full object-cover border-2 border-border" />
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-sm cursor-pointer hover:bg-surface-hover transition-colors">
                      <Camera className="h-4 w-4" /> Trocar avatar
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Banner do Card</label>
                  <div className="relative h-24 rounded-lg overflow-hidden border border-border">
                    {bannerUrl ? <img src={bannerUrl} className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Sem banner</span>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="h-5 w-5 text-foreground" />
                      <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome de Exibição</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Username</label>
                  <div className="flex items-center gap-0">
                    <span className="px-3 py-2 rounded-l-lg bg-muted border border-r-0 border-border text-sm text-muted-foreground">safirahost.xyz/</span>
                    <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="flex-1 px-3 py-2 rounded-r-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200} className={inputClass + " resize-none"} />
                  <p className="text-xs text-muted-foreground mt-1">{bio.length}/200</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Discord Tag</label>
                  <input value={discordTag} onChange={e => setDiscordTag(e.target.value)} className={inputClass} />
                </div>

                {/* Music & Background section */}
                <div className="pt-2 border-t border-border space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Personalização</h3>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-2">
                      <Music className="h-3.5 w-3.5" /> URL da Música
                    </label>
                    <input value={songUrl} onChange={e => setSongUrl(e.target.value)} placeholder="https://exemplo.com/musica.mp3" className={inputClass} />
                    <p className="text-xs text-muted-foreground mt-1">Link direto para um arquivo .mp3 ou .ogg</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-2">
                      <Image className="h-3.5 w-3.5" /> Fundo da Página (imagem)
                    </label>
                    <input value={backgroundUrl} onChange={e => setBackgroundUrl(e.target.value)} placeholder="https://exemplo.com/fundo.jpg" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-2">
                      <Film className="h-3.5 w-3.5" /> Fundo da Página (vídeo)
                    </label>
                    <input value={backgroundVideoUrl} onChange={e => setBackgroundVideoUrl(e.target.value)} placeholder="https://exemplo.com/fundo.mp4" className={inputClass} />
                    <p className="text-xs text-muted-foreground mt-1">O vídeo tem prioridade sobre a imagem de fundo.</p>
                  </div>
                </div>

                {/* Visibility Toggles */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <h3 className="text-sm font-semibold">Visibilidade</h3>
                  {[
                    { label: "Mostrar Discord", value: showDiscord, setter: setShowDiscord },
                    { label: "Mostrar Badges", value: showBadges, setter: setShowBadges },
                    { label: "Mostrar Views", value: showViews, setter: setShowViews },
                  ].map(toggle => (
                    <label key={toggle.label} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-muted-foreground">{toggle.label}</span>
                      <button onClick={() => toggle.setter(!toggle.value)}
                        className={`w-10 h-5 rounded-full transition-colors ${toggle.value ? "bg-primary" : "bg-muted"}`}>
                        <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${toggle.value ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Links Tab */}
            {activeTab === "links" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Links</h3>
                  <button onClick={addLink} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>
                {links.map((link, i) => (
                  <motion.div key={i} layout className="space-y-2 p-3 rounded-lg bg-surface border border-border">
                    <div className="flex items-center gap-2">
                      <select value={link.icon} onChange={e => updateLink(i, "icon", e.target.value)}
                        className="px-2 py-1.5 rounded bg-muted border border-border text-xs">
                        <option value="website">🌐 Website</option>
                        <option value="github">💻 GitHub</option>
                        <option value="twitter">🐦 Twitter</option>
                        <option value="instagram">📸 Instagram</option>
                        <option value="discord">💬 Discord</option>
                      </select>
                      <input value={link.label} onChange={e => updateLink(i, "label", e.target.value)} placeholder="Label"
                        className="flex-1 px-3 py-1.5 rounded bg-muted border border-border text-sm focus:outline-none" />
                      <button onClick={() => removeLink(i)} className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input value={link.url} onChange={e => updateLink(i, "url", e.target.value)} placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-sm focus:outline-none" />
                  </motion.div>
                ))}
                {links.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum link adicionado ainda.</p>}
              </motion.div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h3 className="text-sm font-semibold">Suas Badges</h3>
                {userBadges.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Você ainda não tem badges. Badges são concedidas pela equipe Safira.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {userBadges.map((ub: any) => {
                      const badge = ub.badges;
                      const isEquipped = equippedBadgeIds.has(ub.badge_id);
                      return (
                        <motion.button key={ub.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => toggleBadgeEquip(ub.badge_id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isEquipped ? "bg-primary/10 border-primary/40" : "bg-surface border-border hover:border-border/80"}`}>
                          <BadgeIcon icon={badge.icon} color={badge.color} size={20} />
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{badge.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                          </div>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isEquipped ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {isEquipped && <span className="text-[10px] text-primary-foreground">✓</span>}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
                <div className="pt-4">
                  <h3 className="text-sm font-semibold mb-3">Todas as Badges</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {allBadges.map(badge => {
                      const owned = userBadges.some((ub: any) => ub.badge_id === badge.id);
                      return (
                        <div key={badge.id} className={`flex flex-col items-center gap-1 p-3 rounded-lg border ${owned ? "border-primary/30 bg-primary/5" : "border-border bg-surface opacity-40"}`}>
                          <BadgeIcon icon={badge.icon} color={badge.color} size={22} />
                          <p className="text-[11px] font-medium text-center">{badge.name}</p>
                          {!owned && <p className="text-[9px] text-muted-foreground">🔒</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Style Tab */}
            {activeTab === "style" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Modelo do Card</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {CARD_TEMPLATES.map(t => (
                      <motion.button key={t.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setCardTemplate(t.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${cardTemplate === t.id ? "bg-primary/10 border-primary/40" : "bg-surface border-border"}`}>
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3">Efeito do Perfil</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {EFFECT_OPTIONS.map(eff => (
                      <motion.button key={eff.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setProfileEffect(eff.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${profileEffect === eff.id ? "bg-primary/10 border-primary/40" : "bg-surface border-border"}`}>
                        <p className="text-lg">{eff.emoji}</p>
                        <p className="text-xs font-medium mt-1">{eff.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:w-[560px] border-l border-border animated-gradient-bg flex items-center justify-center p-6 min-h-[500px]">
          <ProfileCard profile={previewProfile} />
        </div>
      </div>
    </div>
  );
};

export default Editor;
