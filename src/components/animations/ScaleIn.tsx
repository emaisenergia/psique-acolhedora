import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

type ScaleInProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
};

const ScaleIn = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
}: ScaleInProps) => {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
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

export default ScaleIn;
