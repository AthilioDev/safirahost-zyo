import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface StatusIndicatorProps {
  status: "online" | "idle" | "dnd" | "offline";
  size?: "sm" | "md" | "lg";
}

const statusLabels = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

const sizeClasses = {
  sm: "h-2.5 w-2.5",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export const StatusIndicator = ({ status, size = "md" }: StatusIndicatorProps) => (
  <span
    className={`inline-block rounded-full status-${status} ${sizeClasses[size]}`}
    title={statusLabels[status]}
  />
);

interface VerifiedBadgeProps {
  className?: string;
}

export const VerifiedBadge = ({ className }: VerifiedBadgeProps) => (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className={className}
  >
    <CheckCircle className="h-5 w-5 text-badge-verified fill-badge-verified/20" />
  </motion.span>
);
