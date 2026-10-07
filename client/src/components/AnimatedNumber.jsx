import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

export default function AnimatedNumber({ value, decimals = 0, duration = 0.9 }) {
  const ref = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = v.toFixed(decimals);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, decimals, duration]);

  return <span ref={ref}>{(0).toFixed(decimals)}</span>;
}