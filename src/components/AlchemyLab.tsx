import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { db, doc, setDoc } from "../firebase";
import { Flame, Sparkles, RefreshCw, Plus, Check, ShieldAlert, Award, Star } from "lucide-react";

interface AlchemyLabProps {
  currentProfile: UserProfile | null;
  onProfileUpdated?: (updated: UserProfile) => void;
}

interface Ingredient {
  id: string;
  name: string;
  type: "herb" | "creature" | "catalyst" | "magic";
  desc: string;
  emoji: string;
}

const POTION_INGREDIENTS: Ingredient[] = [
  { id: "eye_of_newt", name: "Eye of Newt", type: "creature", desc: "Allows you to stare intensely at books without blinking.", emoji: "👁️" },
  { id: "mandrake_root", name: "Mandrake Root", type: "herb", desc: "Makes loud screaming noises when agitated.", emoji: "🌱" },
  { id: "phoenix_tear", name: "Phoenix Tear", type: "catalyst", desc: "Cures emotional damage caused by Snape's grading.", emoji: "💧" },
  { id: "boomslang_skin", name: "Boomslang Skin", type: "creature", desc: "Stretchy skin for high-level shapeshifting mishaps.", emoji: "🐍" },
  { id: "gillyweed", name: "Gillyweed", type: "herb", desc: "Allows underwater breathing and makes you look like a fish.", emoji: "🪸" },
  { id: "floo_powder", name: "Floo Powder", type: "catalyst", desc: "Green ash that occasionally teleports you to the wrong fireplace.", emoji: "✨" },
  { id: "dragon_blood", name: "Dragon Blood", type: "catalyst", desc: "Acts as a potent cleaning agent and oven cleaner.", emoji: "🩸" },
  { id: "leech_juice", name: "Leech Juice", type: "creature", desc: "Slimy essence perfect for keeping things bound together.", emoji: "🧪" },
  { id: "valerian_sprigs", name: "Valerian Sprigs", type: "herb", desc: "Induces deep, snore-heavy sleep in boring History lectures.", emoji: "🌾" }
];

interface PotionOutcome {
  name: string;
  description: string;
  rating: string;
  synthesizedTag: string;
  dangerLevel: "Safe" | "Unstable" | "Explosive!";
  color: string; // Tailwind bg color class
}

const OUTCOMES: PotionOutcome[] = [
  {
    name: "Screaming Potion of Invisibility",
    description: "Turns your entire body fully invisible, but your left ear screams ancient Latin hexes at the top of its lungs.",
    rating: "A- (Slightly loud)",
    synthesizedTag: "Advanced Transfiguration",
    dangerLevel: "Unstable",
    color: "bg-[#FF6B6B]"
  },
  {
    name: "Felix Felicis Lite (5% Success Rate Edition)",
    description: "Makes you feel extremely lucky for exactly 3 minutes, after which you trip over a kneazle and drop your wand in a bog.",
    rating: "B+ (Highly volatile)",
    synthesizedTag: "Charms & Alohomora",
    dangerLevel: "Unstable",
    color: "bg-[#FFE66D]"
  },
  {
    name: "Polyjuice Oopsie: Half-Cat Elixir",
    description: "Supposed to turn you into Hermione Granger, but you grow fuzzy ears, a tail, and an uncontrollable urge to chase Golden Snitches.",
    rating: "C (Cute but itchy)",
    synthesizedTag: "Advanced Potions",
    dangerLevel: "Safe",
    color: "bg-[#4ECDC4]"
  },
  {
    name: "Snape's Sweet Dream Draught",
    description: "Smells like damp dungeons and shampoo. Instantly puts the drinker into a peaceful sleep while dreaming about writing red marks on essays.",
    rating: "A+ (Extremely effective)",
    synthesizedTag: "Advanced Potions",
    dangerLevel: "Safe",
    color: "bg-[#4ECDC4]"
  },
  {
    name: "Love Draught #9.5 (Bad Sonnet side-effect)",
    description: "Makes the drinker fall madly in love with the first person they see. Side-effects include standing on classroom desks reciting bad poetry.",
    rating: "B- (Socially dangerous)",
    synthesizedTag: "Charms & Alohomora",
    dangerLevel: "Unstable",
    color: "bg-[#FFE66D]"
  },
  {
    name: "Patronus Sparkler Tonic",
    description: "Makes your sweat glow and causes tiny, semi-transparent rabbits to hop out of your pockets whenever you laugh.",
    rating: "A (Excellent party trick)",
    synthesizedTag: "Expecto Patronum",
    dangerLevel: "Safe",
    color: "bg-[#4ECDC4]"
  },
  {
    name: "Quidditch High-Velocity Nitrous Fluid",
    description: "Pour on any broomstick to increase speed by 400%. Warning: May cause broom handle to sing 'Weasley is Our King' off-key.",
    rating: "S (Highly Illegal by Ministry standards)",
    synthesizedTag: "Broomstick Flying & Quidditch",
    dangerLevel: "Explosive!",
    color: "bg-[#FF6B6B]"
  },
  {
    name: "Gillyweed Soda Punch",
    description: "A refreshing herbal mix that grows gills on your neck for exactly 10 minutes. Do not drink unless you are near a clean bath or lake.",
    rating: "A (Fishy taste)",
    synthesizedTag: "Gillyweed Harvesting",
    dangerLevel: "Safe",
    color: "bg-[#4ECDC4]"
  }
];

