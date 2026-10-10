import { lazy, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Maximize2,
  Save,
  Share2,
  SlidersHorizontal,
  Zap,
  Wind,
  Shield,
  Search,
  LogOut,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import vehiclesData from "../../../shared/vehicles.json";
import editorialGallery from "../../../shared/gallery.json";
const CarScene = lazy(() => import("../three/CarScene"));
import { useCollectionFlip } from "../animations/useCollectionFlip";

type Vehicle = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  tagline: string;
  price: number;
  range: number;
  topSpeed: number;
  acceleration: number;
  power: number;
  battery: number;
  seats: number;
  drivetrain: string;
  colors: { name: string; hex: string }[];
  wheels: { id: string; name: string }[];
  media: { url: string; alt: string; category: string }[];
  featured: boolean;
  published: boolean;
};
const demoVehicles = vehiclesData as Vehicle[];
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
async function api(path: string, options?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.message ||
        data.error ||
        "Request could not be completed. Please try again.",
    );
  return data;
}
function useVehicles() {
  const [vehicles, setVehicles] = useState(
    demoVehicles.filter((v) => v.published),
  );
  useEffect(() => {
    let active = true;
    api("/vehicles")
      .then((d) => {
        if (active) setVehicles(d.vehicles);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return vehicles;
}
function Heading({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text?: string;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      {text && <p className="muted">{text}</p>}
    </header>
  );
}
function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link className="vehicle-card" to={`/vehicles/${vehicle.slug}`}>
      <div className="vehicle-card-image">
        <img
          src={vehicle.media[0]?.url || "/images/a1.svg"}
          alt={vehicle.media[0]?.alt || vehicle.name}
          loading="lazy"
        />
        <span className="card-arrow">
          <ArrowUpRight size={22} />
        </span>
      </div>
      <div className="vehicle-card-copy">
        <p className="eyebrow">{vehicle.category}</p>
        <h2>{vehicle.name}</h2>
        <p className="muted">{vehicle.tagline}</p>
        <div className="card-specs">
          <span>
            {vehicle.range}
            <small> km range</small>
          </span>
          <span>
            {vehicle.acceleration}
            <small> s 0–100</small>
          </span>
          <span>
            {money(vehicle.price)}
            <small> concept estimate</small>
          </span>
        </div>
      </div>
    </Link>
  );
}
export function Explore() {
  const vehicles = useVehicles();
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const capture = useCollectionFlip(category, sort);
  const filtered = vehicles
    .filter((v) => category === "All" || v.category === category)
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "range"
          ? b.range - a.range
          : Number(b.featured) - Number(a.featured),
    );
  return (
    <main className="page-shell">
      <Heading
        label="THE COLLECTION / 01"
        title="A different kind of drive."
        text="Five original concepts. Five expressions of possibility. Find the one that moves you."
      />
      <div className="collection-toolbar">
        <div className="filter-chips">
          {["All", ...new Set(vehicles.map((v) => v.category))].map((c) => (
            <button
              className={`chip ${category === c ? "active" : ""}`}
              key={c}
              onClick={() => {
                capture();
                setCategory(c);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Sort vehicles"
            value={sort}
            onChange={(e) => {
              capture();
              setSort(e.target.value);
            }}
          >
            <option value="featured">Featured first</option>
            <option value="price">Price: low to high</option>
            <option value="range">Longest range</option>
          </select>
        </label>
      </div>
      <div className="vehicle-grid">
        {filtered.map((v) => (
          <VehicleCard key={v.slug} vehicle={v} />
        ))}
      </div>
      <p className="demo-note">
        Original fictional vehicles. All specifications and prices are
        illustrative concept estimates.
      </p>
    </main>
  );
}
export function VehicleDetail() {
  const { slug } = useParams();
  const vehicle = useVehicles().find((v) => v.slug === slug);
  const [image, setImage] = useState(0);
  if (!vehicle) return <NotFound />;
  return (
    <main className="page-shell vehicle-detail">
      <Link className="back-link" to="/explore">
        <ChevronLeft size={16} /> Collection
      </Link>
      <Heading
        label={vehicle.category}
        title={vehicle.name}
        text={vehicle.tagline}
      />
      <div className="detail-hero">
        <img
          src={vehicle.media[image]?.url || "/images/a1.svg"}
          alt={vehicle.media[image]?.alt || vehicle.name}
        />
        <div className="detail-image-nav">
          {vehicle.media.map((m, i) => (
            <button
              key={m.url}
              className={`chip ${image === i ? "active" : ""}`}
              onClick={() => setImage(i)}
            >
              {m.category || `View ${i + 1}`}
            </button>
          ))}
        </div>
      </div>
      <div className="spec-strip">
        <div>
          <strong>{vehicle.range}</strong>
          <span>km concept range</span>
        </div>
        <div>
          <strong>{vehicle.acceleration}</strong>
          <span>seconds 0–100 km/h</span>
        </div>
        <div>
          <strong>{vehicle.power}</strong>
          <span>kW concept power</span>
        </div>
        <div>
          <strong>{vehicle.topSpeed}</strong>
          <span>km/h concept top speed</span>
        </div>
      </div>
      <section className="split-layout">
        <div>
          <p className="eyebrow">DESIGNED WITH INTENT</p>
          <h2>Every line has a purpose.</h2>
          <p className="muted">{vehicle.description}</p>
        </div>
        <div className="panel">
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h3>From {money(vehicle.price)}</h3>
          <p className="muted">
            Fictional concept estimate · {vehicle.battery} kWh ·{" "}
            {vehicle.drivetrain} · {vehicle.seats} seats
          </p>
          <Link className="button" to={`/configurator?model=${vehicle.slug}`}>
            Make it yours <ArrowUpRight size={18} />
          </Link>
          <Link
            className="text-link"
            to={`/book-test-drive?model=${vehicle.slug}`}
          >
            Request a demo drive <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <p className="demo-note">
        Demonstration concept specifications, not certified performance figures.
      </p>
    </main>
  );
}
type Config = {
  model: string;
  color: string;
  wheels: "aero" | "sport";
  environment: "studio" | "night" | "desert";
  lighting: boolean;
  angle: "orbit" | "front" | "side" | "rear";
};
export function Configurator() {
  const vehicles = useVehicles();
  const [params, setParams] = useSearchParams();
  const initial: Config = {
    model: params.get("model") || "aerion-a1",
    color: /^#[a-fA-F0-9]{6}$/.test(params.get("color") || "")
      ? params.get("color")!
      : "#c4cad0",
    wheels: params.get("wheels") === "sport" ? "sport" : "aero",
    environment: ["night", "desert"].includes(params.get("environment") || "")
      ? (params.get("environment") as Config["environment"])
      : "studio",
    lighting: params.get("lighting") !== "false",
    angle: "orbit",
  };
  const [config, setConfig] = useState(initial);
  const [resetKey, setResetKey] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [status, setStatus] = useState("");
  const sceneRef = useRef<HTMLDivElement>(null);
  const vehicle = vehicles.find((v) => v.slug === config.model) || vehicles[0];
  const update = (change: Partial<Config>) =>
    setConfig((c) => ({ ...c, ...change }));
  const share = async () => {
    const query = new URLSearchParams({
      model: vehicle.slug,
      color: config.color,
      wheels: config.wheels,
      environment: config.environment,
      lighting: String(config.lighting),
    });
    setParams(query, { replace: true });
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/configurator?${query}`,
      );
      setStatus("Configuration link copied.");
    } catch {
      setStatus(
        "Your configuration is in the address bar. Copy the URL to share.",
      );
    }
  };
  return (
    <main className="configurator-page">
      <div className="config-title">
        <p className="eyebrow">THE DESIGN STUDIO</p>
        <h1>Make it unmistakably yours.</h1>
        <p className="muted">Drag to rotate. Scroll or pinch to zoom.</p>
      </div>
      <div className="config-layout">
        <div className="config-scene" ref={sceneRef}>
          <CarScene
            {...config}
            model={vehicle.slug}
            resetKey={resetKey}
            zoom={zoom}
            interactive
          />
          <div className="scene-toolbar">
            <button
              className="icon-button"
              title="Zoom in"
              onClick={() => setZoom((z) => z + 1)}
            >
              <ZoomIn size={18} />
            </button>
            <button
              className="icon-button"
              title="Zoom out"
              onClick={() => setZoom((z) => z - 1)}
            >
              <ZoomOut size={18} />
            </button>
            <button
              className="icon-button"
              title="Reset camera"
              onClick={() => setResetKey((k) => k + 1)}
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="icon-button"
              title="Fullscreen"
              onClick={() => {
                if (!document.fullscreenElement)
                  sceneRef.current
                    ?.requestFullscreen()
                    .catch(() =>
                      setStatus("Fullscreen is unavailable in this browser."),
                    );
                else document.exitFullscreen();
              }}
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <div className="scene-caption">
            <span>ORIGINAL PROCEDURAL CONCEPT</span>
            <span>{vehicle.name} / 360°</span>
          </div>
        </div>
        <aside className="config-panel">
          <p className="eyebrow">01 / SELECT YOUR MODEL</p>
          <select
            aria-label="Vehicle model"
            value={vehicle.slug}
            onChange={(e) => update({ model: e.target.value })}
          >
            {vehicles.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
              </option>
            ))}
          </select>
          <p className="eyebrow">02 / EXTERIOR FINISH</p>
          <div className="color-options">
            {vehicle.colors.map((c) => (
              <button
                key={c.hex}
                style={{ background: c.hex }}
                className={`color-swatch ${config.color.toLowerCase() === c.hex.toLowerCase() ? "active" : ""}`}
                aria-label={c.name}
                title={c.name}
                onClick={() => update({ color: c.hex })}
              >
                {config.color.toLowerCase() === c.hex.toLowerCase() && (
                  <Check
                    size={17}
                    color={c.hex === "#ffffff" ? "#111" : "#fff"}
                  />
                )}
              </button>
            ))}
          </div>
          <p className="muted selected-color">
            {vehicle.colors.find(
              (c) => c.hex.toLowerCase() === config.color.toLowerCase(),
            )?.name || "Custom finish"}
          </p>
          <p className="eyebrow">03 / WHEEL DESIGN</p>
          <div className="filter-chips">
            {(["aero", "sport"] as const).map((w) => (
              <button
                className={`chip ${config.wheels === w ? "active" : ""}`}
                key={w}
                onClick={() => update({ wheels: w })}
              >
                {w === "aero" ? "Aero disc" : "Sport spoke"}
              </button>
            ))}
          </div>
          <p className="eyebrow">04 / ENVIRONMENT</p>
          <div className="filter-chips">
            {(["studio", "night", "desert"] as const).map((e) => (
              <button
                key={e}
                className={`chip ${config.environment === e ? "active" : ""}`}
                onClick={() => update({ environment: e })}
              >
                {e}
              </button>
            ))}
          </div>
          <label className="toggle-row">
            <span>Signature lighting</span>
            <input
              type="checkbox"
              checked={config.lighting}
              onChange={(e) => update({ lighting: e.target.checked })}
            />
          </label>
          <p className="eyebrow">CAMERA</p>
          <div className="filter-chips">
            {(["orbit", "front", "side", "rear"] as const).map((a) => (
              <button
                key={a}
                className={`chip ${config.angle === a ? "active" : ""}`}
                onClick={() => update({ angle: a })}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="config-summary">
            <strong>{vehicle.name}</strong>
            <span>
              {money(vehicle.price)} <small>concept estimate</small>
            </span>
          </div>
          <div className="config-actions">
            <button
              className="button"
              onClick={() => {
                try {
                  localStorage.setItem(
                    "aerion-configuration",
                    JSON.stringify(config),
                  );
                  setStatus("Configuration saved on this device.");
                } catch {
                  setStatus(
                    "Device storage is unavailable. Use the share link instead.",
                  );
                }
              }}
            >
              <Save size={16} /> Save
            </button>
            <button className="button-outline" onClick={share}>
              <Share2 size={16} /> Share
            </button>
          </div>
          <button
            className="text-link"
            onClick={() => {
              try {
                const saved = localStorage.getItem("aerion-configuration");
                if (saved) {
                  const c = JSON.parse(saved);
                  if (
                    vehicles.some((v) => v.slug === c.model) &&
                    /^#[a-fA-F0-9]{6}$/.test(c.color) &&
                    ["aero", "sport"].includes(c.wheels) &&
                    ["studio", "night", "desert"].includes(c.environment) &&
                    ["orbit", "front", "side", "rear"].includes(c.angle) &&
                    typeof c.lighting === "boolean"
                  ) {
                    setConfig(c);
                    setStatus("Saved configuration restored.");
                  } else
                    setStatus(
                      "Saved configuration is invalid. Reset to start fresh.",
                    );
                } else setStatus("No saved configuration on this device.");
              } catch {
                setStatus("Saved configuration could not be restored.");
              }
            }}
          >
            Restore saved configuration
          </button>
          <button
            className="text-link"
            onClick={() => {
              setConfig({
                model: vehicles[0].slug,
                color: vehicles[0].colors[0].hex,
                wheels: "aero",
                environment: "studio",
                lighting: true,
                angle: "orbit",
              });
              setResetKey((k) => k + 1);
              setZoom(0);
              setParams({}, { replace: true });
              setStatus("Configuration reset.");
            }}
          >
            Reset configuration
          </button>
          <p className="status" role="status">
            {status}
          </p>
        </aside>
      </div>
    </main>
  );
}
export function Compare() {
  const vehicles = useVehicles();
  const [selected, setSelected] = useState<string[]>([
    "aerion-a1",
    "aerion-vortex",
  ]);
  const [differences, setDifferences] = useState(false);
  const chosen = selected
    .map((slug) => vehicles.find((v) => v.slug === slug))
    .filter(Boolean) as Vehicle[];
  const rows: {
    label: string;
    key: keyof Vehicle;
    format?: (n: number) => string;
    unit?: string;
  }[] = [
    { label: "Category", key: "category" },
    { label: "Estimated price", key: "price", format: money },
    { label: "Range", key: "range", unit: " km" },
    { label: "Top speed", key: "topSpeed", unit: " km/h" },
    { label: "0–100 km/h", key: "acceleration", unit: " s" },
    { label: "Power", key: "power", unit: " kW" },
    { label: "Battery", key: "battery", unit: " kWh" },
    { label: "Seats", key: "seats" },
    { label: "Drivetrain", key: "drivetrain" },
  ];
  return (
    <main className="page-shell">
      <Heading
        label="SIDE BY SIDE"
        title="Find your own benchmark."
        text="Select up to three concepts and explore the details that matter to you."
      />
      <div className="compare-picker">
        {vehicles.map((v) => (
          <button
            key={v.slug}
            className={`chip ${selected.includes(v.slug) ? "active" : ""}`}
            disabled={!selected.includes(v.slug) && selected.length === 3}
            onClick={() =>
              setSelected((s) =>
                s.includes(v.slug)
                  ? s.filter((x) => x !== v.slug)
                  : [...s, v.slug],
              )
            }
          >
            {selected.includes(v.slug) && <Check size={14} />}
            {v.name}
          </button>
        ))}
      </div>
      <div className="collection-toolbar">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={differences}
            onChange={(e) => setDifferences(e.target.checked)}
          />
          Highlight differences
        </label>
        <button className="text-link" onClick={() => setSelected([])}>
          Reset comparison <RotateCcw size={15} />
        </button>
      </div>
      {chosen.length ? (
        <div className="comparison-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Concept specifications</th>
                {chosen.map((v) => (
                  <th key={v.slug}>
                    <img
                      src={v.media[0]?.url || "/images/a1.svg"}
                      alt={v.name}
                    />
                    <h3>{v.name}</h3>
                    <button
                      className="text-link"
                      onClick={() =>
                        setSelected((s) => s.filter((x) => x !== v.slug))
                      }
                    >
                      Remove <X size={13} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const different =
                  new Set(chosen.map((v) => String(v[r.key]))).size > 1;
                return (
                  <tr
                    key={r.key}
                    className={differences && different ? "difference-row" : ""}
                  >
                    <th>{r.label}</th>
                    {chosen.map((v) => (
                      <td key={v.slug}>
                        {r.format
                          ? r.format(Number(v[r.key]))
                          : String(v[r.key])}
                        {r.unit}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                <th>Discover more</th>
                {chosen.map((v) => (
                  <td key={v.slug}>
                    <Link className="text-link" to={`/vehicles/${v.slug}`}>
                      Explore <ArrowUpRight size={15} />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel empty-state">
          Select a vehicle above to begin your comparison.
        </div>
      )}
      <p className="demo-note">
        Fictional demonstration data. Prices and performance are concept
        estimates.
      </p>
    </main>
  );
}
export function Technology() {
  const [open, setOpen] = useState(0);
  const [hotspot, setHotspot] = useState<number | null>(null);
  const hotspots = [
    {
      name: "Battery platform",
      text: "A low-mounted 98 kWh concept battery anchors the A1 architecture. Fictional demonstration capacity.",
    },
    {
      name: "Electric drivetrain",
      text: "The A1 imagines a 510 kW dual-motor all-wheel-drive system. Fictional demonstration output.",
    },
    {
      name: "Cabin interface",
      text: "A panoramic display and tactile controls form the interior design study. Explore the original cabin illustration in the gallery.",
    },
  ];
  const sections = [
    {
      icon: <Zap />,
      title: "Electric, without compromise.",
      text: "Our concepts explore an electric architecture with a low centre of gravity, balanced mass distribution and a cabin designed around quiet movement.",
    },
    {
      icon: <Wind />,
      title: "Sculpted by the air.",
      text: "A continuous silhouette, a closed front surface and purposeful wheel designs express our approach to aerodynamic design. The interactive models are original procedural concepts.",
    },
    {
      icon: <Shield />,
      title: "Human at the centre.",
      text: "Clear controls, deliberate lighting and generous sightlines guide the design language. These are design studies, not production vehicles or certified safety systems.",
    },
  ];
  return (
    <main className="page-shell">
      <Heading
        label="THE INTELLIGENCE WITHIN"
        title="Progress you can feel."
        text="The best technology makes every journey simpler, quieter and more connected."
      />
      <div className="technology-visual">
        <CarScene
          model="a1"
          color="#C4CAD0"
          wheels="aero"
          environment="night"
          lighting
          angle="front"
          resetKey={0}
          interactive={false}
        />
        <span className="technical-label">
          AERION ELECTRIC ARCHITECTURE / CONCEPT STUDY
        </span>
        <div className="tech-hotspots">
          {hotspots.map((h, i) => (
            <button
              key={h.name}
              className={`tech-hotspot hotspot-${i}`}
              aria-expanded={hotspot === i}
              onClick={() => setHotspot(hotspot === i ? null : i)}
            >
              <span>+</span>
              {h.name}
            </button>
          ))}
        </div>
        {hotspot !== null && (
          <div className="hotspot-detail" role="status">
            <h3>{hotspots[hotspot].name}</h3>
            <p>{hotspots[hotspot].text}</p>
          </div>
        )}
      </div>
      <section className="technology-grid">
        {sections.map((s, i) => (
          <article className="panel" key={s.title}>
            <span className="tech-icon">{s.icon}</span>
            <p className="eyebrow">0{i + 1} / ENGINEERING PHILOSOPHY</p>
            <h2>{s.title}</h2>
            <p className="muted">{s.text}</p>
          </article>
        ))}
      </section>
      <section className="split-layout">
        <div>
          <p className="eyebrow">A CLOSER LOOK</p>
          <h2>Questions drive innovation.</h2>
        </div>
        <div>
          {[
            "What powers these concepts?",
            "Can I explore the interior?",
            "Are performance figures certified?",
          ].map((q, i) => (
            <div className="faq-item" key={q}>
              <button
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {q}
                <span>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <p className="muted">
                  {
                    [
                      "Our five fictional electric concepts share a demonstration specification model. Explore the comparison page for battery, power and drivetrain details.",
                      "The current procedural models support exterior configuration. An interior view is not offered because a compatible detailed interior model is not yet included.",
                      "No. All performance figures are clearly labelled fictional concept estimates for this interactive demonstration.",
                    ][i]
                  }
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
export function Story() {
  return (
    <main className="page-shell story-page">
      <Heading
        label="OUR STORY / EST. 2026"
        title="The future is a direction."
        text="AERION DRIVE is an independent fictional design universe built around one idea: movement should inspire."
      />
      <div className="story-image">
        <img
          src="/images/a1.svg"
          alt="Aerion original silver electric concept"
        />
        <span>FORM. FEELING. FORWARD.</span>
      </div>
      <section className="split-layout">
        <div>
          <p className="eyebrow">OUR PHILOSOPHY</p>
          <h2>Created for the road ahead.</h2>
        </div>
        <div>
          <p className="large-copy">
            We began with a blank canvas. No inherited silhouette. No familiar
            badge. Just the possibility of creating something that feels
            entirely its own.
          </p>
          <p className="muted">
            Aerion brings five original vehicle concepts into an interactive
            digital exhibition. From the compact Pulse to the expressive Vortex,
            each explores a different relationship between driver, machine and
            environment.
          </p>
          <Link className="button" to="/explore">
            Meet the collection <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <div className="story-values">
        {[
          [
            "01",
            "Purpose in every line",
            "A clear silhouette. A confident stance. Detail that earns its place.",
          ],
          [
            "02",
            "A new kind of energy",
            "Electric concepts that put calm, character and possibility at the centre.",
          ],
          [
            "03",
            "Built to be explored",
            "An open invitation to rotate, customise, compare and discover.",
          ],
        ].map(([n, t, d]) => (
          <article className="panel" key={n}>
            <p className="eyebrow">{n} / AERION PRINCIPLE</p>
            <h3>{t}</h3>
            <p className="muted">{d}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
type Media = { url: string; alt: string; category: string };
export function Gallery() {
  const vehicles = useVehicles();
  const [items, setItems] = useState<Media[]>([
    ...demoVehicles.flatMap((v) => v.media),
    ...editorialGallery,
  ]);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("editorial");
  const [index, setIndex] = useState<number | null>(null);
  const touch = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    api("/gallery")
      .then((d) => setItems(d.items))
      .catch(() =>
        setItems([...vehicles.flatMap((v) => v.media), ...editorialGallery]),
      );
  }, [vehicles]);
  const filtered = items.filter(
    (i) => filter === "All" || i.category === filter,
  );
  const move = (delta: number) =>
    setIndex((i) =>
      i === null ? null : (i + delta + filtered.length) % filtered.length,
    );
  useEffect(() => {
    if (index === null) return;
    const previousFocus = opener.current;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const controls = Array.from(
          document.querySelectorAll<HTMLButtonElement>(".lightbox button"),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = old;
      previousFocus?.focus();
    };
  }, [index === null, filtered.length]);
  return (
    <main className="page-shell">
      <Heading
        label="THE VISUAL JOURNAL"
        title="Perspective changes everything."
        text="An original collection of form, light and motion. Open a frame to take a closer look."
      />
      <div className="collection-toolbar">
        <div className="filter-chips">
          {["All", ...new Set(items.map((i) => i.category))].map((c) => (
            <button
              key={c}
              className={`chip ${filter === c ? "active" : ""}`}
              onClick={() => {
                setFilter(c);
                setIndex(null);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {["editorial", "grid"].map((v) => (
            <button
              key={v}
              className={`chip ${view === v ? "active" : ""}`}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className={`gallery-grid ${view}`}>
        {filtered.map((item, i) => (
          <button
            className="gallery-frame"
            key={`${item.url}-${i}`}
            onClick={(e) => {
              opener.current = e.currentTarget;
              setIndex(i);
            }}
          >
            <img src={item.url} alt={item.alt} loading="lazy" />
            <span>
              {item.alt}
              <ArrowUpRight size={18} />
            </span>
          </button>
        ))}
      </div>
      {index !== null && filtered[index] && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          onTouchStart={(e) => {
            touch.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const delta = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(delta) > 50) move(delta < 0 ? 1 : -1);
          }}
        >
          <button
            autoFocus
            className="icon-button lightbox-close"
            aria-label="Close gallery"
            onClick={() => setIndex(null)}
          >
            <X />
          </button>
          <button
            className="icon-button"
            aria-label="Previous image"
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </button>
          <figure>
            <img src={filtered[index].url} alt={filtered[index].alt} />
            <figcaption>
              {filtered[index].alt}{" "}
              <span>
                {index + 1} / {filtered.length}
              </span>
            </figcaption>
          </figure>
          <button
            className="icon-button"
            aria-label="Next image"
            onClick={() => move(1)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </main>
  );
}
function Field({
  name,
  label,
  type = "text",
  required = true,
  ...props
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: string;
  autoComplete?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input name={name} type={type} required={required} {...props} />
    </label>
  );
}
function EnquiryForm({ booking }: { booking: boolean }) {
  const vehicles = useVehicles();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    setBusy(true);
    setStatus("");
    setSuccess(false);
    try {
      const data = await api(booking ? "/test-drives" : "/contact", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatus(
        data.message ||
          (booking
            ? "Your test-drive enquiry has been received. The requested time is not a confirmed appointment."
            : "Your enquiry has been received."),
      );
      setSuccess(true);
      form.reset();
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="enquiry-form panel" onSubmit={submit}>
      <div className="form-grid">
        <Field name="name" label="Full name" autoComplete="name" />
        <Field
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
        />
        {booking ? (
          <>
            <Field
              name="phone"
              label="Phone number"
              type="tel"
              autoComplete="tel"
            />
            <label className="field">
              <span>Vehicle model *</span>
              <select
                name="vehicle"
                required
                defaultValue={params.get("model") || ""}
              >
                <option value="" disabled>
                  Select a model
                </option>
                {vehicles.map((v) => (
                  <option value={v.slug} key={v.slug}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              name="date"
              label="Preferred date"
              type="date"
              min={today.toISOString().slice(0, 10)}
            />
            <Field name="time" label="Preferred time" type="time" />
            <label className="field full-width">
              <span>Location *</span>
              <select name="location" required defaultValue="">
                <option value="" disabled>
                  Select demo location
                </option>
                <option>Virtual design studio</option>
                <option>Demo showroom enquiry</option>
              </select>
            </label>
          </>
        ) : (
          <label className="field full-width">
            <span>Department *</span>
            <select name="department" required>
              <option value="General">General enquiry</option>
              <option value="Sales">Vehicle enquiries</option>
              <option value="Press">Press & partnerships</option>
              <option value="Support">Technical support</option>
            </select>
          </label>
        )}
        <label className="field full-width">
          <span>{booking ? "Additional message" : "Your message *"}</span>
          <textarea
            name="message"
            rows={4}
            required={!booking}
            maxLength={3000}
          />
        </label>
      </div>
      <p className="muted form-note">
        {booking
          ? "This is a fictional vehicle demonstration. Dates and times are requests, not confirmed appointments. No payment is collected."
          : "AERION DRIVE is a fictional automotive exhibition. Your message is stored as an enquiry in this demonstration."}
      </p>
      <button className="button" disabled={busy} type="submit">
        {busy
          ? "Sending enquiry…"
          : booking
            ? "Request test drive"
            : "Send message"}
        <ArrowUpRight size={18} />
      </button>
      {status && (
        <p
          className={`status ${success ? "success" : "error"}`}
          role={success ? "status" : "alert"}
        >
          {status}
        </p>
      )}
    </form>
  );
}
export function Booking() {
  return (
    <main className="page-shell">
      <Heading
        label="EXPERIENCE AERION"
        title="Your next chapter starts here."
        text="Tell us what moves you. Request a demonstration and explore the Aerion design universe."
      />
      <div className="split-layout form-layout">
        <aside>
          <p className="eyebrow">A DRIVE WITH A DIFFERENCE</p>
          <h2>Get closer to possibility.</h2>
          <p className="muted">
            Choose your concept, preferred date and time. This enquiry system
            records your interest; it does not make a confirmed appointment.
          </p>
          <div className="booking-image">
            <img
              src="/images/a1.svg"
              alt="Aerion silver sports coupe concept"
            />
          </div>
          <p className="demo-note">
            Fictional demo locations. No real showroom address is represented.
          </p>
        </aside>
        <EnquiryForm booking />
      </div>
    </main>
  );
}
export function Contact() {
  const [faq, setFaq] = useState(-1);
  return (
    <main className="page-shell">
      <Heading
        label="LET’S CONNECT"
        title="Every conversation moves us forward."
        text="A question, an idea, a new perspective. We’re listening."
      />
      <div className="split-layout form-layout">
        <aside>
          <p className="eyebrow">AERION DESIGN STUDIO</p>
          <h2>Start a conversation.</h2>
          <p className="muted">
            Use the form to send your enquiry to the demonstration backend.
          </p>
          <div className="contact-detail">
            <span>Demo email</span>
            <strong>hello@aerion.example</strong>
            <span>Demo studio</span>
            <strong>Virtual design exhibition</strong>
            <span>Social presence</span>
            <strong>Concept brand · no official accounts</strong>
          </div>
          <p className="demo-note">All contact information is fictional.</p>
        </aside>
        <EnquiryForm booking={false} />
      </div>
      <section className="faq-section">
        <p className="eyebrow">GOOD TO KNOW</p>
        <h2>A few answers, ahead of time.</h2>
        {[
          "Is AERION a real vehicle manufacturer?",
          "Can I save and share my configuration?",
          "What happens after I submit an enquiry?",
        ].map((q, i) => (
          <div key={q} className="faq-item">
            <button
              aria-expanded={faq === i}
              onClick={() => setFaq(faq === i ? -1 : i)}
            >
              {q}
              <span>{faq === i ? "−" : "+"}</span>
            </button>
            {faq === i && (
              <p className="muted">
                {
                  [
                    "AERION DRIVE is an original fictional automotive concept exhibition. The vehicles, pricing and performance data are demonstrations.",
                    "Yes. Save stores your configuration on this device. Share creates a URL containing the selected model, colour, wheels and environment.",
                    "The application records your request. No email delivery or confirmed scheduling is implied without a separately configured integration.",
                  ][i]
                }
              </p>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
type AdminRecord = Record<string, unknown>;
export function Admin() {
  const [user, setUser] = useState<AdminRecord | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("overview");
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [overview, setOverview] = useState<AdminRecord>({});
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async (section = tab) => {
    try {
      const d = await api(`/admin/${section}`);
      if (section === "overview") setOverview(d);
      else
        setRecords(
          d.items ||
            d.requests ||
            d.contacts ||
            d.vehicles ||
            d.submissions ||
            [],
        );
    } catch (e) {
      setStatus((e as Error).message);
    }
  };
  useEffect(() => {
    api("/admin/me")
      .then((d) => setUser(d.user || d.admin || d))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (user) {
      setRecords([]);
      setStatus("");
      load();
    }
  }, [tab, user]);
  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api("/admin/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      setUser(data.user || data.admin || data);
      setStatus("");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const changeStatus = async (r: AdminRecord, value: string) => {
    try {
      await api(`/admin/${tab}/${r._id || r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      setStatus("Status updated.");
      load();
    } catch (e) {
      setStatus((e as Error).message);
    }
  };
  const saveRecord = async () => {
    setBusy(true);
    try {
      const data = JSON.parse(draft);
      await api(
        `/admin/${tab}${editing ? `/${tab === "vehicles" ? editing.slug : editing.id || editing._id}` : ""}`,
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) },
      );
      setStatus("Changes saved.");
      setDraft("");
      setEditing(null);
      load();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (checking)
    return (
      <main className="page-shell">
        <p className="muted">Checking administrator session…</p>
      </main>
    );
  if (!user)
    return (
      <main className="page-shell admin-login">
        <Heading
          label="PRIVATE ACCESS"
          title="Studio administration."
          text="Sign in with the administrator account configured on the server."
        />
        <form className="panel" onSubmit={login}>
          <Field
            name="email"
            label="Admin email"
            type="email"
            autoComplete="username"
          />
          <Field
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <button className="button" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
          {status && (
            <p className="status error" role="alert">
              {status}
            </p>
          )}
        </form>
      </main>
    );
  return (
    <main className="page-shell admin-page">
      <div className="collection-toolbar">
        <Heading label="PRIVATE STUDIO" title="Administration." />
        <button
          className="button-outline"
          onClick={async () => {
            try {
              await api("/admin/logout", { method: "POST" });
              setUser(null);
            } catch (e) {
              setStatus((e as Error).message);
            }
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      <div className="filter-chips">
        {["overview", "test-drives", "contacts", "vehicles", "gallery"].map(
          (t) => (
            <button
              key={t}
              className={`chip ${tab === t ? "active" : ""}`}
              onClick={() => {
                setTab(t);
                setDraft("");
                setEditing(null);
              }}
            >
              {t.replace("-", " ")}
            </button>
          ),
        )}
      </div>
      {status && (
        <p role="status" className="status">
          {status}
        </p>
      )}
      {tab === "overview" ? (
        <div className="admin-stats">
          {Object.entries(overview)
            .filter(([, v]) => typeof v === "number")
            .map(([k, v]) => (
              <div className="panel" key={k}>
                <p className="eyebrow">{k.replace(/([A-Z])/g, " $1")}</p>
                <strong>{String(v)}</strong>
              </div>
            ))}
        </div>
      ) : (
        <>
          <div className="collection-toolbar">
            <label className="search-control">
              <Search size={17} />
              <input
                aria-label="Search records"
                value={search}
                placeholder="Search records…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {["vehicles", "gallery"].includes(tab) && (
              <button
                className="button-outline"
                onClick={() => {
                  setEditing(null);
                  setDraft(
                    JSON.stringify(
                      tab === "vehicles"
                        ? {
                            ...demoVehicles[0],
                            id: "new-concept",
                            slug: "new-concept",
                            name: "New concept",
                            published: false,
                          }
                        : {
                            url: "/images/a1.svg",
                            alt: "New gallery image",
                            category: "Studio",
                          },
                      null,
                      2,
                    ),
                  );
                }}
              >
                Add {tab === "vehicles" ? "vehicle" : "image"}
              </button>
            )}
          </div>
          <div className="admin-records">
            {records
              .filter((r) =>
                JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
              )
              .map((r, i) => (
                <article
                  className="panel admin-record"
                  key={String(r._id || r.id || i)}
                >
                  <div>
                    <h3>{String(r.name || r.alt || r.email || "Record")}</h3>
                    {Object.entries(r)
                      .filter(
                        ([k, v]) =>
                          !["_id", "__v", "passwordHash", "name"].includes(k) &&
                          (typeof v === "string" || typeof v === "number"),
                      )
                      .map(([k, v]) => (
                        <p key={k}>
                          <span className="muted">{k}: </span>
                          {String(v)}
                        </p>
                      ))}
                  </div>
                  {["test-drives", "contacts"].includes(tab) ? (
                    <label className="field">
                      <span>Request status</span>
                      <select
                        value={String(r.status || "new")}
                        onChange={(e) => changeStatus(r, e.target.value)}
                      >
                        {["new", "reviewing", "contacted", "closed"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </label>
                  ) : (
                    <button
                      className="button-outline"
                      onClick={() => {
                        setEditing(r);
                        setDraft(JSON.stringify(r, null, 2));
                      }}
                    >
                      Edit
                    </button>
                  )}
                </article>
              ))}
            {!records.length && (
              <div className="panel empty-state">No records to display.</div>
            )}
          </div>
        </>
      )}
      {draft && (
        <section className="panel admin-editor">
          <h2>{editing ? "Edit record" : "Create record"}</h2>
          <p className="muted">
            Edit the structured record. Server validation checks every change.
          </p>
          <textarea
            aria-label="Record JSON"
            rows={18}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="config-actions">
            <button className="button" disabled={busy} onClick={saveRecord}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              className="button-outline"
              onClick={() => {
                setDraft("");
                setEditing(null);
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
export function NotFound() {
  return (
    <main className="page-shell not-found">
      <p className="eyebrow">404 / OFF THE MAP</p>
      <h1>A new direction awaits.</h1>
      <p className="muted">
        The page you’re looking for has moved beyond our horizon.
      </p>
      <Link className="button" to="/">
        Return to the experience <ArrowUpRight size={18} />
      </Link>
    </main>
  );
}
