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
    <header className="sticky top-0 z-40 w-full border-b-4 border-[#FFD23F] dark:border-[#4ECDC4] bg-white dark:bg-[#1E1E1E] text-[#2D2D2D] dark:text-[#F3F3F3] transition-colors">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#FF6B6B] rounded-xl flex items-center justify-center text-white border-2 border-[#2D2D2D] dark:border-white shadow-[3px_3px_0px_#2D2D2D] dark:shadow-[3px_3px_0px_white] shrink-0">
            <Handshake className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xl font-black tracking-tighter text-[#2D2D2D] dark:text-white select-none">
              HOGWARTS<span className="text-[#FFD23F]">HOURGLASS</span>
            </span>
            <span className="rounded-lg bg-[#FFE66D] border-2 border-[#2D2D2D] dark:border-white px-1.5 py-0.5 text-[9px] font-black text-[#2D2D2D] tracking-wide uppercase shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white] hidden sm:inline-block">
              Magical Timebank
            </span>
          </div>
        </div>

        {/* Central Tabs */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "matches"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "text-[#2D2D2D] dark:text-[#F3F3F3] opacity-70 hover:opacity-100 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 border-2 border-transparent"
            }`}
          >
            <Flame className="h-4 w-4 stroke-[2.5]" />
            Sorting Hat Matches
          </button>
          
          <button
            onClick={() => setActiveTab("swaps")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "swaps"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "text-[#2D2D2D] dark:text-[#F3F3F3] opacity-70 hover:opacity-100 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 border-2 border-transparent"
            }`}
          >
            <CalendarCheck className="h-4 w-4 stroke-[2.5]" />
            Owl Exchanges
            {onRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B6B] text-[10px] font-black text-white border-2 border-[#2D2D2D] dark:border-white shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white] animate-bounce">
                {onRequestCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "messages"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "text-[#2D2D2D] dark:text-[#F3F3F3] opacity-70 hover:opacity-100 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 border-2 border-transparent"
            }`}
          >
            <MessageSquare className="h-4 w-4 stroke-[2.5]" />
            Owl Post 🦉
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "text-[#2D2D2D] dark:text-[#F3F3F3] opacity-70 hover:opacity-100 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 border-2 border-transparent"
            }`}
          >
            <Trophy className="h-4 w-4 stroke-[2.5]" />
            Goblet of Mentors
          </button>

          <button
            onClick={() => setActiveTab("alchemy")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "alchemy"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "text-[#2D2D2D] dark:text-[#F3F3F3] opacity-70 hover:opacity-100 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 border-2 border-transparent"
            }`}
          >
            <Wand2 className="h-4 w-4 stroke-[2.5]" />
            Alchemy Cauldron 🧪
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "text-[#2D2D2D] dark:text-[#F3F3F3] opacity-70 hover:opacity-100 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 border-2 border-transparent"
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
            <div className="flex items-center gap-1.5 rounded-full bg-[#FFE66D] px-3.5 py-1.5 text-xs font-black text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] select-none" title="Wizards' currency for trading spell sessions">
              <Coins className="h-4 w-4 text-[#2D2D2D] fill-[#FFD23F] stroke-[2.5]" />
              <span>{activeProfile.credits.toFixed(1)} Galleons 🪙</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#FFE66D] dark:bg-[#2D2D2D] text-[#2D2D2D] dark:text-[#FFE66D] shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] hover:bg-[#FFE66D]/90 dark:hover:bg-[#2D2D2D]/60 active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] transition-all cursor-pointer shrink-0"
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
            <span className="hidden text-[11px] font-bold text-[#2D2D2D] dark:text-white opacity-60 lg:inline-block">Active Wizard:</span>
            <div className="relative inline-block">
              <select
                id="profile-switcher"
                value={activeProfile?.id || ""}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="block w-40 rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] py-1.5 pl-2.5 pr-8 text-xs font-black text-[#2D2D2D] dark:text-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]"
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
                className="h-9 w-9 rounded-full border-2 border-[#2D2D2D] dark:border-white object-cover shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex border-t-2 border-[#2D2D2D]/10 dark:border-white/10 bg-[#FDFCF8] dark:bg-[#1E1E1E] md:hidden justify-around py-2 px-1">
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "matches" 
              ? "text-[#2D2D2D] bg-[#4ECDC4] border-2 border-[#2D2D2D] dark:border-white shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white]" 
              : "text-[#2D2D2D]/70 dark:text-[#F3F3F3]/70 border-2 border-transparent"
          }`}
        >
          <Flame className="h-5 w-5 stroke-[2.5]" />
          Sorting
        </button>
        <button
          onClick={() => setActiveTab("swaps")}
          className={`relative flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "swaps" 
              ? "text-[#2D2D2D] bg-[#4ECDC4] border-2 border-[#2D2D2D] dark:border-white shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white]" 
              : "text-[#2D2D2D]/70 dark:text-[#F3F3F3]/70 border-2 border-transparent"
          }`}
        >
          <CalendarCheck className="h-5 w-5 stroke-[2.5]" />
          Exchanges
          {onRequestCount > 0 && (
            <span className="absolute top-0 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#FF6B6B] text-[9px] font-black text-white border border-[#2D2D2D] dark:border-white">
              {onRequestCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "messages" 
              ? "text-[#2D2D2D] bg-[#4ECDC4] border-2 border-[#2D2D2D] dark:border-white shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white]" 
              : "text-[#2D2D2D]/70 dark:text-[#F3F3F3]/70 border-2 border-transparent"
          }`}
        >
          <MessageSquare className="h-5 w-5 stroke-[2.5]" />
          Owl Post
        </button>
        <button
          onClick={() => setActiveTab("alchemy")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "alchemy" 
              ? "text-[#2D2D2D] bg-[#4ECDC4] border-2 border-[#2D2D2D] dark:border-white shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white]" 
              : "text-[#2D2D2D]/70 dark:text-[#F3F3F3]/70 border-2 border-transparent"
          }`}
        >
          <Wand2 className="h-5 w-5 stroke-[2.5]" />
          Cauldron
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "leaderboard" 
              ? "text-[#2D2D2D] bg-[#4ECDC4] border-2 border-[#2D2D2D] dark:border-white shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white]" 
              : "text-[#2D2D2D]/70 dark:text-[#F3F3F3]/70 border-2 border-transparent"
          }`}
        >
          <Trophy className="h-5 w-5 stroke-[2.5]" />
          Goblet
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-black w-16 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "profile" 
              ? "text-[#2D2D2D] bg-[#4ECDC4] border-2 border-[#2D2D2D] dark:border-white shadow-[1px_1px_0px_#2D2D2D] dark:shadow-[1px_1px_0px_white]" 
              : "text-[#2D2D2D]/70 dark:text-[#F3F3F3]/70 border-2 border-transparent"
          }`}
        >
          <User className="h-5 w-5 stroke-[2.5]" />
          Wizard
        </button>
      </div>
    </header>
  );
}
