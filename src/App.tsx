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
      email: `${newProfileName.toLowerCase().replace(/\s+/g, "")}@community.org`,
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
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-[#121212] flex flex-col font-sans text-[#2D2D2D] dark:text-[#F3F3F3] transition-colors">
      
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
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1E1E1E] border-4 border-[#2D2D2D] dark:border-white p-5 rounded-[2rem] shadow-[4px_4px_0px_#2D2D2D] dark:shadow-[4px_4px_0px_white] transition-colors">
          <div className="flex items-center gap-3">
            <Handshake className="h-6 w-6 text-[#FF6B6B] shrink-0 stroke-[2.5]" />
            <div>
              <p className="text-sm font-black text-[#2D2D2D] dark:text-white">
                You are currently acting as <span className="bg-[#FFE66D] text-[#2D2D2D] px-2 py-0.5 rounded-lg border-2 border-[#2D2D2D] dark:border-white">{activeProfile?.displayName}</span>
              </p>
              <p className="text-[11px] font-bold text-[#2D2D2D]/60 dark:text-white/60 mt-1">
                Switch profiles in the top-right menu to simulate lesson swaps, trade credits, and chat from different viewpoints!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateProfile(true)}
            className="flex items-center gap-1.5 text-xs font-black text-[#2D2D2D] bg-[#FFE66D] hover:bg-[#FFE66D]/95 border-2 border-[#2D2D2D] dark:border-white px-4 py-2.5 rounded-xl shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            Join Timebank / Create Profile
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black text-[#2D2D2D]/60 dark:text-white/60">
          <p>© 2026 HourShare Platform. Built for decentralized community skill sharing.</p>
          <p className="flex items-center gap-1.5">
            <Compass className="h-4.5 w-4.5 text-[#FF6B6B]" />
            Smart Matchmaking powered by Google Gemini AI
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
                Join Community Timebank
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Liam Sterling"
                  className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] px-3.5 py-3 text-xs font-bold text-[#2D2D2D] dark:text-white placeholder-[#2D2D2D]/40 dark:placeholder-white/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider mb-1.5">
                  Location / District
                </label>
                <input
                  type="text"
                  value={newProfileLocation}
                  onChange={(e) => setNewProfileLocation(e.target.value)}
                  placeholder="e.g. Richmond District, SF"
                  className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] px-3.5 py-3 text-xs font-bold text-[#2D2D2D] dark:text-white placeholder-[#2D2D2D]/40 dark:placeholder-white/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider mb-1.5">
                  Short Bio / Introduction
                </label>
                <textarea
                  rows={3}
                  value={newProfileBio}
                  onChange={(e) => setNewProfileBio(e.target.value)}
                  placeholder="Tell the neighborhood about yourself, your backgrounds, or what trades you're open to!"
                  className="block w-full rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] px-3.5 py-3 text-xs font-bold text-[#2D2D2D] dark:text-white placeholder-[#2D2D2D]/40 dark:placeholder-white/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20 shadow-sm"
                />
              </div>

              <div className="rounded-xl bg-[#4ECDC4]/15 p-3.5 text-[11px] text-[#2D2D2D] dark:text-white border-2 border-[#2D2D2D] dark:border-white leading-relaxed font-bold">
                🎉 Joining awards you <strong>5.0 Credit Hours</strong> instantly so you can request lessons right away! Add your teach/learn tags in your profile tab immediately after joining.
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
