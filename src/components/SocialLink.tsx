import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface SocialLinkProps {
  label: string;
  url: string;
  icon?: React.ReactNode;
}

export const SocialLink = ({ label, url, icon }: SocialLinkProps) => (
  <motion.a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className="group flex items-center gap-3 w-full px-4 py-3 rounded-lg glass transition-all duration-300 hover:glow-primary"
  >
    {icon && <span className="text-primary">{icon}</span>}
    <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.a>
);
