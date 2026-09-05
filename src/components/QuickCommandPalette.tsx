import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { Search, Wand2, Flame, MessageSquare, CalendarCheck, Trophy, Sparkles, User, X, ArrowRight } from "lucide-react";
import { playWandSwoosh } from "../utils/audio";

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  allProfiles: UserProfile[];
  onSelectTab: (tab: string) => void;
  onSelectProfile: (profileId: string) => void;
  onSearchSpell?: (spellTag: string) => void;
}

export default function QuickCommandPalette({
  isOpen,
  onClose,
  allProfiles,
  onSelectTab,
  onSelectProfile,
  onSearchSpell
}: QuickCommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen ? onClose() : playWandSwoosh();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter students
  const filteredStudents = allProfiles.filter(p => 
    p.displayName.toLowerCase().includes(query.toLowerCase()) ||
    p.location.toLowerCase().includes(query.toLowerCase()) ||
    p.skills.some(s => s.toLowerCase().includes(query.toLowerCase())) ||
    p.needs.some(n => n.toLowerCase().includes(query.toLowerCase()))
  );

  // Quick navigation destinations
  const navShortcuts = [
    { id: "matches", label: "Sorting Hat Matches", icon: Flame, desc: "AI-matched student exchange pairs" },
    { id: "swaps", label: "Owl Exchanges", icon: CalendarCheck, desc: "Manage scheduled spell lessons & ledger" },
    { id: "messages", label: "Owl Post", icon: MessageSquare, desc: "Direct magical messenger threads" },
    { id: "alchemy", label: "Alchemy Cauldron", icon: Wand2, desc: "Brew potion recipes & synthesize spell tags" },
    { id: "practice", label: "Spell Training Room", icon: Sparkles, desc: "Interactive incantations & wand harmonics" },
    { id: "leaderboard", label: "Goblet of Mentors", icon: Trophy, desc: "House Cup & community tutoring rankings" },
    { id: "profile", label: "Wizard Profile", icon: User, desc: "Manage your spell tags, bio, and vaults" }
  ].filter(s => s.label.toLowerCase().includes(query.toLowerCase()) || s.desc.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#2D2D2D]/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] shadow-[8px_8px_0px_#4A321E] dark:shadow-[8px_8px_0px_#FFE894] overflow-hidden animate-scale-up">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b-4 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33]">
          <Search className="h-5 w-5 text-[#4A321E] dark:text-[#FFE894] stroke-[2.5]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cast Lumos search... (e.g. Harry, Potions, Gryffindor, Owl Post)"
            autoFocus
            className="flex-1 bg-transparent text-sm font-black text-[#4A321E] dark:text-[#EDE7E0] placeholder-[#4A321E]/40 dark:placeholder-white/40 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] p-1 text-[#4A321E] dark:text-[#FFE894] hover:bg-[#ECB939]/20 cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-[#4A321E] dark:text-[#EDE7E0]">
          
          {/* Quick Navigation Section */}
          {navShortcuts.length > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4A321E]/50 dark:text-white/50 block mb-2 px-2">
                Hogwarts Destination Portals
              </span>
              <div className="space-y-1">
                {navShortcuts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FDF9EE] dark:hover:bg-[#251B33] border-2 border-transparent hover:border-[#4A321E] dark:hover:border-[#FFE894] transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#ECB939] flex items-center justify-center text-[#1A0F00] border border-[#4A321E]">
                          <Icon className="h-4 w-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#4A321E] dark:text-[#FFE894]">
                            {item.label}
                          </p>
                          <p className="text-[10px] font-semibold text-[#4A321E]/60 dark:text-white/60">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#4A321E]/40 dark:text-white/40 group-hover:text-[#4A321E] dark:group-hover:text-[#FFE894] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Profiles Search Section */}
          {filteredStudents.length > 0 && (
            <div className="pt-2 border-t-2 border-[#4A321E]/10 dark:border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4A321E]/50 dark:text-white/50 block mb-2 px-2">
                Witches & Wizards Found ({filteredStudents.length})
              </span>
              <div className="space-y-1.5">
                {filteredStudents.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProfile(p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FDF9EE] dark:hover:bg-[#251B33] border-2 border-transparent hover:border-[#4A321E] dark:hover:border-[#FFE894] transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.photoURL}
                        alt={p.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-[#4A321E]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-black text-[#4A321E] dark:text-[#FFE894]">
                          {p.displayName} <span className="text-[10px] font-normal text-[#4A321E]/60 dark:text-white/60">• {p.location}</span>
                        </p>
                        <p className="text-[10px] font-semibold text-[#740001] dark:text-[#ECB939]">
                          Tutors: {p.skills.slice(0, 2).join(", ")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-[#ECB939]">
                      ★ {p.rating.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && navShortcuts.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs font-bold text-[#4A321E]/60 dark:text-white/60">
                No magical matches found for "{query}". Try searching for a spell name or student!
              </p>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FDF9EE] dark:bg-[#251B33] border-t-2 border-[#4A321E]/10 dark:border-white/10 flex items-center justify-between text-[10px] font-bold text-[#4A321E]/50 dark:text-white/50">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1C1625] border border-[#4A321E]/30 font-mono text-[9px]">ESC</kbd> to close</span>
          <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1C1625] border border-[#4A321E]/30 font-mono text-[9px]">⌘K</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1C1625] border border-[#4A321E]/30 font-mono text-[9px]">Ctrl+K</kbd></span>
        </div>

      </div>
    </div>
  );
}
