import React, { useState, useEffect } from "react";
import {
  db,
  collection,
  getDocs,
  setDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  isDemoMode,
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
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useModal } from "./utils/useModal";
import {
  Plus,
  User,
  Check,
  X,
  Compass,
  Sparkles,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { playMagicalSparkle, playWandSwoosh } from "./utils/audio";

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [dataError, setDataError] = useState("");
  const [allSwaps, setAllSwaps] = useState<SwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>("matches");

  // Scheduler modal states
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerTarget, setSchedulerTarget] = useState<UserProfile | null>(
    null,
  );
  const [schedulerSkill, setSchedulerSkill] = useState("");

  // Search Palette state (Cmd+K)
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Chat coordinates
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [prefilledChatText, setPrefilledChatText] = useState("");

  // Custom profile creation states
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileLocation, setNewProfileLocation] =
    useState("Gryffindor Tower");
  const [newProfileBio, setNewProfileBio] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useModal(showScheduler || showCreateProfile || isSearchOpen, () => {
    setShowScheduler(false);
    setShowCreateProfile(false);
    setIsSearchOpen(false);
  });

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return "dark";
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
    return () =>
      window.removeEventListener("switch-chat-partner", handleSwitchChat);
  }, []);

  // Initialize profiles in Firestore if empty, and listen to real-time updates
  useEffect(() => {
    const usersColRef = collection(db, "users");

    // Real-time user listener
    const unsubscribeUsers = onSnapshot(
      usersColRef,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        setProfiles(list);
        setDataError("");

        // Preserve active acting profile reference reactive update
        setActiveProfile((prev) => {
          if (!prev)
            return (
              list.find(
                (u) => u.id === localStorage.getItem("hackwarts-persona"),
              ) ||
              list[0] ||
              null
            );
          const fresh = list.find((u) => u.id === prev.id);
          return fresh || list[0] || null;
        });
      },
      () =>
        setDataError(
          "The common room could not connect. Check your Firebase configuration and reload.",
        ),
    );

    // Real-time swaps/requests listener
    const swapsColRef = collection(db, "swaps");
    const qSwaps = query(swapsColRef, orderBy("createdAt", "desc"));
    const unsubscribeSwaps = onSnapshot(
      qSwaps,
      (snapshot) => {
        const list: SwapRequest[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as SwapRequest);
        });
        setAllSwaps(list);
      },
      () =>
        setDataError(
          "Lesson updates are unavailable. Please reload to reconnect.",
        ),
    );

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
      localStorage.setItem("hackwarts-persona", id);
      setChatTargetId(null);
      setPrefilledChatText("");
      setShowScheduler(false);
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
    if (
      !newProfileName.trim() ||
      !newProfileLocation.trim() ||
      !newProfileBio.trim()
    ) {
      setCreateError("Please complete all wizard enrollment credentials.");
      return;
    }
    setCreateError("");

    const customId = `custom_${crypto.randomUUID()}`;
    const newProfile: UserProfile = {
      id: customId,
      displayName: newProfileName.trim(),
      email: `${newProfileName.toLowerCase().replace(/\s+/g, "")}@hogwarts.edu`,
      photoURL:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      bio: newProfileBio.trim(),
      skills: ["Incantation Fundamentals"],
      needs: ["Potions Mastery"],
      credits: 5, // Starts with 5 standard Galleons
      rating: 0,
      totalReviews: 0,
      taughtHours: 0,
      location: newProfileLocation,
      createdAt: new Date().toISOString(),
    };

    setIsCreating(true);
    try {
      await setDoc(doc(db, "users", customId), newProfile);
      localStorage.setItem("hackwarts-persona", customId);
      setActiveProfile(newProfile);
      setShowCreateProfile(false);
      setNewProfileName("");
      setNewProfileLocation("Gryffindor Tower");
      setNewProfileBio("");
      playMagicalSparkle();
      setActiveTab("profile");
    } catch (err) {
      console.error(err);
      setCreateError(
        "Failed to record enrollment on the Ministry scroll. Try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Compute pending requests count relating to the active user (where they are the tutor)
  const incomingPendingCount = allSwaps.filter(
    (s) => s.receiverId === activeProfile?.id && s.status === "pending",
  ).length;

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell min-h-screen bg-[#f4f0e7] dark:bg-[#0D0914] flex flex-col font-sans text-[#302d28] dark:text-[#eee9de] transition-colors selection:bg-[#c9a66b] selection:text-[#1E1100]">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
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
        <main id="main-content" className="main-content">
          <div className="academy-strip">
            <span>
              <span className="status-dot" />{" "}
              {isDemoMode ? "DEMO COMMON ROOM" : "CONNECTED COMMON ROOM"}
              <span className="strip-detail">
                {isDemoMode
                  ? "Your progress is saved on this device"
                  : "Changes sync with the shared database"}
              </span>
            </span>
            <button onClick={() => setShowCreateProfile(true)}>
              <Plus size={14} /> Enroll a wizard
            </button>
          </div>
          {dataError && (
            <p role="alert" className="match-notice">
              {dataError}
            </p>
          )}
          {/* Tab Content Router */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + activeProfile?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="tab-content"
            >
              {activeTab === "matches" && (
                <SmartMatchFeed
                  currentProfile={activeProfile}
                  allProfiles={profiles}
                  onOpenSchedule={handleOpenSchedule}
                  onStartChat={handleStartChat}
                  onNavigate={setActiveTab}
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

              {activeTab === "practice" && (
                <SpellPracticeRoom profileId={activeProfile?.id} />
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
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="app-footer">
          <span>✦ Hackwarts</span>
          <p>Made for curious minds & a little everyday magic.</p>
          <span>1 hour. 1 Galleon. A world of possibility.</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#756e64]/60 p-4 backdrop-blur-xs animate-fade-in text-[#302d28] dark:text-[#eee9de]">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Enroll a wizard"
              className="w-full max-w-md rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] p-6 sm:p-8 shadow-sm dark:shadow-lg animate-scale-up"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium font-serif text-[#756e64] dark:text-[#c9ac77] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#856943] dark:text-[#c9a66b] stroke-[2.5]" />
                  Enroll at Hogwarts
                </h3>
                <button
                  onClick={() => setShowCreateProfile(false)}
                  aria-label="Close enrollment"
                  className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] p-1.5 text-[#756e64] dark:text-[#c9ac77] hover:bg-[#c9a66b]/20 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>
              </div>

              {createError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#856943]/15 p-3 text-xs font-bold text-[#856943] dark:text-[#c9ac77] border border-[#856943]">
                  <AlertCircle className="h-5 w-5 text-[#856943] shrink-0 stroke-[2.5]" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCustomProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
                    Wizard/Witch Full Name
                  </label>
                  <input
                    type="text"
                    aria-label="New wizard name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g. Neville Longbottom"
                    className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3.5 py-2.5 text-xs font-bold text-[#756e64] dark:text-white placeholder-[#756e64]/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
                    Hogwarts House / Tower
                  </label>
                  <select
                    aria-label="New wizard house"
                    value={newProfileLocation}
                    onChange={(e) => setNewProfileLocation(e.target.value)}
                    className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3.5 py-2.5 text-xs font-bold text-[#756e64] dark:text-white focus:outline-none"
                  >
                    <option value="Gryffindor Tower">
                      🦁 Gryffindor Tower
                    </option>
                    <option value="Ravenclaw Tower">🦅 Ravenclaw Tower</option>
                    <option value="Hufflepuff Basement & Greenhouses">
                      🦡 Hufflepuff Basement
                    </option>
                    <option value="Slytherin Dungeons">
                      🐍 Slytherin Dungeons
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
                    Magical Bio & Wand Specifications
                  </label>
                  <textarea
                    rows={3}
                    aria-label="New wizard biography"
                    value={newProfileBio}
                    onChange={(e) => setNewProfileBio(e.target.value)}
                    placeholder="Describe your wand specifications (wood/core), favourite subject, and spells you're keen to master!"
                    className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3.5 py-2 text-xs font-bold text-[#756e64] dark:text-white placeholder-[#756e64]/40 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl bg-[#c9a66b]/20 p-3.5 text-[11px] text-[#756e64] dark:text-white border border-[#d9d1c1] dark:border-[#303747] leading-relaxed font-bold">
                  🎉 Enrolling awards you <strong>5.0 Galleons 🪙</strong> in
                  your Gringotts vault so you can book lessons immediately!
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateProfile(false)}
                    aria-label="Close enrollment"
                    className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#1e2737] text-[#756e64] dark:text-[#c9ac77] font-medium px-4 py-2.5 text-xs shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#856943] text-[#c9ac77] font-medium px-5 py-2.5 text-xs shadow-sm dark:shadow-lg active:translate-y-0.5 cursor-pointer"
                  >
                    Enroll and Inscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
