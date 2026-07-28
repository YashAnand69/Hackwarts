import React from "react";
import { UserProfile } from "../types";
import { Handshake, Coins, UserCircle2, Flame, Users, CalendarCheck, MessageSquare, Trophy, User, Sun, Moon, Wand2 } from "lucide-react";

interface NavbarProps {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  onSelectProfile: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRequestCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Navbar({
  profiles,
  activeProfile,
  onSelectProfile,
  activeTab,
  setActiveTab,
  onRequestCount,
  theme,
  onToggleTheme
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-4 border-[#ECB939] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#120D1A] text-[#2C1E14] dark:text-[#EDE7E0] transition-colors shadow-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#740001] rounded-xl flex items-center justify-center text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[3px_3px_0px_#4A321E] dark:shadow-[3px_3px_0px_#FFE894] shrink-0 animate-wiggle">
            <span className="text-xl">🪄</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xl font-black font-serif tracking-tighter text-[#4A321E] dark:text-[#FFE894] select-none">
              HOGWARTS<span className="text-[#ECB939]">HOURGLASS</span>
            </span>
            <span className="rounded-lg bg-[#ECB939] border-2 border-[#4A321E] dark:border-[#FFE894] px-1.5 py-0.5 text-[9px] font-black text-[#1A0F00] tracking-wide uppercase shadow-[1px_1px_0px_#4A321E] hidden sm:inline-block">
              🧙‍♂️ Alchemy & Spell Bank
            </span>
          </div>
        </div>

        {/* Central Tabs */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "matches"
                ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                : "text-[#4A321E] dark:text-[#EDE7E0] opacity-75 hover:opacity-100 hover:bg-[#F3EFE0] dark:hover:bg-[#251B33]/80 border-2 border-transparent"
            }`}
          >
            <Flame className="h-4 w-4 stroke-[2.5]" />
            Sorting Hat Matches
          </button>
          
          <button
            onClick={() => setActiveTab("swaps")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "swaps"
                ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                : "text-[#4A321E] dark:text-[#EDE7E0] opacity-75 hover:opacity-100 hover:bg-[#F3EFE0] dark:hover:bg-[#251B33]/80 border-2 border-transparent"
            }`}
          >
            <CalendarCheck className="h-4 w-4 stroke-[2.5]" />
            Owl Exchanges
            {onRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#740001] text-[10px] font-black text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E] animate-bounce">
                {onRequestCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "messages"
                ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                : "text-[#4A321E] dark:text-[#EDE7E0] opacity-75 hover:opacity-100 hover:bg-[#F3EFE0] dark:hover:bg-[#251B33]/80 border-2 border-transparent"
            }`}
          >
            <MessageSquare className="h-4 w-4 stroke-[2.5]" />
            Owl Post 🦉
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                : "text-[#4A321E] dark:text-[#EDE7E0] opacity-75 hover:opacity-100 hover:bg-[#F3EFE0] dark:hover:bg-[#251B33]/80 border-2 border-transparent"
            }`}
          >
            <Trophy className="h-4 w-4 stroke-[2.5]" />
            Goblet of Mentors
          </button>

          <button
            onClick={() => setActiveTab("alchemy")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "alchemy"
                ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                : "text-[#4A321E] dark:text-[#EDE7E0] opacity-75 hover:opacity-100 hover:bg-[#F3EFE0] dark:hover:bg-[#251B33]/80 border-2 border-transparent"
            }`}
          >
            <Wand2 className="h-4 w-4 stroke-[2.5]" />
            Alchemy Cauldron 🧪
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                : "text-[#4A321E] dark:text-[#EDE7E0] opacity-75 hover:opacity-100 hover:bg-[#F3EFE0] dark:hover:bg-[#251B33]/80 border-2 border-transparent"
            }`}
          >
            <User className="h-4 w-4 stroke-[2.5]" />
            Wizard Profile
          </button>
        </nav>

        {/* User Switcher / Wallet / Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Wallet Balance */}
          {activeProfile && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#ECB939] px-3.5 py-1.5 text-xs font-black text-[#1A0F00] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] select-none" title="Wizards' currency for trading spell sessions">
              <Coins className="h-4 w-4 text-[#1A0F00] fill-[#FFD23F] stroke-[2.5]" />
              <span>{activeProfile.credits.toFixed(1)} Galleons 🪙</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#ECB939] dark:bg-[#251B33] text-[#1A0F00] dark:text-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] hover:bg-[#ECB939]/90 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <Moon className="h-4.5 w-4.5 stroke-[2.5]" />
            ) : (
              <Sun className="h-4.5 w-4.5 stroke-[2.5]" />
            )}
          </button>

          {/* Persona Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] font-bold text-[#4A321E] dark:text-[#EDE7E0] opacity-70 lg:inline-block">Identity:</span>
            <div className="relative inline-block">
              <select
                id="profile-switcher"
                value={activeProfile?.id || ""}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="block w-40 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#F3EFE0] dark:bg-[#120D1A] py-1.5 pl-2.5 pr-8 text-xs font-black text-[#4A321E] dark:text-[#EDE7E0] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-[#1E1E1E] dark:text-white">
                    {p.displayName.split(" ")[0]} ({p.isMock ? "Demo" : "You"})
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Avatar */}
            {activeProfile && (
              <img
                src={activeProfile.photoURL}
                alt={activeProfile.displayName}
                className="h-9 w-9 rounded-full border-2 border-[#4A321E] dark:border-[#FFE894] object-cover shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex border-t-2 border-[#4A321E]/20 dark:border-[#FFE894]/20 bg-[#FDF9EE] dark:bg-[#120D1A] md:hidden justify-around py-2 px-1">
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "matches" 
              ? "text-[#FFE894] bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E]" 
              : "text-[#4A321E]/70 dark:text-[#EDE7E0]/70 border-2 border-transparent"
          }`}
        >
          <Flame className="h-5 w-5 stroke-[2.5]" />
          Sorting
        </button>
        <button
          onClick={() => setActiveTab("swaps")}
          className={`relative flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "swaps" 
              ? "text-[#FFE894] bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E]" 
              : "text-[#4A321E]/70 dark:text-[#EDE7E0]/70 border-2 border-transparent"
          }`}
        >
          <CalendarCheck className="h-5 w-5 stroke-[2.5]" />
          Exchanges
          {onRequestCount > 0 && (
            <span className="absolute top-0 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#740001] text-[9px] font-black text-[#FFE894] border border-[#4A321E]">
              {onRequestCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "messages" 
              ? "text-[#FFE894] bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E]" 
              : "text-[#4A321E]/70 dark:text-[#EDE7E0]/70 border-2 border-transparent"
          }`}
        >
          <MessageSquare className="h-5 w-5 stroke-[2.5]" />
          Owl Post
        </button>
        <button
          onClick={() => setActiveTab("alchemy")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "alchemy" 
              ? "text-[#FFE894] bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E]" 
              : "text-[#4A321E]/70 dark:text-[#EDE7E0]/70 border-2 border-transparent"
          }`}
        >
          <Wand2 className="h-5 w-5 stroke-[2.5]" />
          Cauldron
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "leaderboard" 
              ? "text-[#FFE894] bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E]" 
              : "text-[#4A321E]/70 dark:text-[#EDE7E0]/70 border-2 border-transparent"
          }`}
        >
          <Trophy className="h-5 w-5 stroke-[2.5]" />
          Goblet
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "profile" 
              ? "text-[#FFE894] bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E]" 
              : "text-[#4A321E]/70 dark:text-[#EDE7E0]/70 border-2 border-transparent"
          }`}
        >
          <User className="h-5 w-5 stroke-[2.5]" />
          Wizard
        </button>
      </div>
    </header>
  );
}
