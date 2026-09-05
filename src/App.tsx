import React, { useState, useEffect } from "react";
import { 
  db, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  onSnapshot, 
  query,
  orderBy
} from "./firebase";
import { UserProfile, SwapRequest } from "./types";
import { MOCK_PROFILES } from "./mockData";
import Navbar from "./components/Navbar";
import SmartMatchFeed from "./components/SmartMatchFeed";
import SwapScheduler from "./components/SwapScheduler";
import RequestManager from "./components/RequestManager";
import ChatRoom from "./components/ChatRoom";
import Leaderboard from "./components/Leaderboard";
import ProfileView from "./components/ProfileView";
import AlchemyLab from "./components/AlchemyLab";
import SpellPracticeRoom from "./components/SpellPracticeRoom";
import QuickCommandPalette from "./components/QuickCommandPalette";
import { Plus, User, Check, X, Compass, Sparkles, AlertCircle, Wand2 } from "lucide-react";
import { playMagicalSparkle, playWandSwoosh } from "./utils/audio";

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [allSwaps, setAllSwaps] = useState<SwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>("matches");

  // Scheduler modal states
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerTarget, setSchedulerTarget] = useState<UserProfile | null>(null);
  const [schedulerSkill, setSchedulerSkill] = useState("");

  // Search Palette state (Cmd+K)
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Chat coordinates
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [prefilledChatText, setPrefilledChatText] = useState("");

  // Custom profile creation states
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileLocation, setNewProfileLocation] = useState("Gryffindor Tower");
  const [newProfileBio, setNewProfileBio] = useState("");
  const [createError, setCreateError] = useState("");

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Keyboard shortcut Cmd+K or Ctrl+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for global chat switching custom events
  useEffect(() => {
    const handleSwitchChat = (e: Event) => {
      const partnerId = (e as CustomEvent).detail;
      setChatTargetId(partnerId);
      setPrefilledChatText("");
      setActiveTab("messages");
    };
    window.addEventListener("switch-chat-partner", handleSwitchChat);
    return () => window.removeEventListener("switch-chat-partner", handleSwitchChat);
  }, []);

  // Initialize profiles in Firestore if empty, and listen to real-time updates
  useEffect(() => {
    const usersColRef = collection(db, "users");

    // Check if empty first
    getDocs(usersColRef).then(async (snapshot) => {
      if (snapshot.empty) {
        console.log("Firestore empty, pre-populating with Hogwarts student portfolios...");
        for (const mock of MOCK_PROFILES) {
          await setDoc(doc(db, "users", mock.id), mock);
        }
      }
    }).catch(err => {
      console.error("Error checking or populating Firestore users:", err);
    });

    // Real-time user listener
    const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setProfiles(list);

      // Preserve active acting profile reference reactive update
      setActiveProfile((prev) => {
        if (!prev) return list[0] || null;
        const fresh = list.find((u) => u.id === prev.id);
        return fresh || prev;
      });
    });

    // Real-time swaps/requests listener
    const swapsColRef = collection(db, "swaps");
    const qSwaps = query(swapsColRef, orderBy("createdAt", "desc"));
    const unsubscribeSwaps = onSnapshot(qSwaps, (snapshot) => {
      const list: SwapRequest[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SwapRequest);
      });
      setAllSwaps(list);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSwaps();
    };
  }, []);

  // Handle active acting persona change
  const handleSelectProfile = (id: string) => {
    const found = profiles.find((p) => p.id === id);
    if (found) {
      setActiveProfile(found);
      playWandSwoosh();
    }
  };

  const handleOpenSchedule = (target: UserProfile, skill: string) => {
    setSchedulerTarget(target);
    setSchedulerSkill(skill);
    setShowScheduler(true);
    playWandSwoosh();
  };

  const handleStartChat = (target: UserProfile, icebreaker: string) => {
    setChatTargetId(target.id);
    setPrefilledChatText(icebreaker);
    setActiveTab("messages");
    playWandSwoosh();
  };

  const handleCreateCustomProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfileLocation.trim() || !newProfileBio.trim()) {
      setCreateError("Please complete all wizard enrollment credentials.");
      return;
    }
    setCreateError("");

    const customId = `custom_${Date.now()}`;
    const newProfile: UserProfile = {
      id: customId,
      displayName: newProfileName,
      email: `${newProfileName.toLowerCase().replace(/\s+/g, "")}@hogwarts.edu`,
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      bio: newProfileBio,
      skills: ["Incantation Fundamentals"],
      needs: ["Potions Mastery"],
      credits: 5, // Starts with 5 standard Galleons
      rating: 5.0,
      totalReviews: 0,
      taughtHours: 0,
      location: newProfileLocation,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", customId), newProfile);
      setActiveProfile(newProfile);
      setShowCreateProfile(false);
      setNewProfileName("");
      setNewProfileLocation("Gryffindor Tower");
      setNewProfileBio("");
      playMagicalSparkle();
      setActiveTab("profile");
    } catch (err) {
      console.error(err);
      setCreateError("Failed to record enrollment on the Ministry scroll. Try again.");
    }
  };

  // Compute pending requests count relating to the active user (where they are the tutor)
  const incomingPendingCount = allSwaps.filter(
    (s) => s.receiverId === activeProfile?.id && s.status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-[#FDF9EE] dark:bg-[#0D0914] flex flex-col font-sans text-[#2C1E14] dark:text-[#EDE7E0] transition-colors selection:bg-[#ECB939] selection:text-[#1E1100]">
      
      {/* Navbar Section */}
      <Navbar
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRequestCount={incomingPendingCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Profile Switcher Banner & Enrollment Callout */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1C1625] border-4 border-[#4A321E] dark:border-[#FFE894] p-5 sm:p-6 rounded-[2.5rem] shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894] transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#740001] border-2 border-[#ECB939] flex items-center justify-center text-2xl shadow-[2px_2px_0px_#4A321E] shrink-0">
              📜
            </div>
            <div>
              <p className="text-sm sm:text-base font-black text-[#4A321E] dark:text-[#FFE894] font-serif tracking-tight">
                Active Student Persona: <span className="bg-[#ECB939] text-[#1A0F00] px-2.5 py-0.5 rounded-lg border-2 border-[#4A321E] font-sans text-xs sm:text-sm font-black">{activeProfile?.displayName}</span>
              </p>
              <p className="text-[11px] font-semibold text-[#4A321E]/70 dark:text-[#EDE7E0]/70 mt-1">
                Representing {activeProfile?.location || "Hogwarts Castle"}. Tutor classmates, cast interactive spells, or brew funny alchemical tags!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowCreateProfile(true);
              playWandSwoosh();
            }}
            className="flex items-center gap-1.5 text-xs font-black text-[#FFE894] bg-[#740001] hover:bg-[#9B1B30] border-2 border-[#4A321E] dark:border-[#FFE894] px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_#4A321E] dark:shadow-[3px_3px_0px_#FFE894] active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Enroll New Wizard Student
          </button>
        </div>

        {/* Tab Content Router */}
        <div className="animate-fade-in">
          {activeTab === "matches" && (
            <SmartMatchFeed
              currentProfile={activeProfile}
              allProfiles={profiles}
              onOpenSchedule={handleOpenSchedule}
              onStartChat={handleStartChat}
            />
          )}

          {activeTab === "swaps" && (
            <RequestManager
              currentProfile={activeProfile}
              allSwaps={allSwaps}
              onOpenChat={(partnerId) => {
                setChatTargetId(partnerId);
                setPrefilledChatText("");
                setActiveTab("messages");
              }}
            />
          )}

          {activeTab === "messages" && (
            <ChatRoom
              currentProfile={activeProfile}
              targetUserId={chatTargetId}
              allProfiles={profiles}
              initialPrefilledMessage={prefilledChatText}
              onOpenSchedule={handleOpenSchedule}
            />
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard allProfiles={profiles} />
          )}

          {activeTab === "spells" && (
            <SpellPracticeRoom />
          )}

          {activeTab === "alchemy" && (
            <AlchemyLab
              currentProfile={activeProfile}
              onProfileUpdated={(updated) => setActiveProfile(updated)}
            />
          )}

          {activeTab === "profile" && (
            <ProfileView
              activeProfile={activeProfile}
              allSwaps={allSwaps}
              onProfileUpdated={(updated) => setActiveProfile(updated)}
            />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#120D1A] border-t-4 border-[#4A321E] dark:border-[#FFE894] py-8 mt-16 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs font-black text-[#4A321E]/70 dark:text-white/70">
          <div className="flex flex-col gap-2">
            <p className="font-serif text-sm font-black text-[#4A321E] dark:text-[#FFE894]">
              ✦ Hogwarts Hourglass — The Official Witchcraft & Wizardry Skill-Trading Ledger
            </p>
            <p className="text-[11px]">
              <span className="bg-[#ECB939]/20 text-[#4A321E] dark:text-[#FFE894] px-2 py-0.5 rounded border border-[#4A321E]/20">Spells & Magic:</span> Lumos • Expecto Patronum • Wingardium Leviosa • Alchemy Lab • Sorting Hat Gemini Engine
            </p>
          </div>
          <p className="flex items-center gap-1.5 shrink-0 text-[#740001] dark:text-[#FFE894] font-serif font-black">
            <Compass className="h-4.5 w-4.5 text-[#ECB939]" />
            Sorting Hat Matchmaking & Owl Post Ledger
          </p>
        </div>
      </footer>

      {/* Global Command Palette (Cmd+K) */}
      <QuickCommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allProfiles={profiles}
        onSelectProfile={handleSelectProfile}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsSearchOpen(false);
        }}
      />

      {/* Scheduler Dialog Overlay Modal */}
      {showScheduler && schedulerTarget && (
        <SwapScheduler
          currentProfile={activeProfile}
          targetProfile={schedulerTarget}
          initialSkill={schedulerSkill}
          onClose={() => {
            setShowScheduler(false);
            setSchedulerTarget(null);
            setSchedulerSkill("");
          }}
          onSuccess={() => {
            setShowScheduler(false);
            setSchedulerTarget(null);
            setSchedulerSkill("");
            setActiveTab("swaps");
          }}
        />
      )}

      {/* Create Custom Profile Dialog Modal */}
      {showCreateProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 p-4 backdrop-blur-xs animate-fade-in text-[#2C1E14] dark:text-[#EDE7E0]">
          <div className="w-full max-w-md rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 sm:p-8 shadow-[8px_8px_0px_#4A321E] dark:shadow-[8px_8px_0px_#FFE894] animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black font-serif text-[#4A321E] dark:text-[#FFE894] flex items-center gap-2">
                <User className="h-5 w-5 text-[#740001] dark:text-[#ECB939] stroke-[2.5]" />
                Enroll at Hogwarts
              </h3>
              <button
                onClick={() => setShowCreateProfile(false)}
                className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] p-1.5 text-[#4A321E] dark:text-[#FFE894] hover:bg-[#ECB939]/20 cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#740001]/15 p-3 text-xs font-bold text-[#740001] dark:text-[#FFE894] border-2 border-[#740001]">
                <AlertCircle className="h-5 w-5 text-[#740001] shrink-0 stroke-[2.5]" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
                  Wizard/Witch Full Name
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Neville Longbottom"
                  className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3.5 py-2.5 text-xs font-bold text-[#4A321E] dark:text-white placeholder-[#4A321E]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
                  Hogwarts House / Tower
                </label>
                <select
                  value={newProfileLocation}
                  onChange={(e) => setNewProfileLocation(e.target.value)}
                  className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3.5 py-2.5 text-xs font-bold text-[#4A321E] dark:text-white focus:outline-none"
                >
                  <option value="Gryffindor Tower">🦁 Gryffindor Tower</option>
                  <option value="Ravenclaw Tower">🦅 Ravenclaw Tower</option>
                  <option value="Hufflepuff Basement & Greenhouses">🦡 Hufflepuff Basement</option>
                  <option value="Slytherin Dungeons">🐍 Slytherin Dungeons</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
                  Magical Bio & Wand Specifications
                </label>
                <textarea
                  rows={3}
                  value={newProfileBio}
                  onChange={(e) => setNewProfileBio(e.target.value)}
                  placeholder="Describe your wand specifications (wood/core), favourite subject, and spells you're keen to master!"
                  className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3.5 py-2 text-xs font-bold text-[#4A321E] dark:text-white placeholder-[#4A321E]/40 focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-[#ECB939]/20 p-3.5 text-[11px] text-[#4A321E] dark:text-white border-2 border-[#4A321E] dark:border-[#FFE894] leading-relaxed font-bold">
                🎉 Enrolling awards you <strong>5.0 Galleons 🪙</strong> in your Gringotts vault so you can book lessons immediately!
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProfile(false)}
                  className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#251B33] text-[#4A321E] dark:text-[#FFE894] font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#4A321E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#740001] text-[#FFE894] font-black px-5 py-2.5 text-xs shadow-[3px_3px_0px_#4A321E] dark:shadow-[3px_3px_0px_#FFE894] active:translate-y-0.5 cursor-pointer"
                >
                  Enroll and Inscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
