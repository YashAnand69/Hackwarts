import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import {
  Search,
  Wand2,
  Flame,
  MessageSquare,
  CalendarCheck,
  Trophy,
  Sparkles,
  User,
  X,
  ArrowRight,
} from "lucide-react";
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
  onSearchSpell,
}: QuickCommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter students
  const filteredStudents = allProfiles.filter(
    (p) =>
      p.displayName.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
      p.needs.some((n) => n.toLowerCase().includes(query.toLowerCase())),
  );

  // Quick navigation destinations
  const navShortcuts = [
    {
      id: "matches",
      label: "Sorting Hat Matches",
      icon: Flame,
      desc: "AI-matched student exchange pairs",
    },
    {
      id: "swaps",
      label: "Owl Exchanges",
      icon: CalendarCheck,
      desc: "Manage scheduled spell lessons & ledger",
    },
    {
      id: "messages",
      label: "Owl Post",
      icon: MessageSquare,
      desc: "Direct magical messenger threads",
    },
    {
      id: "alchemy",
      label: "Alchemy Cauldron",
      icon: Wand2,
      desc: "Brew potion recipes & synthesize spell tags",
    },
    {
      id: "practice",
      label: "Spell Training Room",
      icon: Sparkles,
      desc: "Interactive incantations & wand harmonics",
    },
    {
      id: "leaderboard",
      label: "Goblet of Mentors",
      icon: Trophy,
      desc: "House Cup & community tutoring rankings",
    },
    {
      id: "profile",
      label: "Wizard Profile",
      icon: User,
      desc: "Manage your spell tags, bio, and vaults",
    },
  ].filter(
    (s) =>
      s.label.toLowerCase().includes(query.toLowerCase()) ||
      s.desc.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#756e64]/60 p-4 backdrop-blur-xs animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the castle"
        className="w-full max-w-xl rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] shadow-sm dark:shadow-lg overflow-hidden animate-scale-up"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b-4 border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737]">
          <Search className="h-5 w-5 text-[#756e64] dark:text-[#c9ac77] stroke-[2.5]" />
          <input
            aria-label="Search castle destinations and wizard profiles"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cast Lumos search... (e.g. Harry, Potions, Gryffindor, Owl Post)"
            autoFocus
            className="flex-1 bg-transparent text-sm font-medium text-[#756e64] dark:text-[#eee9de] placeholder-[#756e64]/40 dark:placeholder-white/40 focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] p-1 text-[#756e64] dark:text-[#c9ac77] hover:bg-[#c9a66b]/20 cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-[#756e64] dark:text-[#eee9de]">
          {/* Quick Navigation Section */}
          {navShortcuts.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#756e64]/50 dark:text-white/50 block mb-2 px-2">
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
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f4f0e7] dark:hover:bg-[#1e2737] border border-transparent hover:border-[#d9d1c1] dark:hover:border-[#c9ac77] transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#c9a66b] flex items-center justify-center text-[#151c29] border border-[#d9d1c1]">
                          <Icon className="h-4 w-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#756e64] dark:text-[#c9ac77]">
                            {item.label}
                          </p>
                          <p className="text-[10px] font-semibold text-[#756e64]/60 dark:text-white/60">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#756e64]/40 dark:text-white/40 group-hover:text-[#756e64] dark:group-hover:text-[#c9ac77] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Profiles Search Section */}
          {filteredStudents.length > 0 && (
            <div className="pt-2 border-t-2 border-[#d9d1c1]/10 dark:border-white/10">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#756e64]/50 dark:text-white/50 block mb-2 px-2">
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
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f4f0e7] dark:hover:bg-[#1e2737] border border-transparent hover:border-[#d9d1c1] dark:hover:border-[#c9ac77] transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.photoURL}
                        alt={p.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-[#d9d1c1]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-medium text-[#756e64] dark:text-[#c9ac77]">
                          {p.displayName}{" "}
                          <span className="text-[10px] font-normal text-[#756e64]/60 dark:text-white/60">
                            • {p.location}
                          </span>
                        </p>
                        <p className="text-[10px] font-semibold text-[#856943] dark:text-[#c9a66b]">
                          Tutors: {p.skills.slice(0, 2).join(", ")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-[#c9a66b]">
                      ★ {p.rating.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && navShortcuts.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs font-bold text-[#756e64]/60 dark:text-white/60">
                No magical matches found for "{query}". Try searching for a
                spell name or student!
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#f4f0e7] dark:bg-[#1e2737] border-t-2 border-[#d9d1c1]/10 dark:border-white/10 flex items-center justify-between text-[10px] font-bold text-[#756e64]/50 dark:text-white/50">
          <span>
            Tip: Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[#fffcf5] dark:bg-[#181f2e] border border-[#d9d1c1]/30 font-mono text-[9px]">
              ESC
            </kbd>{" "}
            to close
          </span>
          <span>
            Shortcut:{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[#fffcf5] dark:bg-[#181f2e] border border-[#d9d1c1]/30 font-mono text-[9px]">
              ⌘K
            </kbd>{" "}
            /{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[#fffcf5] dark:bg-[#181f2e] border border-[#d9d1c1]/30 font-mono text-[9px]">
              Ctrl+K
            </kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
