import { useParams } from "react-router-dom";
import { ProfileCard } from "@/components/ProfileCard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: links } = await supabase
        .from("social_links")
        .select("*")
        .eq("user_id", profileData.user_id)
        .order("sort_order");

      const { data: userBadges } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", profileData.user_id)
        .eq("equipped", true);

      // Increment views
      await supabase
        .from("profiles")
        .update({ views: (profileData.views || 0) + 1 })
        .eq("id", profileData.id);

      setProfile({
        username: profileData.username,
        displayName: profileData.display_name || profileData.username,
        bio: profileData.bio || "",
        avatar: profileData.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${profileData.user_id}`,
        banner: profileData.banner_url,
        discordTag: profileData.discord_tag || "",
        status: "online" as const,
        isVerified: profileData.is_verified || false,
        views: profileData.views || 0,
        cardTemplate: profileData.card_template || "classic",
        profileEffect: profileData.profile_effect || "none",
        showDiscord: profileData.show_discord ?? true,
        showBadges: profileData.show_badges ?? true,
        showViews: profileData.show_views ?? true,
        backgroundUrl: profileData.background_url || undefined,
        backgroundVideoUrl: profileData.background_video_url || undefined,
        songUrl: profileData.song_url || undefined,
        links: (links || []).map((l) => ({ label: l.label, url: l.url, icon: l.icon || "website" })),
        badges: (userBadges || []).map((ub: any) => ({
          id: ub.badges.id,
          name: ub.badges.name,
          icon: ub.badges.icon,
          color: ub.badges.color,
        })),
      });
      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 text-center space-y-3 max-w-sm">
          <p className="text-4xl">👻</p>
          <h2 className="text-xl font-bold">Usuário não encontrado</h2>
          <p className="text-sm text-muted-foreground">Este perfil não existe ou foi removido.</p>
        </motion.div>
      </div>
    );
  }

  const hasBackground = profile.backgroundUrl || profile.backgroundVideoUrl;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-12 overflow-hidden">
      {/* Background: video or image or default gradient */}
      {profile.backgroundVideoUrl ? (
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={profile.backgroundVideoUrl}
        />
      ) : profile.backgroundUrl ? (
        <img src={profile.backgroundUrl} alt="Background"
          className="absolute inset-0 w-full h-full object-cover z-0" />
      ) : (
        <div className="absolute inset-0 animated-gradient-bg z-0" />
      )}

      {/* Overlay for readability */}
      {hasBackground && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-[1]" />
      )}

      {/* Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <ProfileCard profile={profile} isFullPage />
      </div>
    </div>
  );
};

export default ProfilePage;
