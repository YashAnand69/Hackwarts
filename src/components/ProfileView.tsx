import { useState } from "react";
import { UserProfile, SwapRequest } from "../types";
import { updateDoc, doc, db } from "../firebase";
import { 
  Sparkles, 
  MapPin, 
  Plus, 
  X, 
  Save, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertCircle
} from "lucide-react";

interface ProfileViewProps {
  activeProfile: UserProfile | null;
  allSwaps: SwapRequest[];
  onProfileUpdated: (updated: UserProfile) => void;
}

export default function ProfileView({
  activeProfile,
  allSwaps,
  onProfileUpdated
}: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(activeProfile?.displayName || "");
  const [bio, setBio] = useState(activeProfile?.bio || "");
  const [location, setLocation] = useState(activeProfile?.location || "");
  const [skills, setSkills] = useState<string[]>(activeProfile?.skills || []);
  const [needs, setNeeds] = useState<string[]>(activeProfile?.needs || []);

  const [newSkill, setNewSkill] = useState("");
  const [newNeed, setNewNeed] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);
  const [isSuggestingNeeds, setIsSuggestingNeeds] = useState(false);
  const [aiError, setAiError] = useState("");

  if (!activeProfile) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl bg-white border-4 border-[#2D2D2D] shadow-[4px_4px_0px_#2D2D2D] p-6 text-center">
        <p className="text-sm font-black text-[#2D2D2D]">No profile selected.</p>
      </div>
    );
  }

  const handleAddSkill = (tag: string) => {
    const cleanTag = tag.trim();
    if (cleanTag && !skills.includes(cleanTag)) {
      setSkills([...skills, cleanTag]);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (tag: string) => {
    setSkills(skills.filter(s => s !== tag));
  };

  const handleAddNeed = (tag: string) => {
    const cleanTag = tag.trim();
    if (cleanTag && !needs.includes(cleanTag)) {
      setNeeds([...needs, cleanTag]);
    }
    setNewNeed("");
  };

  const handleRemoveNeed = (tag: string) => {
    setNeeds(needs.filter(n => n !== tag));
  };

  // AI Tag Suggestions via Gemini
  const handleSuggestTags = async (type: "teach" | "learn") => {
    if (!bio.trim()) {
      setAiError("Please write something in your bio first so the AI has context to suggest tags.");
      return;
    }
    setAiError("");
    if (type === "teach") setIsSuggestingSkills(true);
    else setIsSuggestingNeeds(true);

    try {
      const response = await fetch("/api/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, type })
      });
      const data = await response.json();
      if (data.tags && Array.isArray(data.tags)) {
        if (type === "teach") {
          // Merge unique
          const merged = Array.from(new Set([...skills, ...data.tags]));
          setSkills(merged);
        } else {
          const merged = Array.from(new Set([...needs, ...data.tags]));
          setNeeds(merged);
        }
      } else if (data.error) {
        setAiError(data.error);
      }
    } catch (err) {
      console.error(err);
      setAiError("AI suggestion failed. Check console or make sure your server is running.");
    } finally {
      setIsSuggestingSkills(false);
      setIsSuggestingNeeds(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const userRef = doc(db, "users", activeProfile.id);
      const updatedData = {
        displayName,
        bio,
        location,
        skills,
        needs,
      };
      await updateDoc(userRef, updatedData);
      
      const updatedProfile = {
        ...activeProfile,
        ...updatedData
      };
      onProfileUpdated(updatedProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Extract completed swaps relating to this user
  const userSwapsLedger = allSwaps.filter(
    swap => swap.status === "completed" && (swap.requesterId === activeProfile.id || swap.receiverId === activeProfile.id)
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      
      {/* Left 2 Columns: Edit Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 sm:p-8 shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894]">
          <h2 className="text-xl font-black font-serif text-[#4A321E] dark:text-[#FFE894] mb-6 flex items-center gap-2">
            Edit Hogwarts Student Profile
          </h2>

          {aiError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#740001]/15 p-3 text-xs font-bold text-[#740001] dark:text-[#FFE894] border-2 border-[#740001]">
              <AlertCircle className="h-5 w-5 text-[#740001] dark:text-[#FFE894] shrink-0 stroke-[2.5]" />
              <span>{aiError}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-black text-[#4A321E] dark:text-white uppercase tracking-wider mb-2">
                Wizard / Witch Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3.5 py-3 text-xs font-black text-[#4A321E] dark:text-[#EDE7E0] placeholder-[#4A321E]/40 focus:outline-none"
                placeholder="Hermione Granger"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-black text-[#4A321E] dark:text-white uppercase tracking-wider mb-2">
                Hogwarts House & Dormitory
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[#4A321E] dark:text-[#FFE894]" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] pl-10 pr-3.5 py-3 text-xs font-black text-[#4A321E] dark:text-[#EDE7E0] placeholder-[#4A321E]/40 focus:outline-none"
                  placeholder="e.g. Gryffindor Tower"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-[#4A321E] dark:text-white uppercase tracking-wider">
                  Magical Bio & Spell Profile
                </label>
                <span className="text-[10px] font-black text-[#4A321E]/50 dark:text-white/40">Describe your wand & magical interests</span>
              </div>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3.5 py-3 text-xs font-semibold text-[#4A321E] dark:text-[#EDE7E0] placeholder-[#4A321E]/40 focus:outline-none"
                placeholder="Describe your magical background, your wand type, Hogwarts house pride, and what spells you can tutor/wish to learn..."
              />
            </div>

            {/* Skills: Can Teach */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-black text-[#4A321E] dark:text-white uppercase tracking-wider">
                  Spellcraft I Can Tutor (Earn Galleons 🪙)
                </label>
                <button
                  type="button"
                  onClick={() => handleSuggestTags("teach")}
                  disabled={isSuggestingSkills}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-[#4A321E] bg-[#ECB939] px-3 py-1.5 text-[11px] font-black text-[#1A0F00] shadow-[2px_2px_0px_#4A321E] hover:bg-[#ECB939]/95 active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#1A0F00] stroke-[2.5]" />
                  {isSuggestingSkills ? "Consulting hat..." : "AI Spell Tags"}
                </button>
              </div>

              {/* Tag Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(newSkill))}
                  className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3.5 py-2.5 text-xs font-semibold text-[#4A321E] dark:text-[#EDE7E0] placeholder-[#4A321E]/40 focus:outline-none"
                  placeholder="e.g. Defense Against the Dark Arts"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkill)}
                  className="flex items-center justify-center rounded-xl bg-[#ECB939] text-[#1A0F00] font-black border-2 border-[#4A321E] px-4 shadow-[2px_2px_0px_#4A321E] active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] transition-all cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5 stroke-[3]" />
                </button>
              </div>

              {/* Active Tags */}
              <div className="flex flex-wrap gap-2">
                {skills.length === 0 ? (
                  <p className="text-xs text-[#4A321E]/50 italic font-bold">No spellcraft listed yet.</p>
                ) : (
                  skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#ECB939]/15 px-3 py-1.5 text-xs font-black text-[#4A321E] dark:text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2.5px_2.5px_0px_#4A321E] dark:shadow-[2.5px_2.5px_0px_#FFE894]"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-[#4A321E]/60 hover:text-[#4A321E] dark:text-white/60 ml-1 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3 stroke-[3]" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Needs: Wants to Learn */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-black text-[#4A321E] dark:text-white uppercase tracking-wider">
                  Spells I Wish to Learn (Spend Galleons 🪙)
                </label>
                <button
                  type="button"
                  onClick={() => handleSuggestTags("learn")}
                  disabled={isSuggestingNeeds}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-[#4A321E] bg-[#ECB939] px-3 py-1.5 text-[11px] font-black text-[#1A0F00] shadow-[2px_2px_0px_#4A321E] hover:bg-[#ECB939]/95 active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#1A0F00] stroke-[2.5]" />
                  {isSuggestingNeeds ? "Hat thinking..." : "AI Spell Tags"}
                </button>
              </div>

              {/* Tag Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newNeed}
                  onChange={(e) => setNewNeed(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNeed(newNeed))}
                  className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3.5 py-2.5 text-xs font-semibold text-[#4A321E] dark:text-[#EDE7E0] placeholder-[#4A321E]/40 focus:outline-none"
                  placeholder="e.g. Care of Magical Creatures"
                />
                <button
                  type="button"
                  onClick={() => handleAddNeed(newNeed)}
                  className="flex items-center justify-center rounded-xl bg-[#ECB939] text-[#1A0F00] font-black border-2 border-[#4A321E] px-4 shadow-[2px_2px_0px_#4A321E] active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] transition-all cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5 stroke-[3]" />
                </button>
              </div>

              {/* Active Tags */}
              <div className="flex flex-wrap gap-2">
                {needs.length === 0 ? (
                  <p className="text-xs text-[#4A321E]/50 italic font-bold">No magical aspirations listed yet.</p>
                ) : (
                  needs.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#740001]/10 px-3 py-1.5 text-xs font-black text-[#740001] dark:text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2.5px_2.5px_0px_#4A321E] dark:shadow-[2.5px_2.5px_0px_#FFE894]"
                    >
                      {n}
                      <button
                        type="button"
                        onClick={() => handleRemoveNeed(n)}
                        className="text-[#740001]/60 hover:text-[#740001] dark:text-white/60 ml-1 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3 stroke-[3]" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <hr className="border-t-2 border-[#4A321E]/15 dark:border-white/10" />

            {/* Save Button */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-black text-[#2E6F40] bg-[#FCFAF2] border-2 border-[#4A321E] rounded-xl px-3.5 py-2 animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 text-[#2E6F40] stroke-[2.5]" /> Profile updated successfully!
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl border-2 border-[#4A321E] bg-[#740001] hover:bg-[#9B1B30] px-5 py-3 text-xs font-black text-[#FFE894] shadow-[2px_2px_0px_#4A321E] active:translate-y-0.5 active:shadow-[1px_1px_0px_#4A321E] cursor-pointer transition-all"
              >
                <Save className="h-4.5 w-4.5 stroke-[2.5]" />
                {isSaving ? "Saving Profile..." : "Save Profile"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Right Column: Wallet Stats & Credit Ledger */}
      <div className="space-y-6">
        {/* Wallet Balance Summary */}
        <div className="rounded-[2rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 shadow-[4px_4px_0px_#4A321E] dark:shadow-[4px_4px_0px_#FFE894]">
          <h3 className="text-xs font-black text-[#4A321E]/50 dark:text-white/50 uppercase tracking-wider mb-4 block">
            Galleon Vault Balance 🪙
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-[#4A321E] dark:text-white font-serif">
              {activeProfile.credits.toFixed(1)}
            </span>
            <span className="text-xs font-black text-[#4A321E]/60 dark:text-white/60 uppercase">Galleons</span>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#4A321E]/75 dark:text-white/75 leading-relaxed bg-[#ECB939]/10 rounded-xl p-3.5 border-2 border-[#4A321E]/10">
            Galleons represent magical hours of tutoring at Hogwarts. Earn them by hosting spell swaps (tutoring); spend them to unlock spell trades.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-[#4A321E]/10 dark:border-white/10 pt-4 text-center">
            <div>
              <span className="block text-xl font-black text-[#4A321E] dark:text-white font-serif">{activeProfile.taughtHours}h</span>
              <span className="text-[10px] font-black text-[#4A321E]/50 dark:text-white/50 uppercase mt-0.5 block">Spells Taught</span>
            </div>
            <div>
              <span className="block text-xl font-black text-[#4A321E] dark:text-white font-serif">★ {activeProfile.rating.toFixed(1)}</span>
              <span className="text-[10px] font-black text-[#4A321E]/50 dark:text-white/50 uppercase mt-0.5 block">Trust Rating</span>
            </div>
          </div>
        </div>

        {/* Transaction History / Time Bank Ledger */}
        <div className="rounded-[2rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 shadow-[4px_4px_0px_#4A321E] dark:shadow-[4px_4px_0px_#FFE894]">
          <h3 className="text-xs font-black text-[#4A321E]/50 dark:text-white/50 uppercase tracking-wider mb-4 block">
            Marauder's Exchange Ledger 📜
          </h3>

          <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
            {userSwapsLedger.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[#4A321E]/40 dark:text-white/40 italic font-bold">No magical trades completed yet.</p>
              </div>
            ) : (
              userSwapsLedger.map((swap) => {
                const isTeacher = swap.receiverId === activeProfile.id;
                return (
                  <div key={swap.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#FDF9EE] dark:bg-[#251B33] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E] dark:shadow-[2px_2px_0px_#FFE894]">
                    <div className="flex flex-col min-w-0 flex-1 mr-2">
                      <span className="text-xs font-black text-[#4A321E] dark:text-white truncate">
                        {swap.skill}
                      </span>
                      <span className="text-[10px] font-bold text-[#4A321E]/50 dark:text-white/50 mt-0.5">
                        {isTeacher ? `Tutored: ${swap.requesterName}` : `Studied: ${swap.receiverName}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isTeacher ? (
                        <>
                          <span className="text-xs font-black text-[#2E6F40]">+{swap.credits}</span>
                          <ArrowDownLeft className="h-4 w-4 text-[#2E6F40] stroke-[2.5]" />
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-black text-[#740001] dark:text-[#FFE894]">-{swap.credits}</span>
                          <ArrowUpRight className="h-4 w-4 text-[#740001] dark:text-[#FFE894] stroke-[2.5]" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