export default function AlchemyLab({ currentProfile, onProfileUpdated }: AlchemyLabProps) {
  const [selected1, setSelected1] = useState<string>("");
  const [selected2, setSelected2] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(50); // 0 to 100
  const [isBrewing, setIsBrewing] = useState<boolean>(false);
  const [brewStep, setBrewStep] = useState<string>("");
  const [currentOutcome, setCurrentOutcome] = useState<PotionOutcome | null>(null);
  const [hasInscribed, setHasInscribed] = useState<boolean>(false);
  const [inscribeError, setInscribeError] = useState<string>("");
  const [bubbles, setBubbles] = useState<{ id: number; left: number; size: number; delay: number }[]>([]);

  // Simple bubble generator for cauldron animation
  useEffect(() => {
    if (isBrewing) {
      const interval = setInterval(() => {
        setBubbles((prev) => [
          ...prev.slice(-15), // keep last 15
          {
            id: Math.random(),
            left: Math.random() * 80 + 10, // 10% to 90%
            size: Math.random() * 12 + 6, // 6px to 18px
            delay: Math.random() * 0.5
          }
        ]);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setBubbles([]);
    }
  }, [isBrewing]);

  const handleBrew = () => {
    if (!selected1 || !selected2) return;
    if (selected1 === selected2) {
      alert("Please select two different ingredients! Doubling up might cause a minor Slytherin explosion.");
      return;
    }

    setIsBrewing(true);
    setCurrentOutcome(null);
    setHasInscribed(false);
    setInscribeError("");

    const steps = [
      "Gathering secret wizard vials...",
      "Mashing mandrakes and squeezing leeches...",
      "Adjusting heat settings on the cauldron...",
      "Chanting forbidden alchemy hexes...",
      "Stirring clockwise exactly three and a half times..."
    ];

    let currentStepIdx = 0;
    setBrewStep(steps[currentStepIdx]);

    const stepInterval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setBrewStep(steps[currentStepIdx]);
      } else {
        clearInterval(stepInterval);
        
        // Compute outcome based on ingredients and temperature
        const seed = (selected1.length + selected2.length + temperature) % OUTCOMES.length;
        const outcome = { ...OUTCOMES[seed] };

        // Adjust outcome danger based on temperature
        if (temperature > 80) {
          outcome.dangerLevel = "Explosive!";
          outcome.description += " WARNING: Cauldron overheated! Resulting brew is highly explosive and smells like wet owl feathers.";
        } else if (temperature < 20) {
          outcome.dangerLevel = "Safe";
          outcome.description += " (Tepid brew: Safe but slightly cold and tastes like stagnant water).";
        }

        setCurrentOutcome(outcome);
        setIsBrewing(false);
      }
    }, 600);
  };

  const handleInscribe = async () => {
    if (!currentProfile || !currentOutcome) return;
    
    const tag = currentOutcome.synthesizedTag;
    if (currentProfile.skills.includes(tag)) {
      setInscribeError("You have already mastered this Spellcraft tag on your profile!");
      return;
    }

    const updatedProfile: UserProfile = {
      ...currentProfile,
      skills: [...currentProfile.skills, tag]
    };

    try {
      await setDoc(doc(db, "users", currentProfile.id), updatedProfile);
      setHasInscribed(true);
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
    } catch (err) {
      console.error(err);
      setInscribeError("Failed to record transmutation on the magic ledger. Try again.");
    }
  };

  const ingredient1 = POTION_INGREDIENTS.find(i => i.id === selected1);
  const ingredient2 = POTION_INGREDIENTS.find(i => i.id === selected2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
      
      {/* LEFT COLUMN: Input and Controls */}
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-[2.5rem] border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] p-6 sm:p-8 shadow-[6px_6px_0px_#2D2D2D] dark:shadow-[6px_6px_0px_white]">
          
          {/* Header Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FFE66D] border-2 border-[#2D2D2D] flex items-center justify-center shadow-[2px_2px_0px_#2D2D2D]">
              <span className="text-xl">🧪</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2D2D2D] dark:text-white tracking-tight">Hogwarts Alchemy Cauldron</h2>
              <p className="text-[10px] font-bold text-[#2D2D2D]/60 dark:text-white/60">Combine magical ingredients, set the dial, and brew comical custom spell-tags!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Ingredient 1 Select */}
            <div>
              <label className="block text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider mb-2">
                Primary Ingredient 🧪
              </label>
              <select
                value={selected1}
                onChange={(e) => {
                  setSelected1(e.target.value);
                  setCurrentOutcome(null);
                }}
                disabled={isBrewing}
                className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] py-3 px-3 text-xs font-black text-[#2D2D2D] dark:text-white focus:outline-none"
              >
                <option value="">-- Choose Ingredient 1 --</option>
                {POTION_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id} disabled={ing.id === selected2}>
                    {ing.emoji} {ing.name} ({ing.type})
                  </option>
                ))}
              </select>
              {ingredient1 && (
                <p className="text-[10px] text-[#2D2D2D]/60 dark:text-white/60 font-bold mt-1.5 italic bg-[#F3F3F3]/50 dark:bg-[#2D2D2D]/30 p-2 rounded-lg border border-dashed border-[#2D2D2D]/10">
                  {ingredient1.desc}
                </p>
              )}
            </div>

            {/* Ingredient 2 Select */}
            <div>
              <label className="block text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider mb-2">
                Catalyst Essence ✨
              </label>
              <select
                value={selected2}
                onChange={(e) => {
                  setSelected2(e.target.value);
                  setCurrentOutcome(null);
                }}
                disabled={isBrewing}
                className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] py-3 px-3 text-xs font-black text-[#2D2D2D] dark:text-white focus:outline-none"
              >
                <option value="">-- Choose Ingredient 2 --</option>
                {POTION_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id} disabled={ing.id === selected1}>
                    {ing.emoji} {ing.name} ({ing.type})
                  </option>
                ))}
              </select>
              {ingredient2 && (
                <p className="text-[10px] text-[#2D2D2D]/60 dark:text-white/60 font-bold mt-1.5 italic bg-[#F3F3F3]/50 dark:bg-[#2D2D2D]/30 p-2 rounded-lg border border-dashed border-[#2D2D2D]/10">
                  {ingredient2.desc}
                </p>
              )}
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="mt-6 border-t-2 border-[#2D2D2D]/10 dark:border-white/10 pt-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider">Brewing Temperature Dial 🔥</span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#2D2D2D] ${
                temperature > 80 ? "bg-[#FF6B6B] text-white animate-pulse" : temperature < 20 ? "bg-[#4ECDC4] text-[#2D2D2D]" : "bg-[#FFE66D] text-[#2D2D2D]"
              }`}>
                {temperature}% - {temperature > 80 ? "Snape's Rage Mode!" : temperature < 20 ? "Tepid Bubbles" : "Perfect Simmer"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              disabled={isBrewing}
              className="w-full h-2.5 bg-[#F3F3F3] dark:bg-[#2D2D2D] rounded-lg appearance-none cursor-pointer accent-[#FF6B6B] border-2 border-[#2D2D2D] dark:border-white"
            />
            <div className="flex justify-between text-[9px] font-black text-[#2D2D2D]/40 dark:text-white/40 mt-1 uppercase">
              <span>0% - Ice Cold</span>
              <span>50% - Standard Draught</span>
              <span>100% - Critical Volatility!</span>
            </div>
          </div>

          {/* Brewing Button */}
          <div className="mt-8">
            <button
              onClick={handleBrew}
              disabled={isBrewing || !selected1 || !selected2}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-4 border-[#2D2D2D] dark:border-white bg-[#FFD23F] hover:bg-[#FFD23F]/95 py-3.5 text-xs font-black text-[#2D2D2D] shadow-[4px_4px_0px_#2D2D2D] dark:shadow-[4px_4px_0px_white] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Flame className={`h-5 w-5 ${isBrewing ? "animate-spin text-[#FF6B6B]" : "text-[#2D2D2D]"}`} />
              <span>{isBrewing ? "STIRRING THE COALDRON..." : "STIR ALCHEMICAL COALDRON (Brew Spell-Tag!)"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Visual Cauldron or Output */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Animated Cauldron Visual */}
        <div className="rounded-[2.5rem] border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] p-6 shadow-[6px_6px_0px_#2D2D2D] dark:shadow-[6px_6px_0px_white] flex flex-col items-center justify-center text-center relative overflow-hidden h-[340px]">
          
          {/* Bubbles animation */}
          {isBrewing && (
            <div className="absolute inset-x-4 bottom-24 top-8 pointer-events-none overflow-hidden">
              {bubbles.map((b) => (
                <div
                  key={b.id}
                  className="absolute bottom-0 bg-[#4ECDC4]/40 dark:bg-[#FFE66D]/40 border border-white/30 rounded-full animate-bubble"
                  style={{
                    left: `${b.left}%`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    animationDelay: `${b.delay}s`,
                    animationDuration: "1.4s"
                  }}
                />
              ))}
            </div>
          )}

          {/* Cauldron SVG / Illustration */}
          <div className="relative z-10">
            <div className={`w-36 h-36 bg-[#2D2D2D] dark:bg-black rounded-full border-4 border-dashed border-[#FF6B6B] dark:border-[#4ECDC4] flex items-center justify-center ${isBrewing ? "animate-wiggle" : ""}`}>
              <div className="w-28 h-28 bg-[#4ECDC4]/20 rounded-full flex flex-col items-center justify-center relative">
                {isBrewing ? (
                  <span className="text-5xl animate-bounce">🧙‍♂️</span>
                ) : currentOutcome ? (
                  <span className="text-5xl animate-pulse">✨</span>
                ) : (
                  <span className="text-5xl">🥣</span>
                )}
                {/* Boiling liquid top line */}
                <div className={`absolute bottom-6 w-20 h-1 rounded-full ${isBrewing ? "bg-[#FF6B6B] animate-pulse" : "bg-[#4ECDC4]"}`}></div>
              </div>
            </div>
            
            {/* Cauldron Legs */}
            <div className="flex justify-between px-10 -mt-2">
              <div className="w-4 h-6 bg-[#2D2D2D] dark:bg-black rounded-b-xl border-2 border-dashed border-[#FF6B6B]"></div>
              <div className="w-4 h-6 bg-[#2D2D2D] dark:bg-black rounded-b-xl border-2 border-dashed border-[#FF6B6B]"></div>
            </div>
          </div>

          <div className="mt-4 relative z-10 w-full px-2">
            {isBrewing ? (
              <div>
                <p className="text-xs font-black text-[#FF6B6B] uppercase tracking-wider animate-pulse">{brewStep}</p>
                <div className="mt-2 h-1.5 w-32 bg-[#F3F3F3] dark:bg-[#2D2D2D] border border-[#2D2D2D] mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-[#4ECDC4] animate-loading-bar rounded-full"></div>
                </div>
              </div>
            ) : currentOutcome ? (
              <div>
                <span className="text-[10px] font-black text-[#4ECDC4] dark:text-[#FFE66D] uppercase tracking-wider">SUCCESSFULLY BREWED!</span>
                <h4 className="text-sm font-black text-[#2D2D2D] dark:text-white mt-1 leading-tight">{currentOutcome.name}</h4>
              </div>
            ) : (
              <div>
                <p className="text-xs font-black text-[#2D2D2D]/40 dark:text-white/40">Select ingredients and pull the lever to ignite cauldron fire.</p>
                <p className="text-[9px] font-bold text-[#2D2D2D]/30 dark:text-white/30 uppercase mt-1">Snape's brewing books say there are no explosion warranties.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FULL WIDTH OUTCOME COMPONENT */}
      {currentOutcome && (
        <div className="lg:col-span-12 animate-scale-up">
          <div className={`rounded-[2rem] border-4 border-[#2D2D2D] dark:border-white p-6 sm:p-8 relative ${currentOutcome.color} text-[#2D2D2D] shadow-[6px_6px_0px_#2D2D2D] dark:shadow-[6px_6px_0px_white]`}>
            
            {/* Stamp badge */}
            <div className="absolute top-4 right-4 bg-white border-2 border-[#2D2D2D] px-3.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#2D2D2D]">
              Rating: {currentOutcome.rating}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔮</span>
                  <h3 className="text-xl font-black text-[#2D2D2D]">{currentOutcome.name}</h3>
                </div>
                <p className="text-xs font-bold text-[#2D2D2D]/80 leading-relaxed bg-white/40 p-3 rounded-xl border border-[#2D2D2D]/10">
                  {currentOutcome.description}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
                  <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#2D2D2D]/15">
                    Synthesized Spellcraft: <strong>{currentOutcome.synthesizedTag}</strong>
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg border border-[#2D2D2D]/15 ${
                    currentOutcome.dangerLevel === "Explosive!" ? "bg-[#FF6B6B] text-white" : "bg-white/80"
                  }`}>
                    Danger: {currentOutcome.dangerLevel}
                  </span>
                </div>
              </div>

              {/* Direct Profile Inscribing Integration */}
              <div className="w-full md:w-auto shrink-0">
                {currentProfile ? (
                  hasInscribed ? (
                    <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#2D2D2D] bg-white text-[#1D7A73] px-5 py-3 font-black text-xs shadow-[2px_2px_0px_#2D2D2D]">
                      <Check className="h-4.5 w-4.5 stroke-[3]" />
                      <span>Inscribed onto your Profile!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleInscribe}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#2D2D2D] bg-white hover:bg-neutral-50 px-5 py-3 text-xs font-black text-[#2D2D2D] shadow-[3px_3px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] cursor-pointer transition-all"
                    >
                      <Plus className="h-4.5 w-4.5 text-[#2D2D2D] stroke-[3]" />
                      <span>Add "{currentOutcome.synthesizedTag}" to My Skills!</span>
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/60 p-3.5 border-2 border-[#2D2D2D]/10 text-[10px] font-bold">
                    <ShieldAlert className="h-4.5 w-4.5 text-[#FF6B6B]" />
                    <span>Select/Create a profile above to capture alchemical tags.</span>
                  </div>
                )}
                {inscribeError && (
                  <p className="mt-2 text-[10px] font-black text-[#FF6B6B] text-center bg-white/80 px-2 py-1 rounded border border-[#FF6B6B]/20">
                    ⚠️ {inscribeError}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CSS custom animations inline injection */}
      <style>{`
        @keyframes bubble {
          0% {
            transform: translateY(100%) scale(0.3);
            opacity: 0;
          }
          15% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-240px) scale(1.1);
            opacity: 0;
          }
        }
        .animate-bubble {
          animation: bubble linear infinite;
        }
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 3s linear forwards;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-3deg) scale(1.02); }
          75% { transform: rotate(3deg) scale(0.98); }
        }
        .animate-wiggle {
          animation: wiggle 0.4s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}
