import React from "react";
import { motion, type Variants } from "framer-motion";
import { useScrollReveal } from "../../hooks/useScrollReveal";

type AnimationType =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "fade";

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number; // ms
  duration?: number; // ms
  className?: string;
  threshold?: number;
  as?: keyof JSX.IntrinsicElements;
}

const animationVariants: Record<AnimationType, Variants> = {
  "fade-up": { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
  "fade-down": {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": { hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0 } },
  "fade-right": {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0 },
  },
  "zoom-in": {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1 },
  },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

export function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 600,
  className,
  threshold = 0.15,
  as: Tag = "div",
}: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollReveal({ threshold });
  const MotionTag: any = (motion as any)[Tag] ?? motion.div;

  return (
    <MotionTag
      ref={ref as any}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={animationVariants[animation]}
      transition={{
        duration: duration / 1000,
        delay: delay / 1000,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export default AnimatedSection;
