import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mouse } from "lucide-react";
import gsap from "gsap";
import cutouts from "../../../shared/car-cutouts.json";

export default function CarPhotoCarousel() {
  const [index, setIndex] = useState(0);
  const active = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef<HTMLSpanElement>(null);
  const position = useRef({ value: 0 });
  const target = useRef(0);
  const size = useRef({ width: 1000, height: 450 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{
    x: number;
    y: number;
    value: number;
    id: number;
  } | null>(null);
  const clamp = (value: number) =>
    Math.max(0, Math.min(cutouts.length - 1, value));
  const draw = useCallback(() => {
    const value = position.current.value;
    const { width, height } = size.current;
    const mobile = width < 700;
    cards.current.forEach((card, itemIndex) => {
      if (!card) return;
      const distance = itemIndex - value;
      const depth = Math.abs(distance);
      gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        x: distance * width * (mobile ? 0.68 : 0.43),
        y: -distance * height * 0.2 + distance * distance * height * 0.022,
        z: -depth * (mobile ? 100 : 210),
        rotationY: -12 - distance * 19,
        rotationX: 5,
        rotationZ: -7 + distance * 3,
        scale: Math.max(0.62, 1 - depth * 0.065),
        autoAlpha: depth < 2.8 ? Math.min(1, (2.8 - depth) * 1.5) : 0,
        zIndex: 100 - Math.round(depth * 10),
        force3D: true,
      });
    });
    gsap.set(progress.current, { scaleX: (value + 1) / cutouts.length });
    const next = Math.round(value);
    if (active.current !== next) {
      active.current = next;
      setIndex(next);
    }
  }, []);
  const animate = useCallback(
    (value: number, duration = 0.95) => {
      target.current = clamp(value);
      tween.current?.kill();
      tween.current = gsap.to(position.current, {
        value: target.current,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : duration,
        ease: "power3.out",
        onUpdate: draw,
        onComplete: draw,
      });
    },
    [draw],
  );
  const snap = useCallback(() => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(
      () => animate(Math.round(target.current), 0.65),
      180,
    );
  }, [animate]);
  const step = (direction: number) => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
    const next = Math.round(target.current) + direction;
    animate(next < 0 ? cutouts.length - 1 : next >= cutouts.length ? 0 : next);
  };
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const resize = () => {
      size.current = {
        width: element.clientWidth,
        height: element.clientHeight,
      };
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (
        !delta ||
        (delta < 0 && target.current <= 0) ||
        (delta > 0 && target.current >= cutouts.length - 1)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const units =
        delta *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? element.clientHeight
            : 1);
      animate(target.current + units / 520, 0.75);
      snap();
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", wheel);
      observer.disconnect();
      tween.current?.kill();
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
  }, [draw, animate, snap]);
  useLayoutEffect(draw, [index, draw]);
  return (
    <div
      className="car-photo-carousel"
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label="Real car collection"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          step(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
      onPointerDown={(event) => {
        if (
          (event.target as HTMLElement).closest("button") ||
          event.button !== 0
        )
          return;
        tween.current?.kill();
        if (snapTimer.current) clearTimeout(snapTimer.current);
        target.current = position.current.value;
        pointer.current = {
          x: event.clientX,
          y: event.clientY,
          value: target.current,
          id: event.pointerId,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const start = pointer.current;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        animate(
          start.value -
            dx / (size.current.width * (size.current.width < 700 ? 0.5 : 0.3)),
          0.3,
        );
      }}
      onPointerUp={(event) => {
        const start = pointer.current;
        pointer.current = null;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy))
          animate(
            Math.round(
              clamp(
                start.value -
                  dx /
                    (size.current.width *
                      (size.current.width < 700 ? 0.5 : 0.3)),
              ),
            ),
          );
        else animate(Math.round(target.current), 0.6);
      }}
      onPointerCancel={() => {
        pointer.current = null;
        snap();
      }}
    >
      <div className="carousel-floor" aria-hidden="true" />
      <div className="car-rail">
        {cutouts.map((car, itemIndex) => (
          <div
            key={car.id}
            className="car-rail-card"
            data-car-index={itemIndex}
            ref={(element) => {
              cards.current[itemIndex] = element;
            }}
            aria-hidden={index !== itemIndex}
          >
            {Math.abs(itemIndex - index) <= 3 && (
              <img
                className={`carousel-car ${itemIndex === index ? "hero-photo" : ""}`}
                src={car.url}
                alt={itemIndex === index ? car.alt : ""}
                draggable={false}
                fetchPriority={itemIndex === index ? "high" : "auto"}
              />
            )}
          </div>
        ))}
      </div>
      <div className="carousel-caption">
        <span className="car-label">
          <span />
          {cutouts[index].category.toUpperCase()} · COLLECTION{" "}
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="carousel-controls">
          <span className="carousel-count">
            {String(index + 1).padStart(2, "0")} / {cutouts.length}
          </span>
          <button
            className="icon-button"
            aria-label="Previous car"
            onClick={() => step(-1)}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Next car"
            onClick={() => step(1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <span className="carousel-instruction">
        <Mouse size={12} /> SCROLL OR DRAG · 60 CARS TO DISCOVER
      </span>
      <div className="carousel-progress" aria-hidden="true">
        <span ref={progress} />
      </div>
    </div>
  );
}
