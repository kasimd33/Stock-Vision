import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function AnimatedCounter({ value, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { duration: 1200, bounce: 0 })

  useEffect(() => {
    motionVal.set(value)
  }, [value])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = prefix + Math.round(v).toLocaleString('en-IN') + suffix
      }
    })
  }, [spring, prefix, suffix])

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>
}
