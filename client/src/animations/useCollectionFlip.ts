import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
gsap.registerPlugin(Flip);
export function useCollectionFlip(category: string, sort: string) {
  const state = useRef<ReturnType<typeof Flip.getState> | null>(null);
  useLayoutEffect(() => {
    if (
      !state.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const animation = Flip.from(state.current, {
      duration: 0.55,
      ease: "power2.inOut",
      absolute: true,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4 },
        ),
    });
    state.current = null;
    return () => {
      animation.kill();
    };
  }, [category, sort]);
  return () => {
    state.current = Flip.getState(".vehicle-card");
  };
}
