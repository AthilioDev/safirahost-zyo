import { motion } from "framer-motion";

const effects: Record<string, React.FC> = {
  none: () => null,
  lightning: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] bg-gradient-to-b from-primary via-accent to-transparent opacity-0"
          style={{
            left: `${15 + i * 15}%`,
            top: 0,
            height: `${40 + Math.random() * 60}%`,
            filter: "blur(1px)",
          }}
          animate={{ opacity: [0, 0.8, 0], scaleY: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 2 + Math.random() * 4,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  ),
  particles: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  ),
  rain: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[1px] h-3 bg-gradient-to-b from-accent/40 to-transparent"
          style={{ left: `${Math.random() * 100}%`, top: `-5%` }}
          animate={{ y: ["0%", "2000%"] }}
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear",
          }}
        />
      ))}
    </div>
  ),
  fire: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${20 + Math.random() * 60}%`,
            bottom: 0,
            background: `radial-gradient(circle, hsl(${20 + Math.random() * 30} 100% 60%), transparent)`,
            filter: "blur(2px)",
          }}
          animate={{
            y: [0, -80 - Math.random() * 80],
            opacity: [0.8, 0],
            scale: [1, 0.2],
          }}
          transition={{
            duration: 1 + Math.random() * 1,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  ),
  snow: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-foreground/30"
          style={{ left: `${Math.random() * 100}%`, top: `-5%` }}
          animate={{
            y: ["0%", "2000%"],
            x: [0, Math.sin(i) * 20],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "linear",
          }}
        />
      ))}
    </div>
  ),
  matrix: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[10px] font-mono text-online/40"
          style={{ left: `${i * 7}%`, top: `-10%` }}
          animate={{ y: ["0%", "1500%"] }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear",
          }}
        >
          {String.fromCharCode(0x30A0 + Math.random() * 96)}
        </motion.div>
      ))}
    </div>
  ),
  stars: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-foreground/60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  ),
  neon: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        className="absolute inset-0 border-2 border-primary/20 rounded-2xl"
        animate={{
          boxShadow: [
            "inset 0 0 20px hsl(270 100% 65% / 0.1), 0 0 20px hsl(270 100% 65% / 0.1)",
            "inset 0 0 40px hsl(270 100% 65% / 0.3), 0 0 40px hsl(270 100% 65% / 0.2)",
            "inset 0 0 20px hsl(270 100% 65% / 0.1), 0 0 20px hsl(270 100% 65% / 0.1)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  ),
};

export const EFFECT_OPTIONS = [
  { id: "none", label: "Nenhum", emoji: "🚫" },
  { id: "lightning", label: "Raios", emoji: "⚡" },
  { id: "particles", label: "Partículas", emoji: "✨" },
  { id: "rain", label: "Chuva", emoji: "🌧️" },
  { id: "fire", label: "Fogo", emoji: "🔥" },
  { id: "snow", label: "Neve", emoji: "❄️" },
  { id: "matrix", label: "Matrix", emoji: "💚" },
  { id: "stars", label: "Estrelas", emoji: "⭐" },
  { id: "neon", label: "Neon", emoji: "💜" },
];

export const ProfileEffect = ({ effect }: { effect: string }) => {
  const Component = effects[effect] || effects.none;
  return <Component />;
};
