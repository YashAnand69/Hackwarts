import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  Coins, 
  Flame, 
  CalendarCheck, 
  MessageSquare, 
  Trophy, 
  User, 
  Sun, 
  Moon, 
  Wand2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Search 
} from "lucide-react";
import { setSoundEnabled, getSoundEnabled, playWandSwoosh } from "../utils/audio";

interface NavbarProps {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  onSelectProfile: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRequestCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenSearch?: () => void;
}

export default function Navbar({
  profiles,
  activeProfile,
  onSelectProfile,
  activeTab,
  setActiveTab,
  onRequestCount,
  theme,
  onToggleTheme,
  onOpenSearch
}: NavbarProps) {
  const [soundOn, setSoundOn] = useState<boolean>(true);

  useEffect(() => {
    setSoundOn(getSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playWandSwoosh();
    }
  };

  const navItems = [
    { id: "matches", label: "Sorting Hat", icon: Flame },
    { id: "swaps", label: "Owl Exchanges", icon: CalendarCheck, badge: onRequestCount },
    { id: "messages", label: "Owl Post", icon: MessageSquare },
    { id: "alchemy", label: "Cauldron Lab", icon: Wand2 },
    { id: "practice", label: "Spell Training", icon: Sparkles },
    { id: "leaderboard", label: "Goblet & Cup", icon: Trophy },
    { id: "profile", label: "Portfolio", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-4 border-[#ECB939] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#120D1A] text-[#2C1E14] dark:text-[#EDE7E0] transition-colors shadow-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Search Trigger */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => {
              playWandSwoosh();
              setActiveTab("matches");
            }}
            className="w-11 h-11 bg-[#740001] rounded-xl flex items-center justify-center text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[3px_3px_0px_#4A321E] dark:shadow-[3px_3px_0px_#FFE894] shrink-0 cursor-pointer hover:scale-105 transition-transform"
            title="Hogwarts Hourglass - Home"
          >
            <span className="text-xl">🪄</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span 
                onClick={() => setActiveTab("matches")}
                className="text-xl font-black font-serif tracking-tighter text-[#4A321E] dark:text-[#FFE894] select-none cursor-pointer"
              >
                HOGWARTS<span className="text-[#ECB939]">HOURGLASS</span>
              </span>
              <span className="rounded-lg bg-[#ECB939] border-2 border-[#4A321E] dark:border-[#FFE894] px-1.5 py-0.5 text-[9px] font-black text-[#1A0F00] tracking-wide uppercase shadow-[1px_1px_0px_#4A321E] hidden xl:inline-block">
                🧙‍♂️ Alchemy & Spell Bank
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#4A321E]/60 dark:text-[#EDE7E0]/60 hidden sm:inline-block">
              Decentralized Wizarding Skill Sharing & Time Bank
            </span>
          </div>

          {/* Quick Lumos Search Button */}
          {onOpenSearch && (
            <button
              onClick={() => {
                playWandSwoosh();
                onOpenSearch();
              }}
              className="ml-2 hidden lg:flex items-center gap-2 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#251B33] px-3 py-1.5 text-xs font-black text-[#4A321E] dark:text-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] hover:bg-[#ECB939]/20 cursor-pointer transition-all"
              title="Cast Lumos Search (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Cast Lumos</span>
              <kbd className="rounded bg-[#FDF9EE] dark:bg-[#120D1A] px-1 py-0.5 text-[9px] font-mono border border-[#4A321E]/30">⌘K</kbd>
            </button>
          )}
        </div>

        {/* Central Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playWandSwoosh();
                  setActiveTab(item.id);
                }}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]"
                    : "text-[#4A321E] dark:text-[#EDE7E0] opacity-75 hover:opacity-100 hover:bg-[#F3EFE0] dark:hover:bg-[#251B33]/80 border-2 border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 stroke-[2.5]" />
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#ECB939] text-[9px] font-black text-[#1A0F00] border border-[#4A321E] animate-bounce">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Sound FX / Theme / Balance / Persona */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Search on mobile/tablet */}
          {onOpenSearch && (
            <button
              onClick={() => {
                playWandSwoosh();
                onOpenSearch();
              }}
              className="flex lg:hidden items-center justify-center h-9 w-9 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E] dark:text-[#FFE894] shadow-[2px_2px_0px_#4A321E] cursor-pointer"
              aria-label="Quick Search"
            >
              <Search className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}

          {/* Sound FX Toggle Button */}
          <button
            onClick={handleToggleSound}
            className={`flex items-center justify-center h-9 w-9 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] active:translate-y-0.5 transition-all cursor-pointer shrink-0 ${
              soundOn
                ? "bg-[#ECB939] text-[#1A0F00]"
                : "bg-white dark:bg-[#251B33] text-[#4A321E]/60 dark:text-white/60"
            }`}
            title={soundOn ? "Mute Hogwarts spell audio" : "Enable Hogwarts spell audio"}
            aria-label="Toggle Sound Effects"
          >
            {soundOn ? (
              <Volume2 className="h-4.5 w-4.5 stroke-[2.5]" />
            ) : (
              <VolumeX className="h-4.5 w-4.5 stroke-[2.5]" />
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#ECB939] dark:bg-[#251B33] text-[#1A0F00] dark:text-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] hover:bg-[#ECB939]/90 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
            aria-label="Toggle Theme"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="h-4.5 w-4.5 stroke-[2.5]" />
            ) : (
              <Sun className="h-4.5 w-4.5 stroke-[2.5]" />
            )}
          </button>

          {/* Wallet Balance Badge */}
          {activeProfile && (
            <div 
              onClick={() => setActiveTab("profile")}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#ECB939] px-3.5 py-1.5 text-xs font-black text-[#1A0F00] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] select-none cursor-pointer hover:scale-105 transition-transform" 
              title="Click to view Vault & Ledger"
            >
              <Coins className="h-4 w-4 text-[#1A0F00] fill-[#FFD23F] stroke-[2.5]" />
              <span>{activeProfile.credits.toFixed(1)} 🪙</span>
            </div>
          )}

          {/* Persona Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative inline-block">
              <select
                id="profile-switcher"
                value={activeProfile?.id || ""}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="block w-32 sm:w-36 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#F3EFE0] dark:bg-[#120D1A] py-1.5 pl-2.5 pr-6 text-xs font-black text-[#4A321E] dark:text-[#EDE7E0] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] focus:outline-none cursor-pointer"
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
                onClick={() => setActiveTab("profile")}
                className="h-9 w-9 rounded-full border-2 border-[#4A321E] dark:border-[#FFE894] object-cover shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894] cursor-pointer hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                title={activeProfile.displayName}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex border-t-2 border-[#4A321E]/20 dark:border-[#FFE894]/20 bg-[#FDF9EE] dark:bg-[#120D1A] lg:hidden justify-around py-2 px-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playWandSwoosh();
                setActiveTab(item.id);
              }}
              className={`relative flex flex-col items-center gap-1 text-[10px] font-black min-w-[50px] py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? "text-[#FFE894] bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1px_1px_0px_#4A321E]"
                  : "text-[#4A321E]/70 dark:text-[#EDE7E0]/70 border-2 border-transparent"
              }`}
            >
              <Icon className="h-4.5 w-4.5 stroke-[2.5]" />
              <span className="truncate max-w-[54px]">{item.label.split(" ")[0]}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ECB939] text-[8px] font-black text-[#1A0F00] border border-[#4A321E]">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </header>
  );
}
