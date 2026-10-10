import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  MoveUpRight,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { AnimatePresence, motion } from "motion/react";
import vehicles from "../../shared/vehicles.json";
const CarScene = lazy(() => import("./three/CarScene"));
const page = (name: string) =>
  lazy(() =>
    import("./pages/Pages").then((m) => ({
      default: m[name as keyof typeof m],
    })),
  );
const Explore = page("Explore"),
  VehicleDetail = page("VehicleDetail"),
  Configurator = page("Configurator"),
  Compare = page("Compare"),
  Technology = page("Technology"),
  Story = page("Story"),
  Gallery = page("Gallery"),
  Booking = page("Booking"),
  Contact = page("Contact"),
  Admin = page("Admin"),
  NotFound = page("NotFound");
gsap.registerPlugin(ScrollTrigger);
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="page-shell empty-state">
        <h1>Something interrupted the experience.</h1>
        <p>Reload the studio to start fresh.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload experience
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Navigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="navigation">
        <Link to="/" className="brand" aria-label="Aerion Drive home">
          <span className="brand-symbol">Λ</span>
          <span>
            AERION <b>DRIVE</b>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className={open ? "nav-links open" : "nav-links"}
        >
          <NavLink to="/explore">The collection</NavLink>
          <NavLink to="/technology">Technology</NavLink>
          <NavLink to="/story">Our story</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <Link to="/compare" className="mobile-link">
            Compare vehicles
          </Link>
          <Link to="/contact" className="mobile-link">
            Contact
          </Link>
          <Link to="/book-test-drive" className="mobile-link">
            Request a test drive
          </Link>
        </nav>
        <Link className="nav-cta" to="/configurator">
          Build your Aerion <ArrowUpRight size={15} />
        </Link>
        <button
          className="menu-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <Link className="brand" to="/">
          <span className="brand-symbol">Λ</span>AERION DRIVE
        </Link>
        <p>The future belongs to the curious.</p>
        <Link to="/book-test-drive" className="text-link">
          Experience Aerion <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Aerion Drive · Fictional concept
          exhibition
        </span>
        <div>
          <Link to="/compare">Compare</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/admin">Administration</Link>
        </div>
        <span>DESIGNED TO MOVE YOU</span>
      </div>
    </footer>
  );
}
function ExperienceEffects() {
  const location = useLocation();
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      (location.pathname === "/"
        ? "Engineered beyond limits"
        : location.pathname.split("/")[1].replaceAll("-", " ")) +
      " — AERION DRIVE";
    if (reduced()) return;
    let context: gsap.Context | undefined;
    const reveal = () => {
      const surface = document.querySelector(
        '[data-route="' + CSS.escape(location.pathname) + '"]',
      );
      const elements = surface?.querySelectorAll(
        ".page-heading,.vehicle-card,.reveal",
      );
      if (!elements?.length) return;
      observer.disconnect();
      context = gsap.context(() => {
        gsap.fromTo(
          elements,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.035,
            clearProps: "all",
          },
        );
      });
    };
    const observer = new MutationObserver(reveal);
    observer.observe(document.getElementById("main")!, {
      childList: true,
      subtree: true,
    });
    reveal();
    return () => {
      observer.disconnect();
      context?.revert();
    };
  }, [location.pathname]);
  useEffect(() => {
    if (reduced()) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    const move = (e: MouseEvent) => {
      if (cursor.current)
        gsap.to(cursor.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.35,
          overwrite: true,
        });
    };
    window.addEventListener("mousemove", move);
    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
      window.removeEventListener("mousemove", move);
    };
  }, []);
  return (
    <>
      <div ref={cursor} className="custom-cursor" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true" />
    </>
  );
}
function Home() {
  const hero = useRef<HTMLElement>(null),
    story = useRef<HTMLElement>(null);
  const [scroll, setScroll] = useState(0);
  const [chapter, setChapter] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from(".hero-kicker", { y: 20, opacity: 0, duration: 0.8 })
        .from(
          ".hero-title span",
          {
            y: 120,
            opacity: 0,
            duration: 1.15,
            stagger: 0.14,
            ease: "power3.out",
          },
          "-=.5",
        )
        .from(
          ".hero-bottom > *",
          { y: 25, opacity: 0, duration: 0.8, stagger: 0.15 },
          "-=.55",
        );
      ScrollTrigger.create({
        trigger: story.current,
        start: "top top",
        end: "+=1700",
        pin: true,
        onUpdate: (s) => {
          setScroll(s.progress);
          setChapter(Math.min(4, Math.floor(s.progress * 5)));
        },
      });
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) =>
        gsap.from(el, {
          y: 50,
          opacity: 0,
          duration: 0.9,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
      );
    }, hero);
    let refreshFrame = 0;
    const layoutObserver = new ResizeObserver(() => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    document
      .querySelectorAll(".home-collection,.manifesto")
      .forEach((el) => layoutObserver.observe(el));
    return () => {
      cancelAnimationFrame(refreshFrame);
      layoutObserver.disconnect();
      ctx.revert();
    };
  }, []);
  const chapters = [
    [
      "01 / EXTERIOR",
      "A silhouette.\nA statement.",
      "Taut proportions. A low centre of gravity. Every surface follows the feeling of movement.",
    ],
    [
      "02 / AERODYNAMICS",
      "Shaped by\nthe invisible.",
      "A sculpted underbody and purposeful air channels imagine a quieter path through the air.",
    ],
    [
      "03 / PERFORMANCE",
      "Quiet power.\nLoud emotion.",
      "Instant electric response meets a balanced dual-motor concept. Explore the fictional specifications.",
    ],
    [
      "04 / INTERIOR",
      "Space to\nfeel everything.",
      "A considered cabin concept: tactile surfaces, a panoramic display and room for the road ahead.",
    ],
    [
      "05 / YOUR AERION",
      "Make the\nextraordinary yours.",
      "Choose your finish. Find your perspective. Create a configuration as individual as you are.",
    ],
  ];
  return (
    <>
      <section ref={hero} className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-head">
          <p className="eyebrow hero-kicker">
            <span className="amber-dot" /> A NEW ERA OF ELECTRIC EXPRESSION
          </p>
          <h1 className="hero-title">
            <span>ENGINEERED</span>
            <span>
              BEYOND <i>LIMITS.</i>
            </span>
          </h1>
          <div className="hero-edition">
            THE AERION A1
            <br />
            <span>CONCEPT SERIES / 001</span>
          </div>
        </div>
        <div className="hero-car">
          <Suspense
            fallback={
              <div className="scene-loading">Opening the 3D studio…</div>
            }
          >
            <CarScene hero interactive={false} color="#b8c3cc" />
          </Suspense>
          <span className="car-label">
            <span />
            A1 · GLACIER SILVER
          </span>
          <span className="hero-orbit-label">
            PURE ELECTRIC. PURE INSTINCT.
          </span>
        </div>
        <div className="hero-bottom">
          <p>
            Not just a new way to drive.
            <br />A new way to <em>feel.</em>
          </p>
          <div className="hero-actions">
            <Link className="button" to="/explore">
              Explore the collection <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" to="/configurator">
              Enter the 3D studio <ArrowUpRight size={18} />
            </Link>
          </div>
          <a className="scroll-cue" href="#collection">
            <span>SCROLL TO DISCOVER</span>
            <ChevronDown size={18} />
          </a>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>
              3.2<span>s</span>
            </strong>
            <small>0–100 KM/H</small>
          </div>
          <div>
            <strong>
              620<span>km</span>
            </strong>
            <small>CONCEPT RANGE</small>
          </div>
          <div>
            <strong>
              510<span>kW</span>
            </strong>
            <small>DUAL-MOTOR POWER</small>
          </div>
          <p>
            Fictional concept specifications.
            <br />
            An exploration of possibility.
          </p>
        </div>
      </section>
      <section id="collection" className="home-collection section-pad">
        <div className="section-header reveal">
          <div>
            <p className="eyebrow">01 / THE COLLECTION</p>
            <h2>
              Different instincts.
              <br />
              One <em>vision.</em>
            </h2>
          </div>
          <div>
            <p>
              Five original electric concepts.
              <br />
              Find the one that moves you.
            </p>
            <Link to="/explore" className="text-link">
              Discover all models <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="home-vehicle-grid">
          {vehicles.slice(0, 3).map((v, i) => (
            <Link
              to={`/vehicles/${v.slug}`}
              className={`home-vehicle reveal vehicle-${i}`}
              key={v.id}
            >
              <div className="vehicle-top">
                <span>0{i + 1}</span>
                <ArrowUpRight size={22} />
              </div>
              <img src={v.media[0].url} alt={v.media[0].alt} loading="lazy" />
              <div className="home-vehicle-copy">
                <small>{v.category.toUpperCase()}</small>
                <h3>{v.name.replace("Aerion ", "")}</h3>
                <span>{v.tagline}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="manifesto section-pad">
        <p className="eyebrow reveal">OUR PHILOSOPHY</p>
        <h2 className="reveal">
          Progress is a feeling.
          <br />
          We give it <em>form.</em>
        </h2>
        <div className="manifesto-bottom reveal">
          <p>
            We imagine a future where technology is instinctive, design is
            intentional, and every journey feels extraordinary.
          </p>
          <Link className="round-link" to="/story" aria-label="Read our story">
            <MoveUpRight size={28} />
          </Link>
        </div>
        <span className="manifesto-mark" aria-hidden="true">
          Λ
        </span>
      </section>
      <section ref={story} className="pinned-story">
        <div className="story-scene">
          {chapter === 3 ? (
            <img
              className="story-cockpit"
              src="/images/cockpit.svg"
              alt="Original Aerion panoramic cabin illustration — an interior design study"
            />
          ) : (
            <Suspense fallback={null}>
              <CarScene
                hero
                interactive={false}
                color={chapter === 2 ? "#ffb000" : "#8095a8"}
                scroll={scroll}
                environment={chapter === 2 ? "night" : "studio"}
              />
            </Suspense>
          )}
          {chapter === 1 && (
            <svg
              className="aero-flow"
              viewBox="0 0 1000 650"
              aria-hidden="true"
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  d={`M -100 ${310 + i * 25} C 200 ${310 + i * 25}, 280 ${120 + i * 22}, 510 ${145 + i * 22} S 750 ${300 + i * 25}, 1100 ${280 + i * 25}`}
                />
              ))}
            </svg>
          )}
        </div>
        <div className="story-caption" key={chapter}>
          <p className="eyebrow">{chapters[chapter][0]}</p>
          <h2>
            {chapters[chapter][1].split("\n").map((s, i) => (
              <span key={i}>
                {s}
                <br />
              </span>
            ))}
          </h2>
          <p>{chapters[chapter][2]}</p>
          <Link
            className="text-link"
            to={chapter === 4 ? "/configurator" : "/technology"}
          >
            {chapter === 4 ? "Build your Aerion" : "Explore the thinking"}{" "}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="chapter-track">
          {chapters.map((c, i) => (
            <span key={c[0]} className={i === chapter ? "active" : ""}>
              0{i + 1}
              <i />
            </span>
          ))}
        </div>
      </section>
      <section className="home-tech section-pad">
        <div className="technology-image reveal">
          <img
            src="/images/cockpit.svg"
            alt="Original Aerion panoramic cockpit illustration"
            loading="lazy"
          />
          <span className="image-label">
            <Zap size={15} /> INTELLIGENCE, WITH INSTINCT.
          </span>
        </div>
        <div className="reveal">
          <p className="eyebrow">02 / DESIGNED AROUND YOU</p>
          <h2>
            Innovation.
            <br />
            Without
            <br />
            <em>interruption.</em>
          </h2>
          <p>
            From a connected cabin concept to an all-electric architecture, the
            most advanced thinking is the kind you simply feel.
          </p>
          <Link to="/technology" className="text-link">
            Inside Aerion technology <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="closing section-pad reveal">
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h2>
          Some things need
          <br />
          to be <em>experienced.</em>
        </h2>
        <Link to="/book-test-drive" className="button">
          Request a test drive <ArrowUpRight size={18} />
        </Link>
        <span>
          Fictional concept exhibition · Enquiries are demonstration requests
        </span>
      </section>
    </>
  );
}
export default function App() {
  const location = useLocation();
  return (
    <ErrorBoundary>
      <Navigation />
      <ExperienceEffects />
      <main id="main">
        <AnimatePresence mode="wait">
          <motion.div
            data-route={location.pathname}
            key={location.pathname}
            initial={reduced() ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense
              fallback={
                <div className="route-loading">
                  <span className="brand-symbol">Λ</span>
                  <p>Opening your experience…</p>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/vehicles/:slug" element={<VehicleDetail />} />
                <Route path="/configurator" element={<Configurator />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/technology" element={<Technology />} />
                <Route path="/story" element={<Story />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/book-test-drive" element={<Booking />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
