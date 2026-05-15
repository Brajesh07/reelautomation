import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { renderDraftFrame } from "../components/DraftFrame";
import { renderIntroFrame } from "../components/IntroFrame";
import { renderOutroFrame } from "../components/OutroFrame";
import { formatDate } from "../utils/dateFormatter";

import heart from "../images/heart.png";
import trophy from "../images/trophy.png";
import moneyBag from "../images/money-bag.png";
import crystalBall from "../images/crystal-ball.png";

import aries from "../images/aries.png";
import taurus from "../images/Taurus.png";
import gemini from "../images/Gemini.png";
import cancer from "../images/Cancer.png";
import leo from "../images/Leo.png";
import virgo from "../images/Virgo.png";
import libra from "../images/Libra.png";
import scorpio from "../images/scorpio.png";
import sagittarius from "../images/Sagittarius.png";
import capricorn from "../images/Capricorn.png";
import aquarius from "../images/Aquarius.png";
import pisces from "../images/Pisces.png";

const decorativeSources = [heart, trophy, moneyBag, crystalBall];
const ringIconSources = [
  aries,
  taurus,
  gemini,
  cancer,
  leo,
  virgo,
  libra,
  scorpio,
  sagittarius,
  capricorn,
  aquarius,
  pisces,
];

const zodiacIconMap = {
  Aries: aries,
  Taurus: taurus,
  Gemini: gemini,
  Cancer: cancer,
  Leo: leo,
  Virgo: virgo,
  Libra: libra,
  Scorpio: scorpio,
  Sagittarius: sagittarius,
  Capricorn: capricorn,
  Aquarius: aquarius,
  Pisces: pisces,
};

// ─── Font-size slider config per frame ───────────────────────────────────────
const FONT_CONTROLS = {
  intro: [
    {
      key: "titleText",
      label: "Title Text Size",
      min: 24,
      max: 72,
      default: 42,
    },
    {
      key: "titleTextLH",
      label: "Title Line Spacing",
      min: 0.8,
      max: 2.5,
      step: 0.1,
      default: 1.4,
    },
  ],
  zodiac: [
    {
      key: "zodiacName",
      label: "Zodiac Name Size",
      min: 24,
      max: 72,
      default: 48,
    },
    { key: "vibe", label: "Vibe Text Size", min: 20, max: 60, default: 36 },
    {
      key: "vibeLH",
      label: "Vibe Line Height",
      min: 0.8,
      max: 2.5,
      step: 0.1,
      default: 1.4,
    },
    {
      key: "sectionLabel",
      label: "Section Labels Size",
      min: 20,
      max: 60,
      default: 40,
    },
    {
      key: "boxContent",
      label: "Box Content Size",
      min: 16,
      max: 52,
      default: 32,
    },
    {
      key: "boxContentLH",
      label: "Box Line Height",
      min: 0.8,
      max: 2.5,
      step: 0.1,
      default: 1.4,
    },
  ],
  outro: [
    {
      key: "sectionLabel",
      label: "Question Text Size",
      min: 20,
      max: 60,
      default: 42,
    },
    {
      key: "sectionLabelLH",
      label: "Question Line Spacing",
      min: 0.8,
      max: 2.5,
      step: 0.1,
      default: 1.4,
    },
    {
      key: "boxContent",
      label: "Box Content Size",
      min: 16,
      max: 52,
      default: 32,
    },
    {
      key: "boxContentLH",
      label: "Box Line Height",
      min: 0.8,
      max: 2.5,
      step: 0.1,
      default: 1.4,
    },
  ],
};

const DEFAULT_FONT_SIZES = {
  titleText: 42,
  titleTextLH: 1.4,
  zodiacName: 48,
  vibe: 36,
  vibeLH: 1.4,
  sectionLabel: 40,
  sectionLabelLH: 1.4,
  boxContent: 32,
  boxContentLH: 1.4,
};

