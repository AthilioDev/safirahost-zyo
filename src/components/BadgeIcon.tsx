import {
  Rocket, Crown, Code, Palette, Gamepad2, Video, Music, Brush,
  CheckCircle, Shield, Handshake, Bug, Heart, Moon, Gem,
  Star, Zap, Award, Trophy, Flame,
} from "lucide-react";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  rocket: Rocket,
  crown: Crown,
  code: Code,
  palette: Palette,
  "gamepad-2": Gamepad2,
  video: Video,
  music: Music,
  brush: Brush,
  "check-circle": CheckCircle,
  shield: Shield,
  handshake: Handshake,
  bug: Bug,
  heart: Heart,
  moon: Moon,
  gem: Gem,
  star: Star,
  zap: Zap,
  award: Award,
  trophy: Trophy,
  flame: Flame,
};

interface BadgeIconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
}

export const BadgeIcon = ({ icon, color = "#8b5cf6", size = 14, className }: BadgeIconProps) => {
  const Icon = iconMap[icon] || Star;
  return <Icon className={className} style={{ color, width: size, height: size }} />;
};
