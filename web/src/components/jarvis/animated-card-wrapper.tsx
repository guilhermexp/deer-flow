"use client"
import { motion, type HTMLMotionProps } from "framer-motion"
import type React from "react"

import { useAnimation } from "~/contexts/animation-context"
import { cn } from "~/lib/utils"

interface AnimatedCardWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  delay: number
  className?: string
}

export default function AnimatedCardWrapper({ children, delay, className, ...props }: AnimatedCardWrapperProps) {
  const { shouldAnimate, isFirstLoad } = useAnimation()
  
  // Reduce animation delay on first load
  const actualDelay = isFirstLoad ? Math.min(delay * 0.2, 0.1) : delay
  
  if (!shouldAnimate) {
    return (
      <div className={cn("group", className)}>
        {children}
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: isFirstLoad ? 10 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: isFirstLoad ? 0.2 : 0.6, 
        delay: actualDelay,
        ease: "easeOut" 
      }}
      whileHover={{
        scale: 1.005,
        transition: { duration: 0.075, ease: "easeInOut" },
      }}
      className={cn("group will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
