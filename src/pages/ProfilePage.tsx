import { useParams } from "react-router-dom";
import { ProfileCard } from "@/components/ProfileCard";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gem, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!username) return setLoading(false);

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

        let visitorIP = "0.0.0.0";
        try {
          const ipResponse = await fetch("https://api.ipify.org?format=json");
          const ipData = await ipResponse.json();
          visitorIP = ipData.ip;
        } catch {}

        const { data: currentUserData } = await supabase.auth.getUser();
        const currentUserId = currentUserData?.user?.id || null;

        try {
          if (!currentUserId) {
            await supabase
              .from("profile_views")
              .insert([{ profile_id: profileData.id, ip_address: visitorIP, viewer_id: null }])
              .onConflict(["profile_id", "ip_address"])
              .ignore();
          } else {
            await supabase
              .from("profile_views")
              .insert([{ profile_id: profileData.id, viewer_id: currentUserId, ip_address: visitorIP }])
              .onConflict(["profile_id", "viewer_id"])
              .ignore();
          }
        } catch (e) {
          console.error("Erro ao inserir view:", e);
        }

        const { count } = await supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileData.id);

        profileData.views = count || 1;

        setProfile({
          username: profileData.username,
          displayName: profileData.display_name || profileData.username,
          bio: profileData.bio || "",
          avatar:
            profileData.avatar_url ||
            `https://api.dicebear.com/9.x/avataaars/svg?seed=${profileData.user_id}`,
          banner: profileData.banner_url,
          discordTag: profileData.discord_tag || "",
          status: "online" as const,
          isVerified: profileData.is_verified || false,
          views: profileData.views,
          cardTemplate: profileData.card_template || "classic",
          profileEffect: profileData.profile_effect || "none",
          showDiscord: profileData.show_discord ?? true,
          showBadges: profileData.show_badges ?? true,
          showViews: profileData.show_views ?? true,
          backgroundUrl: profileData.background_url || undefined,
          backgroundVideoUrl: profileData.background_video_url || undefined,
          songUrl: profileData.song_url || undefined,
          bannerBlur: profileData.banner_blur ?? 0,
          cardBorderColor: profileData.card_border_color || "#f97316",
          cardBgColor: profileData.card_bg_color || "#1a1a1f",
          cardOpacity: profileData.card_opacity ?? 1,
          cursorUrl: profileData.cursor_url || null,
          discord_user_id: profileData.discord_user_id || "",
          location: profileData.location || "",
          links: (links || []).map((l) => ({
            label: l.label,
            url: l.url,
            icon: l.icon || "website",
          })),
          badges: (userBadges || []).map((ub: any) => ({
            id: ub.badges.id,
            name: ub.badges.name,
            icon: ub.badges.icon,
            color: ub.badges.color,
          })),
        });
      } catch (err) {
        console.error("Erro no fetchProfile:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profile?.cursorUrl || !pageRef.current) return;
    const el = pageRef.current;
    const cursorValue = `url(${profile.cursorUrl}), auto`;
    el.style.cursor = cursorValue;
    let styleEl = document.getElementById("safira-custom-cursor") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "safira-custom-cursor";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `#safira-profile-page, #safira-profile-page * { cursor: url(${profile.cursorUrl}), auto !important; }`;
    return () => {
      el.style.cursor = "";
      const s = document.getElementById("safira-custom-cursor");
      if (s) s.remove();
    };
  }, [profile?.cursorUrl]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-4">
        <div className="h-6 w-6 border border-[#f97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-[#333]">Carregando</p>
      </div>
    </div>
  );

  if (notFound || !profile) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono px-4">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(#0f0f0f 1px, transparent 1px), linear-gradient(90deg, #0f0f0f 1px, transparent 1px)", backgroundSize:"48px 48px"}} />
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} className="relative z-10 border border-[#1a1a1a] bg-[#080808] p-10 text-center space-y-5 max-w-sm w-full rounded-3xl">
        <div className="inline-flex items-center justify-center h-12 w-12 border border-[#1a1a1a] bg-[#0d0d0d] mx-auto rounded-2xl">
          <span className="text-xl">404</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Perfil não encontrado</h2>
          <p className="text-[11px] text-[#444] font-mono leading-relaxed">Este perfil não existe ou foi removido da plataforma.</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#f97316] hover:text-[#e06210] transition-colors">← Voltar ao início</Link>
      </motion.div>
      <div className="relative z-10 mt-8 flex items-center gap-1.5 opacity-30">
        <Gem className="h-3 w-3 text-[#f97316]" />
        <span className="text-[9px] uppercase tracking-widest text-[#f97316] font-black">Safira</span>
      </div>
    </div>
  );

  const hasBackground = profile.backgroundUrl || profile.backgroundVideoUrl;

  return (
    <div id="safira-profile-page" ref={pageRef} className="min-h-screen bg-[#050505] relative flex flex-col items-center justify-center p-4 py-14 overflow-hidden font-mono">
      {/* Background */}
      {profile.backgroundVideoUrl ? (
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0" src={profile.backgroundVideoUrl}/>
      ) : profile.backgroundUrl ? (
        <img src={profile.backgroundUrl} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0"/>
      ) : (
        <div className="absolute inset-0 z-0" style={{ backgroundColor:"#050505", backgroundImage:"linear-gradient(#0d0d0d 1px, transparent 1px), linear-gradient(90deg, #0d0d0d 1px, transparent 1px)", backgroundSize:"48px 48px"}}/>
      )}
      {hasBackground && <div className="absolute inset-0 bg-[#050505]/55 backdrop-blur-sm z-[1]" />}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background:"radial-gradient(ellipse at center, transparent 40%, #050505 100%)"}} />

      {/* Custom cursor indicator */}
      {profile.cursorUrl && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 opacity-20 hover:opacity-60 transition-opacity">
          <img src={profile.cursorUrl} className="h-4 w-4 object-contain" alt=""/>
          <span className="text-[8px] uppercase tracking-widest text-white font-mono">cursor ativo</span>
        </div>
      )}

      {/* Views counter */}
      {profile.showViews && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-[#0d0d0d]/80 border border-[#1a1a1a] backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-[10px] font-mono text-white/70">{profile.views}</span>
        </motion.div>
      )}

      {/* Profile card */}
      <motion.div
        initial={{ opacity:0, y:16 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.45, ease:"easeOut" }}
        className="relative z-10 w-full max-w-2xl"
      >
        <ProfileCard
          profile={{ ...profile, showViews: false }}
          isFullPage
          cardBackgroundColor={profile.cardBorderColor}
        />
      </motion.div>

      {/* Made by Safira */}
      <motion.a
        href="https://safirahost.xyz"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-white text-black text-[12px] font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
      >
        <Heart className="h-3.5 w-3.5 fill-black" />
        Made by Safira
      </motion.a>
    </div>
  );
};

export default ProfilePage;
