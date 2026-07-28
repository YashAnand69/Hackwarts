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
import { Plus, User, Check, X, Compass, Handshake, AlertCircle } from "lucide-react";

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [allSwaps, setAllSwaps] = useState<SwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>("matches");

  // Scheduler modal states
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerTarget, setSchedulerTarget] = useState<UserProfile | null>(null);
  const [schedulerSkill, setSchedulerSkill] = useState("");

  // Chat coordinates
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [prefilledChatText, setPrefilledChatText] = useState("");

  // Custom profile creation states
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileLocation, setNewProfileLocation] = useState("");
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


  // 1. Listen for global chat switching custom events (bridges ChatRoom thread sidebar & active states)
  useEffect(() => {
    const handleSwitchChat = (e: Event) => {
      const partnerId = (e as CustomEvent).detail;
      setChatTargetId(partnerId);
      setPrefilledChatText("");
    };
    window.addEventListener("switch-chat-partner", handleSwitchChat);
    return () => window.removeEventListener("switch-chat-partner", handleSwitchChat);
  }, []);

  // 2. Initialize profiles in Firestore if empty, and listen to real-time updates
  useEffect(() => {
    const usersColRef = collection(db, "users");

    // Check if empty first
    getDocs(usersColRef).then(async (snapshot) => {
      if (snapshot.empty) {
        console.log("Firestore empty, pre-populating with mock neighborhood profiles...");
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
    }
  };

  const handleOpenSchedule = (target: UserProfile, skill: string) => {
    setSchedulerTarget(target);
    setSchedulerSkill(skill);
    setShowScheduler(true);
  };

  const handleStartChat = (target: UserProfile, icebreaker: string) => {
    setChatTargetId(target.id);
    setPrefilledChatText(icebreaker);
    setActiveTab("messages");
  };

  const handleCreateCustomProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfileLocation.trim() || !newProfileBio.trim()) {
      setCreateError("Please fill out all fields.");
      return;
    }
    setCreateError("");

    const customId = `custom_${Date.now()}`;
    const newProfile: UserProfile = {
      id: customId,
      displayName: newProfileName,
      email: `${newProfileName.toLowerCase().replace(/\s+/g, "")}@hogwarts.edu`,
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250", // Friendly portrait fallback
      bio: newProfileBio,
      skills: [],
      needs: [],
      credits: 5, // Starts with 5 standard community credit hours
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
      setNewProfileLocation("");
      setNewProfileBio("");
      setActiveTab("profile"); // Navigate to edit profile so they can add tags immediately!
    } catch (err) {
      console.error(err);
      setCreateError("Failed to save profile. Try again.");
    }
  };

  // Compute pending requests count relating to the active user (where they are the teacher)
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
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Profile Switcher notice and Custom Creation header block */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1C1625] border-4 border-[#4A321E] dark:border-[#FFE894] p-5 rounded-[2.5rem] shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894] transition-all">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">📜</span>
            <div>
              <p className="text-sm font-black text-[#4A321E] dark:text-[#FFE894] font-serif tracking-tight">
                Active Student Portfolio: <span className="bg-[#ECB939] text-[#1A0F00] px-2.5 py-0.5 rounded-lg border-2 border-[#4A321E]">{activeProfile?.displayName}</span>
              </p>
              <p className="text-[11px] font-bold text-[#4A321E]/70 dark:text-[#EDE7E0]/70 mt-1">
                Represent this student across Hogwarts. Propose spell exchanges, consult the Sorting Hat matchmaking index, or brew alchemical tag potions!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateProfile(true)}
            className="flex items-center gap-1.5 text-xs font-black text-[#FFE894] bg-[#740001] hover:bg-[#9B1B30] border-2 border-[#4A321E] dark:border-[#FFE894] px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_#4A321E] dark:shadow-[3px_3px_0px_#FFE894] active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            Enroll / Create Wizard Portfolio
          </button>
        </div>

        {/* Tab Router Switch */}
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
            />
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard allProfiles={profiles} />
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
      <footer className="bg-white dark:bg-[#1E1E1E] border-t-4 border-[#2D2D2D] dark:border-white py-8 mt-16 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs font-black text-[#2D2D2D]/60 dark:text-white/60">
          <div className="flex flex-col gap-2">
            <p>© 2026 Hogwarts Hourglass. Crafted for decentralized wizarding skill sharing & spell trade.</p>
            <p className="text-[11px] text-[#2D2D2D]/70 dark:text-white/70">
              <span className="bg-[#4ECDC4]/20 text-[#2D2D2D] dark:text-white px-2 py-0.5 rounded border border-[#2D2D2D]/20 dark:border-white/20">Tech Stack:</span> React 18 • TypeScript • Vite • Tailwind CSS • Express • Firebase Firestore (Live DB Sync) • Google Gemini AI SDK (@google/genai)
            </p>
          </div>
          <p className="flex items-center gap-1.5 shrink-0">
            <Compass className="h-4.5 w-4.5 text-[#FFD23F]" />
            Sorting Hat Matchmaking powered by Google Gemini AI
          </p>
        </div>
      </footer>

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
            setActiveTab("swaps"); // Direct to swap requests so they can track its state!
          }}
        />
      )}

      {/* Create Custom Profile Dialog Modal */}
      {showCreateProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-[2rem] border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] p-6 shadow-[8px_8px_0px_#2D2D2D] dark:shadow-[8px_8px_0px_white] animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#2D2D2D] dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-[#4ECDC4] stroke-[2.5]" />
                Enroll in Hogwarts School
              </h3>
              <button
                onClick={() => setShowCreateProfile(false)}
                className="rounded-xl border-2 border-[#2D2D2D] dark:border-white p-1.5 text-[#2D2D2D] dark:text-white hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D] cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#FF6B6B]/15 p-3 text-xs font-bold text-[#2D2D2D] dark:text-white border-2 border-[#2D2D2D] dark:border-white">
                <AlertCircle className="h-5 w-5 text-[#FF6B6B] shrink-0 stroke-[2.5]" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider mb-1.5">
                  Wizard Name
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Neville Longbottom"
                  className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] px-3.5 py-3 text-xs font-bold text-[#2D2D2D] dark:text-white placeholder-[#2D2D2D]/40 dark:placeholder-white/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider mb-1.5">
                  Hogwarts House / Location
                </label>
                <input
                  type="text"
                  value={newProfileLocation}
                  onChange={(e) => setNewProfileLocation(e.target.value)}
                  placeholder="e.g. Gryffindor Tower"
                  className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] px-3.5 py-3 text-xs font-bold text-[#2D2D2D] dark:text-white placeholder-[#2D2D2D]/40 dark:placeholder-white/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider mb-1.5">
                  Wizarding Bio & Wand wood
                </label>
                <textarea
                  rows={3}
                  value={newProfileBio}
                  onChange={(e) => setNewProfileBio(e.target.value)}
                  placeholder="Describe your magical lineage, wand specifications (wood/core), and what spells or potions you're keen to trade!"
                  className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] px-3.5 py-3 text-xs font-bold text-[#2D2D2D] dark:text-white placeholder-[#2D2D2D]/40 dark:placeholder-white/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20 shadow-sm"
                />
              </div>

              <div className="rounded-xl bg-[#4ECDC4]/15 p-3.5 text-[11px] text-[#2D2D2D] dark:text-white border-2 border-[#2D2D2D] dark:border-white leading-relaxed font-bold">
                🎉 Enrolling awards you <strong>5.0 Galleons 🪙</strong> instantly so you can request spell sessions right away! Set up your magical teach/learn skills in your profile tab.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProfile(false)}
                  className="rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#2D2D2D] text-[#2D2D2D] dark:text-white font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#FF6B6B] text-white font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] cursor-pointer"
                >
                  Create and Explore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
