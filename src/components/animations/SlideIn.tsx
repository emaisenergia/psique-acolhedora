import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

type SlideInProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "left" | "right";
  className?: string;
  once?: boolean;
};

const SlideIn = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = "left",
  className = "",
  once = true,
}: SlideInProps) => {
  const xOffset = direction === "left" ? -100 : 100;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: xOffset,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default SlideIn;