// ─── Tool Panel component ─────────────────────────────────────────────────────
const ToolPanel = ({ selectedFrame, fontSizes, onChange }) => {
  const controls = FONT_CONTROLS[selectedFrame] || [];

  if (!selectedFrame || controls.length === 0)
    return (
      <div className="w-64 shrink-0 bg-[#111] rounded-xl border border-white/10 p-5 flex items-center justify-center">
        <p className="text-gray-600 text-sm text-center">
          Select a frame to see
          <br />
          font controls
        </p>
      </div>
    );

  return (
    <div className="w-64 shrink-0 bg-[#111] rounded-xl border border-white/10 p-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-120px)]">
      <h3 className="text-[#DAC477] font-bold text-sm uppercase tracking-widest">
        Typography
      </h3>

      {controls.map((ctrl) => (
        <div key={ctrl.key} className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-gray-300 text-[11px] font-medium">
              {ctrl.label}
            </label>
            <span className="text-[#DAC477] text-[10px] font-mono bg-[#DAC477]/10 px-2 py-0.5 rounded">
              {fontSizes[ctrl.key] ?? ctrl.default}
              {ctrl.key.endsWith("LH") ? "" : "px"}
            </span>
          </div>
          <input
            type="range"
            min={ctrl.min}
            max={ctrl.max}
            step={ctrl.step ?? 1}
            value={fontSizes[ctrl.key] ?? ctrl.default}
            onChange={(e) => onChange(ctrl.key, Number(e.target.value))}
            className="w-full accent-[#DAC477] cursor-pointer"
          />
          <div className="flex justify-between text-gray-600 text-[9px]">
            <span>
              {ctrl.min}
              {ctrl.key.endsWith("LH") ? "" : "px"}
            </span>
            <span>
              {ctrl.max}
              {ctrl.key.endsWith("LH") ? "" : "px"}
            </span>
          </div>
        </div>
      ))}

      <button
        onClick={() => {
          controls.forEach((c) => onChange(c.key, c.default));
        }}
        className="mt-2 py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-colors"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DesignPreview = () => {
  const canvasRef = useRef(null);

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [zodiacs, setZodiacs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [replayKey, setReplayKey] = useState(0);

  // Restore persisted font config if available
  const [fontSizes, setFontSizes] = useState(() => {
    try {
      const saved = localStorage.getItem("fontConfig");
      return saved
        ? { ...DEFAULT_FONT_SIZES, ...JSON.parse(saved) }
        : { ...DEFAULT_FONT_SIZES };
    } catch {
      return { ...DEFAULT_FONT_SIZES };
    }
  });
  const fontSizesRef = useRef(fontSizes);

  const imagesRef = useRef([]); // decorative images
  const zodiacIconsRef = useRef({}); // zodiac icons by name
  const ringImagesRef = useRef([]); // all 12 for ring
  const timelineRef = useRef(null);
  const animStateRef = useRef(null);
  const renderRef = useRef(null); // always points to the current frame's draw fn

  // Keep fontSizesRef in sync — lets GSAP onUpdate callbacks read fresh sizes
  useEffect(() => {
    fontSizesRef.current = fontSizes;
    // Persist for recording (Render engine reads this before starting)
    localStorage.setItem("fontConfig", JSON.stringify(fontSizes));
    // Force immediate canvas repaint even if GSAP timeline is idle/complete
    renderRef.current?.();
  }, [fontSizes]);

  const updateFontSize = (key, value) => {
    // Write to ref first so the forced repaint below reads the new value
    fontSizesRef.current = { ...fontSizesRef.current, [key]: value };
    // Flush to state (triggers the useEffect above for persistence + ref sync)
    setFontSizes({ ...fontSizesRef.current });
  };

  // ── 1. Fetch Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const customData = localStorage.getItem("customZodiacData");
    const parse = (raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
    const loaded = customData ? parse(customData) : null;
    if (loaded?.zodiacs?.length) {
      setZodiacs(loaded.zodiacs);
    } else {
      fetch("/data.json")
        .then((r) => r.json())
        .then((d) => {
          if (d.zodiacs?.length) setZodiacs(d.zodiacs);
        })
        .catch((err) => console.error("DesignPreview fetch error:", err));
    }
  }, []);

  // ── 2. Load Assets ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (zodiacs.length === 0) return;

    const uniqueNames = [...new Set(zodiacs.map((z) => z.name))];
    // decorative + unique zodiac icons + 12 ring icons
    const total =
      decorativeSources.length + uniqueNames.length + ringIconSources.length;
    let loaded = 0;

    const onLoad = () => {
      loaded++;
      if (loaded === total) setImagesLoaded(true);
    };

    // Decorative
    const loadedDeco = new Array(decorativeSources.length);
    decorativeSources.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedDeco[i] = img;
        imagesRef.current = loadedDeco;
        onLoad();
      };
    });

    // Zodiac icons (by name) for DraftFrame
    uniqueNames.forEach((name) => {
      const img = new Image();
      img.src = zodiacIconMap[name] || zodiacIconMap["Leo"];
      img.onload = () => {
        zodiacIconsRef.current[name] = img;
        onLoad();
      };
    });

    // Ring icons (ordered array) for Intro/Outro
    const loadedRing = new Array(ringIconSources.length);
    ringIconSources.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedRing[i] = img;
        ringImagesRef.current = loadedRing;
        onLoad();
      };
    });
  }, [zodiacs]);

  // ── 3. Animation ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imagesLoaded || !selectedFrame || zodiacs.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = 1920;

    if (timelineRef.current) timelineRef.current.kill();

    // ── INTRO ──────────────────────────────────────────────────────────────
    if (selectedFrame === "intro") {
      const state = {
        scale: 0,
        rotation: -60,
        opacity: 0,
        textFade: 1,
        showText: false,
        text1: "",
        text2: "",
        text3: "",
        text4: "",
        text5: "",
      };
      const highlightedNames = zodiacs.map((z) => z.name);

      const update = () => {
        const textData = state.showText
          ? {
              opacity: state.textFade,
              line1: state.text1,
              line2: state.text2,
              line3: state.text3,
              line4: state.text4,
              line5: state.text5,
            }
          : null;
        renderIntroFrame(
          ctx,
          {
            scale: state.scale,
            rotation: state.rotation,
            opacity: state.opacity,
            images: ringImagesRef.current,
            highlightedNames,
            textData,
          },
          fontSizesRef.current,
        );
      };
      renderRef.current = update;

      const tl = gsap.timeline();
      timelineRef.current = tl;

      tl.to(state, {
        scale: 1,
        opacity: 1,
        rotation: 120,
        duration: 3.5,
        ease: "power2.out",
        onUpdate: update,
      });
      tl.set(state, { showText: true });

      const content = {
        l1: "DAILY",
        l2: "HOROSCOPE",
        l3: "FOR",
        l4: highlightedNames.join(", ").toUpperCase(),
        l5: formatDate(new Date()),
      };
      const counters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };

      const addType = (k, txt, at) => {
        tl.to(
          counters,
          {
            [k]: txt.length,
            duration: txt.length * 0.05,
            ease: "none",
            onUpdate: () => {
              state[`text${k.charAt(1)}`] = txt.substring(
                0,
                Math.ceil(counters[k]),
              );
              update();
            },
          },
          at,
        );
      };
      addType("c1", content.l1, ">");
      addType("c2", content.l2, ">+0.1");
      addType("c3", content.l3, ">+0.1");
      addType("c4", content.l4, ">+0.1");
      addType("c5", content.l5, ">+0.2");

      // ── ZODIAC ─────────────────────────────────────────────────────────────
    } else if (selectedFrame === "zodiac") {
      const currentZodiacData = zodiacs[currentIndex];
      const currentIcon = zodiacIconsRef.current[currentZodiacData?.name];

      const animState = {
        decoY: 100,
        decoOpacity: 0,
        zodiacX: -300,
        zodiacRotation: -360,
        zodiacOpacity: 0,
        zodiacName: "",
        showName: false,
        vibeText: "",
        showVibe: false,
        sections: [
          {
            id: "love",
            title: "LOVE",
            opacity: 0,
            yOffset: 20,
            mask: 0,
            showLabel: false,
            showContent: false,
          },
          {
            id: "career",
            title: "CAREER",
            opacity: 0,
            yOffset: 20,
            mask: 0,
            showLabel: false,
            showContent: false,
          },
          {
            id: "money",
            title: "MONEY",
            opacity: 0,
            yOffset: 20,
            mask: 0,
            showLabel: false,
            showContent: false,
          },
          {
            id: "soul",
            title: "SOUL MESSAGE",
            opacity: 0,
            yOffset: 20,
            mask: 0,
            showLabel: false,
            showContent: false,
          },
        ],
      };
      animStateRef.current = animState;

      const getSectionText = (id) => {
        if (id === "love") return currentZodiacData?.love || "";
        if (id === "career") return currentZodiacData?.career || "";
        if (id === "money") return currentZodiacData?.money || "";
        if (id === "soul") return currentZodiacData?.soulMessage || "";
        return "";
      };

      const update = () => {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const sectionsData = animState.sections.map((s) => ({
          title: s.title,
          text: getSectionText(s.id),
          anim: {
            labelOpacity: s.opacity,
            labelYOffset: s.yOffset,
            maskProgress: s.mask,
            showLabel: s.showLabel,
            showContent: s.showContent,
          },
        }));
        renderDraftFrame(
          ctx,
          {
            decorativeAnim: {
              opacity: animState.decoOpacity,
              yOffset: animState.decoY,
              images: imagesRef.current,
            },
            zodiacAnim: {
              icon: currentIcon,
              xOffset: animState.zodiacX,
              rotation: animState.zodiacRotation,
              opacity: animState.zodiacOpacity,
              name: animState.zodiacName,
              showName: animState.showName,
            },
            vibeAnim: {
              text: animState.vibeText,
              showVibe: animState.showVibe,
            },
            sections: sectionsData,
          },
          fontSizesRef.current,
        );
      };
      renderRef.current = update;

      const tl = gsap.timeline();
      timelineRef.current = tl;

      // Phase 1 & 2: deco + icon entry
      if (currentIndex === 0) {
        tl.to(animState, {
          decoY: 0,
          decoOpacity: 0.4,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: update,
        });
      } else {
        animState.decoY = 0;
        animState.decoOpacity = 0.4;
      }
      tl.to(
        animState,
        {
          zodiacX: 0,
          zodiacRotation: 0,
          zodiacOpacity: 1,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: update,
        },
        "+=0",
      );

      // Phase 3: name typewriter
      tl.set(animState, { showName: true });
      const nameFull = (currentZodiacData?.name || "").toUpperCase();
      const nameCounter = { v: 0 };
      tl.to(nameCounter, {
        v: nameFull.length,
        duration: nameFull.length * 0.1,
        ease: "none",
        onUpdate: () => {
          animState.zodiacName = nameFull.substring(
            0,
            Math.ceil(nameCounter.v),
          );
          update();
        },
      });

      // Phase 4: vibe typewriter
      const vibeFull = "Vibe: " + (currentZodiacData?.vibe || "");
      tl.set(animState, { showVibe: true }, "+=0.3");
      const vibeCounter = { v: 0 };
      tl.to(vibeCounter, {
        v: vibeFull.length,
        duration: vibeFull.length * 0.05,
        ease: "none",
        onUpdate: () => {
          animState.vibeText = vibeFull.substring(0, Math.ceil(vibeCounter.v));
          update();
        },
      });

      // Phase 5: sections
      animState.sections.forEach((section, idx) => {
        const labelDelay = idx === 0 ? "+=0.3" : "-=0.8";
        tl.set(section, { showLabel: true }, labelDelay);
        tl.to(section, {
          opacity: 1,
          yOffset: 0,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: update,
        });
        tl.set(section, { showContent: true }, "-=0.4");
        tl.to(section, {
          mask: 1,
          duration: 1.2,
          ease: "power1.inOut",
          onUpdate: update,
        });
      });

      // Phase 6: hold then transition/exit
      tl.to({}, { duration: 5 });

      const isLast = currentIndex === zodiacs.length - 1;
      if (!isLast) {
        tl.to(
          animState,
          { zodiacOpacity: 0, duration: 1, ease: "power2.in" },
          "exit",
        );
        animState.sections.forEach((s) =>
          tl.to(s, { opacity: 0, mask: 0, duration: 0.8 }, "exit"),
        );
        tl.to(animState, { showVibe: false, duration: 0.5 }, "exit+=0.5");
        tl.call(() => setCurrentIndex((prev) => prev + 1));
      } else {
        tl.to(
          animState,
          {
            decoOpacity: 0,
            zodiacOpacity: 0,
            duration: 2,
            ease: "power2.inOut",
          },
          "finalExit",
        );
        animState.sections.forEach((s) =>
          tl.to(s, { opacity: 0, mask: 0, duration: 1 }, "finalExit"),
        );
        tl.to(
          animState,
          { showVibe: false, showName: false, duration: 1 },
          "finalExit",
        );
      }

      // ── OUTRO ──────────────────────────────────────────────────────────────
    } else if (selectedFrame === "outro") {
      const state = {
        opacity: 0,
        rotation: -60,
        scale: 0,
        text1: "",
        boxWidth: 0,
      };

      const update = () => {
        renderOutroFrame(
          ctx,
          {
            opacity: state.opacity,
            rotation: state.rotation,
            scale: state.scale,
            text1: state.text1,
            boxWidth: state.boxWidth,
            images: ringImagesRef.current,
          },
          fontSizesRef.current,
        );
      };
      renderRef.current = update;

      const tl = gsap.timeline();
      timelineRef.current = tl;

      tl.to(state, {
        scale: 1,
        opacity: 1,
        rotation: 120,
        duration: 3.5,
        ease: "power2.out",
        onUpdate: update,
      });

      const fullText = "Want a personalised reading?";
      const textCounter = { v: 0 };
      tl.to(textCounter, {
        v: fullText.length,
        duration: fullText.length * 0.05,
        ease: "none",
        onUpdate: () => {
          state.text1 = fullText.substring(0, Math.ceil(textCounter.v));
          update();
        },
      });

      tl.to(state, {
        boxWidth: 100,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: update,
      });
      tl.to({}, { duration: 2 });
      tl.to(state, {
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: update,
      });
    }

    return () => {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [imagesLoaded, selectedFrame, zodiacs, currentIndex, replayKey]);

  // Reset zodiac index when switching frames
  const handleFrameSelect = (frame) => {
    setCurrentIndex(0);
    setSelectedFrame(frame);
  };

  const handleReplay = () => {
    setCurrentIndex(0);
    setReplayKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Design Preview</h1>
        <Link to="/" className="text-sm text-[#DAC477] hover:underline">
          ← Back to Upload
        </Link>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex gap-6 px-8 py-6 justify-center items-start md:flex-row flex-col">
        {/* Left: Controls */}
        <div className="w-56 shrink-0 flex flex-col gap-4 sticky top-24">
          <div className="bg-[#111] rounded-xl border border-white/10 p-5 flex flex-col gap-3">
            <h3 className="text-[#DAC477] font-bold text-sm uppercase tracking-widest">
              Frame
            </h3>
            {[
              { val: "intro", label: "🌌 Intro Frame" },
              { val: "zodiac", label: "♊ Zodiac Sequence" },
              { val: "outro", label: "✨ Outro Frame" },
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => handleFrameSelect(f.val)}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                  selectedFrame === f.val
                    ? "bg-[#DAC477] text-black"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleReplay}
            disabled={!selectedFrame}
            className="w-full py-2.5 px-4 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            🔄 Replay
          </button>

          {selectedFrame === "zodiac" && zodiacs.length > 0 && (
            <div className="bg-[#111] rounded-xl border border-white/10 p-4 text-xs text-gray-400">
              <div className="font-semibold text-gray-300 mb-2">
                Zodiac Cards
              </div>
              {zodiacs.map((z, i) => (
                <div
                  key={i}
                  className={`py-1 px-2 rounded ${i === currentIndex ? "text-[#DAC477]" : ""}`}
                >
                  {i === currentIndex ? "▶ " : "○ "}
                  {z.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Canvas */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative bg-black rounded-xl overflow-hidden"
            style={{
              width: "405px",
              height: "720px",
              boxShadow: "0 0 40px rgba(0,0,0,0.6)",
            }}
          >
            <canvas
              ref={canvasRef}
              className="block"
              style={{ width: "405px", height: "720px" }}
            />
            {!selectedFrame && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-600 text-sm">
                  Select a frame to preview
                </p>
              </div>
            )}
            {!imagesLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-gray-400 text-sm">Loading assets…</p>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-xs">
            1080 × 1920 canvas · previewed at 405 × 720
          </p>
        </div>

        {/* Right: Font-size tool panel */}
        <ToolPanel
          selectedFrame={selectedFrame}
          fontSizes={fontSizes}
          onChange={updateFontSize}
        />
      </div>
    </div>
  );
};

export default DesignPreview;
