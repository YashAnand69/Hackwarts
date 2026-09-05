import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Wand2, Flame, Shield, Compass, Star, Award, Search, Zap, CheckCircle2 } from "lucide-react";
import { playWandSwoosh, playMagicalSparkle } from "../utils/audio";

interface Spell {
  id: string;
  name: string;
  incantation: string;
  type: "Charm" | "Defense" | "Transfiguration" | "Hex" | "Utility";
  level: "Beginner" | "Intermediate" | "Advanced" | "Mastery";
  description: string;
  color: string;
  glowColor: string;
  effectType: "patronus" | "lumos" | "fire" | "levitate" | "shield" | "unlock";
  tagMatch: string;
}

const SPELL_CATALOG: Spell[] = [
  {
    id: "expecto_patronum",
    name: "Patronus Charm",
    incantation: "Expecto Patronum",
    type: "Defense",
    level: "Advanced",
    description: "Conjures a silver guardian powered by positive emotions to repel Dementors and Lethifolds.",
    color: "#E0F2FE",
    glowColor: "#38BDF8",
    effectType: "patronus",
    tagMatch: "Expecto Patronum"
  },
  {
    id: "expelliarmus",
    name: "Disarming Charm",
    incantation: "Expelliarmus",
    type: "Defense",
    level: "Beginner",
    description: "Causes whatever the victim is holding to fly out of their hand. Harry Potter's signature duel move.",
    color: "#FEE2E2",
    glowColor: "#EF4444",
    effectType: "fire",
    tagMatch: "Defense Against the Dark Arts"
  },
  {
    id: "lumos",
    name: "Wand-Lighting Charm",
    incantation: "Lumos Maxima",
    type: "Charm",
    level: "Beginner",
    description: "Illuminates the tip of the caster's wand with blinding magical white light.",
    color: "#FEF9C3",
    glowColor: "#EAB308",
    effectType: "lumos",
    tagMatch: "Charms & Alohomora"
  },
  {
    id: "wingardium_leviosa",
    name: "Levitation Charm",
    incantation: "Wingardium Leviosa",
    type: "Charm",
    level: "Beginner",
    description: "Makes objects fly or levitate through the air. Swish and flick!",
    color: "#EDE9FE",
    glowColor: "#A855F7",
    effectType: "levitate",
    tagMatch: "Charms & Alohomora"
  },
  {
    id: "protego",
    name: "Shield Charm",
    incantation: "Protego Horribilis",
    type: "Defense",
    level: "Intermediate",
    description: "Creates an invisible barrier that deflects minor hexes, jinxes, and physical projectiles.",
    color: "#DCFCE7",
    glowColor: "#22C55E",
    effectType: "shield",
    tagMatch: "Defense Against the Dark Arts"
  },
  {
    id: "incendio",
    name: "Fire-Making Spell",
    incantation: "Incendio",
    type: "Hex",
    level: "Intermediate",
    description: "Conjures a jet of crackling magical orange flame from the wand tip.",
    color: "#FFEDD5",
    glowColor: "#F97316",
    effectType: "fire",
    tagMatch: "Advanced Potions"
  },
  {
    id: "alohomora",
    name: "Unlocking Charm",
    incantation: "Alohomora",
    type: "Utility",
    level: "Beginner",
    description: "Unlocks and opens doors and windows that are not protected by anti-alohomora enchantments.",
    color: "#FEF08A",
    glowColor: "#CA8A04",
    effectType: "unlock",
    tagMatch: "Charms & Alohomora"
  }
];

interface SpellPracticeRoomProps {
  onFindTutorForSpell?: (spellTag: string) => void;
}

export default function SpellPracticeRoom({ onFindTutorForSpell }: SpellPracticeRoomProps) {
  const [selectedSpell, setSelectedSpell] = useState<Spell>(SPELL_CATALOG[0]);
  const [isCasting, setIsCasting] = useState(false);
  const [castCount, setCastCount] = useState<Record<string, number>>({});
  const [spellFilter, setSpellFilter] = useState<string>("All");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCast = () => {
    setIsCasting(true);
    playWandSwoosh();
    
    // Increment practice stats
    setCastCount(prev => ({
      ...prev,
      [selectedSpell.id]: (prev[selectedSpell.id] || 0) + 1
    }));

    setTimeout(() => {
      playMagicalSparkle();
    }, 300);

    setTimeout(() => {
      setIsCasting(false);
    }, 1200);
  };

  // Canvas particle animations during casting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number; color: string }[] = [];

    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);

    if (isCasting) {
      // Spawn magic burst
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
          x: width / 2,
          y: height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 5 + 2,
          alpha: 1,
          color: selectedSpell.glowColor
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.radius = Math.max(0, p.radius - 0.05);

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        } else {
          particles.splice(idx, 1);
        }
      });

      if (particles.length > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    if (isCasting) {
      render();
    }

    return () => cancelAnimationFrame(animId);
  }, [isCasting, selectedSpell]);

  const filteredSpells = SPELL_CATALOG.filter(s => {
    if (spellFilter === "All") return true;
    return s.type === spellFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in text-[#2C1E14] dark:text-[#EDE7E0]">
      {/* Header Banner */}
      <div className="rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 sm:p-8 shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894] transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-[#ECB939] px-3 py-1 text-xs font-black text-[#1A0F00] border-2 border-[#4A321E] shadow-[1.5px_1.5px_0px_#4A321E]">
                Duelling Club Sandbox
              </span>
              <span className="text-xs font-bold text-[#4A321E]/60 dark:text-white/60">
                Wand Practice & Skill Preview
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#4A321E] dark:text-[#FFE894] tracking-tight">
              Spellcraft Training Room 🪄
            </h2>
            <p className="text-xs font-semibold text-[#4A321E]/75 dark:text-white/75 mt-1.5 max-w-2xl leading-relaxed">
              Master the precise incantations, evaluate wand harmonics, and practice spells before proposing Hogwarts mentor exchanges.
            </p>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap gap-2">
            {["All", "Charm", "Defense", "Hex", "Utility"].map(type => (
              <button
                key={type}
                onClick={() => setSpellFilter(type)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  spellFilter === type
                    ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E]"
                    : "bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E] dark:text-white border-2 border-[#4A321E]/20 hover:bg-[#ECB939]/20"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Spell Selector & Practice Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Spell List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black text-[#4A321E]/60 dark:text-white/60 uppercase tracking-wider mb-2">
            Standard Book of Spells (Select Spell)
          </h3>
          <div className="space-y-3">
            {filteredSpells.map(spell => {
              const isSelected = selectedSpell.id === spell.id;
              const casts = castCount[spell.id] || 0;
              return (
                <button
                  key={spell.id}
                  onClick={() => setSelectedSpell(spell)}
                  className={`w-full text-left p-4 rounded-2xl border-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white dark:bg-[#1C1625] border-[#4A321E] dark:border-[#FFE894] shadow-[4px_4px_0px_#4A321E] dark:shadow-[4px_4px_0px_#FFE894] translate-x-1"
                      : "bg-[#FDF9EE] dark:bg-[#251B33] border-[#4A321E]/20 dark:border-white/10 hover:border-[#4A321E] hover:bg-white dark:hover:bg-[#1C1625]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black font-serif text-[#4A321E] dark:text-[#FFE894]">
                      {spell.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#4A321E]/20 bg-[#ECB939]/20 text-[#1A0F00] dark:text-[#FFE894]">
                      {spell.level}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono italic text-[#740001] dark:text-[#ECB939] font-bold">
                    "{spell.incantation}"
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#4A321E]/10 dark:border-white/10 text-[10px] font-semibold text-[#4A321E]/60 dark:text-white/60">
                    <span>{spell.type}</span>
                    <span>Cast {casts} times</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Interactive Duel & Practice Stage */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 sm:p-8 shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894] overflow-hidden min-h-[420px] flex flex-col justify-between">
            
            {/* Canvas overlay for particle burst */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none z-10 w-full h-full"
            />

            {/* Stage Header */}
            <div className="flex items-start justify-between relative z-20">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#740001] dark:text-[#ECB939] block mb-1">
                  Active Spellcraft
                </span>
                <h3 className="text-2xl font-black font-serif text-[#4A321E] dark:text-[#FFE894]">
                  {selectedSpell.name}
                </h3>
                <p className="text-sm font-mono font-bold text-[#740001] dark:text-[#FFE894] mt-0.5">
                  ✦ {selectedSpell.incantation} ✦
                </p>
              </div>

              <div className="rounded-2xl bg-[#FDF9EE] dark:bg-[#251B33] border-2 border-[#4A321E] dark:border-[#FFE894] p-3 text-center shadow-[2px_2px_0px_#4A321E]">
                <span className="text-[10px] font-bold text-[#4A321E]/60 dark:text-white/60 block">Proficiency</span>
                <span className="text-sm font-black text-[#4A321E] dark:text-[#FFE894]">
                  {Math.min(100, (castCount[selectedSpell.id] || 0) * 15 + 10)}%
                </span>
              </div>
            </div>

            {/* Central Magic Manifestation Visual Area */}
            <div className="my-8 flex flex-col items-center justify-center text-center relative z-20">
              <div
                className={`w-32 h-32 rounded-full border-4 border-[#4A321E] dark:border-[#FFE894] flex items-center justify-center text-5xl shadow-[4px_4px_0px_#4A321E] transition-all duration-300 ${
                  isCasting
                    ? "scale-125 rotate-12 ring-8 ring-[#ECB939]/40 bg-[#ECB939]/30"
                    : "bg-[#FDF9EE] dark:bg-[#251B33] hover:scale-105"
                }`}
                style={{
                  boxShadow: isCasting ? `0 0 40px ${selectedSpell.glowColor}` : undefined
                }}
              >
                {selectedSpell.effectType === "patronus" && (isCasting ? "🦌" : "✨")}
                {selectedSpell.effectType === "fire" && (isCasting ? "🔥" : "💥")}
                {selectedSpell.effectType === "lumos" && (isCasting ? "💡" : "🪄")}
                {selectedSpell.effectType === "levitate" && (isCasting ? "🪶" : "💫")}
                {selectedSpell.effectType === "shield" && (isCasting ? "🛡️" : "✨")}
                {selectedSpell.effectType === "unlock" && (isCasting ? "🗝️" : "🔓")}
              </div>

              <p className="mt-4 text-xs font-semibold text-[#4A321E]/80 dark:text-white/80 max-w-md leading-relaxed">
                {selectedSpell.description}
              </p>

              {isCasting && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#740001] px-4 py-1.5 text-xs font-black text-[#FFE894] border-2 border-[#4A321E] animate-bounce">
                  <Sparkles className="h-4 w-4" />
                  Incantation Resonating!
                </div>
              )}
            </div>

            {/* Stage Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-[#4A321E]/10 dark:border-white/10 relative z-20">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCast}
                  disabled={isCasting}
                  className="flex items-center gap-2 rounded-xl border-3 border-[#4A321E] bg-[#ECB939] hover:bg-[#FFD23F] text-[#1A0F00] font-black px-6 py-3 text-xs shadow-[3px_3px_0px_#4A321E] active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] transition-all cursor-pointer"
                >
                  <Wand2 className="h-4.5 w-4.5 stroke-[2.5]" />
                  {isCasting ? "Channelling Magic..." : `Cast ${selectedSpell.incantation}`}
                </button>
              </div>

              {onFindTutorForSpell && (
                <button
                  onClick={() => onFindTutorForSpell(selectedSpell.tagMatch)}
                  className="flex items-center gap-2 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#251B33] text-[#4A321E] dark:text-[#FFE894] hover:bg-[#FDF9EE] font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Search className="h-4 w-4 stroke-[2.5]" />
                  Find Classmates Teaching "{selectedSpell.name}"
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
