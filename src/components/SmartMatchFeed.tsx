import React, { useState, useEffect } from "react";
import { UserProfile, SmartMatch } from "../types";
import { Sparkles, ArrowRight, MessageSquare, Calendar, Percent, Compass, Search } from "lucide-react";

interface SmartMatchFeedProps {
  currentProfile: UserProfile | null;
  allProfiles: UserProfile[];
  onOpenSchedule: (targetProfile: UserProfile, skill: string) => void;
  onStartChat: (targetProfile: UserProfile, prefilledMessage: string) => void;
}

export default function SmartMatchFeed({
  currentProfile,
  allProfiles,
  onOpenSchedule,
  onStartChat
}: SmartMatchFeedProps) {
  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "teaches_my_need" | "learns_my_skill">("all");
  const [apiError, setApiError] = useState("");

  const runMatchmaking = async () => {
    if (!currentProfile) return;
    setIsLoading(true);
    setApiError("");
    try {
      const response = await fetch("/api/matchmaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentProfile,
          allProfiles
        })
      });
      const data = await response.json();
      if (data.matches && Array.isArray(data.matches)) {
        // Map matched IDs back to full profiles
        const mappedMatches: SmartMatch[] = data.matches.map((m: any) => {
          const matchedUser = allProfiles.find(p => p.id === m.userId);
          return {
            user: matchedUser,
            commonInterests: m.commonInterests,
            compatibilityScore: m.compatibilityScore,
            icebreaker: m.icebreaker,
            reasoning: m.reasoning
          };
        }).filter((m: SmartMatch) => m.user !== undefined);

        // Sort by compatibility score descending
        mappedMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
        setMatches(mappedMatches);
      } else if (data.error) {
        setApiError(data.error);
      }
    } catch (err) {
      console.error("Matchmaking call failed:", err);
      setApiError("Could not calculate AI matching. Using fallback rules.");
      
      // Fallback local matching
      const candidates = allProfiles.filter(p => p.id !== currentProfile.id);
      const fallbackMatches = candidates.map(c => {
        const commonTeachLearn = c.skills.filter(s => currentProfile.needs.includes(s));
        const commonLearnTeach = c.needs.filter(n => currentProfile.skills.includes(n));
        const commonInterests = Array.from(new Set([...commonTeachLearn, ...commonLearnTeach]));
        const score = Math.min(40 + (commonInterests.length * 20) + Math.round(c.rating * 4), 100);

        return {
          user: c,
          commonInterests,
          compatibilityScore: score,
          icebreaker: `Hi ${c.displayName}! I notice we share interests in ${commonInterests.join(", ") || "skill sharing"}. I'd love to learn from you!`,
          reasoning: `Matches based on mutual interest tags: ${commonInterests.join(", ") || "General Volunteering"}.`
        };
      });
      setMatches(fallbackMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runMatchmaking();
  }, [currentProfile, allProfiles]);

  if (!currentProfile) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl bg-white border-4 border-[#2D2D2D] shadow-[4px_4px_0px_#2D2D2D] p-6 text-center">
        <p className="text-sm font-black text-[#2D2D2D] font-sans">No active profile. Select one in the top right.</p>
      </div>
    );
  }

  // Filter & Search the matches
  const filteredMatches = matches.filter(match => {
    // Search
    const searchString = `${match.user.displayName} ${match.user.bio} ${match.user.skills.join(" ")} ${match.user.needs.join(" ")}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());

    // Category Filter
    if (filterType === "teaches_my_need") {
      // Candidate teaches something active profile needs
      const teachesNeed = match.user.skills.some(skill => currentProfile.needs.includes(skill));
      return matchesSearch && teachesNeed;
    }
    if (filterType === "learns_my_skill") {
      // Candidate wants to learn something active profile teaches
      const wantsSkill = match.user.needs.some(need => currentProfile.skills.includes(need));
      return matchesSearch && wantsSkill;
    }

    return matchesSearch;
  });

  return (
    <div className="space-y-8 text-[#2D2D2D] dark:text-white">
      
      {/* Search and Filters Banner Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] p-5 shadow-[6px_6px_0px_#2D2D2D] dark:shadow-[6px_6px_0px_white] transition-colors">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-[#2D2D2D] dark:text-white opacity-60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, spells, Hogwarts House..."
            className="block w-full rounded-2xl border-2 border-[#2D2D2D] dark:border-white bg-[#F3F3F3] dark:bg-[#2D2D2D] pl-11 pr-4 py-3 text-xs font-black text-[#2D2D2D] dark:text-white placeholder-[#2D2D2D]/40 dark:placeholder-white/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20"
          />
        </div>

        {/* Filter Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "bg-white dark:bg-[#2D2D2D] text-[#2D2D2D] dark:text-white border-2 border-transparent opacity-80 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 hover:opacity-100"
            }`}
          >
            All Students
          </button>
          <button
            onClick={() => setFilterType("teaches_my_need")}
            className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
              filterType === "teaches_my_need"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "bg-white dark:bg-[#2D2D2D] text-[#2D2D2D] dark:text-white border-2 border-transparent opacity-80 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 hover:opacity-100"
            }`}
          >
            Tutors My House Needs
          </button>
          <button
            onClick={() => setFilterType("learns_my_skill")}
            className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
              filterType === "learns_my_skill"
                ? "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white]"
                : "bg-white dark:bg-[#2D2D2D] text-[#2D2D2D] dark:text-white border-2 border-transparent opacity-80 hover:bg-[#F3F3F3] dark:hover:bg-[#2D2D2D]/60 hover:opacity-100"
            }`}
          >
            Seeks My Spellcraft
          </button>
        </div>

        {/* Re-sync Button */}
        <button
          onClick={runMatchmaking}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#FFE66D] border-2 border-[#2D2D2D] dark:border-white px-4 py-2.5 text-xs font-black text-[#2D2D2D] shadow-[3px_3px_0px_#2D2D2D] dark:shadow-[3px_3px_0px_white] hover:bg-[#FFD23F] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] disabled:opacity-50 transition-all cursor-pointer"
        >
          <Compass className={`h-4.5 w-4.5 text-[#2D2D2D] stroke-[2.5] ${isLoading ? "animate-spin" : ""}`} />
          Consult Sorting Hat
        </button>
      </div>

      {/* Matching Feed Content */}
      {isLoading ? (
        <div className="flex flex-col h-96 items-center justify-center rounded-3xl border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] p-8 shadow-[8px_8px_0px_#FFE66D] text-center transition-colors">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full border-4 border-[#4ECDC4]/20 border-t-[#4ECDC4] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-[#FF6B6B] animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-[#2D2D2D] dark:text-white">Sorting Hat Matchmaking...</h3>
          <p className="mt-2 text-xs text-[#2D2D2D]/60 dark:text-white/60 max-w-sm">
            Aligning magical disciplines, casting compatibility charms, and preparing custom owl-post greetings!
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex flex-col h-96 items-center justify-center rounded-3xl border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] p-8 shadow-[6px_6px_0px_#2D2D2D] dark:shadow-[6px_6px_0px_white] text-center transition-colors">
          <Compass className="h-14 w-14 text-[#FF6B6B] mb-4" />
          <h3 className="text-lg font-black text-[#2D2D2D] dark:text-white">No matches found</h3>
          <p className="mt-1 text-xs text-[#2D2D2D]/60 dark:text-white/60 max-w-sm">
            Add more teach or learn tag requirements to your Profile to find compatible swaps!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {filteredMatches.map((match) => {
            const isHighMatch = match.compatibilityScore >= 75;
            // Alternated high-contrast shadows based on matching status
            const cardShadow = isHighMatch ? "shadow-[8px_8px_0px_#FF6B6B] dark:shadow-[8px_8px_0px_#FF6B6B]" : "shadow-[8px_8px_0px_#FFE66D] dark:shadow-[8px_8px_0px_#FFE66D]";

            return (
              <div
                key={match.user.id}
                className={`flex flex-col justify-between rounded-[2rem] border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] p-6 ${cardShadow} relative overflow-hidden transition-all hover:-translate-x-0.5 hover:-translate-y-0.5`}
              >
                {/* Visual Neobrutalist Rotating Badge */}
                {isHighMatch && (
                  <div className="absolute top-4 -right-3 bg-[#FF6B6B] text-white px-4 py-1 rounded-lg font-black text-[10px] tracking-wider uppercase rotate-6 border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] z-10">
                    ★ HOGWARTS FAVORITE
                  </div>
                )}

                {/* Card Header: Profile Info and Compatibility */}
                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src={match.user.photoURL}
                      alt={match.user.displayName}
                      className="h-14 w-14 rounded-2xl object-cover border-2 border-[#2D2D2D] dark:border-white shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 pr-16">
                      <h4 className="text-lg font-black text-[#2D2D2D] dark:text-white truncate">
                        {match.user.displayName}
                      </h4>
                      <p className="text-[11px] font-bold text-[#2D2D2D]/60 dark:text-white/60 mt-1 flex items-center gap-1.5">
                        <span>{match.user.location}</span>
                        <span>•</span>
                        <span className="text-[#FF6B6B] font-black">★ {match.user.rating.toFixed(1)}</span>
                        <span className="opacity-70">({match.user.totalReviews} spell trades)</span>
                      </p>
                    </div>
                  </div>

                  {/* Bio block */}
                  <p className="mt-4 text-xs font-medium text-[#2D2D2D]/80 dark:text-white/80 leading-relaxed line-clamp-3">
                    {match.user.bio}
                  </p>

                  {/* Score Indicator Pill */}
                  <div className="mt-4 inline-flex items-center gap-1 bg-[#FFE66D] border-2 border-[#2D2D2D] dark:border-white px-3 py-1 rounded-xl shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] text-xs font-black text-[#2D2D2D]">
                    <Percent className="h-3 w-3 stroke-[3]" />
                    <span>{match.compatibilityScore}% Magical Synergy</span>
                  </div>

                  {/* AI Match reasoning box */}
                  <div className="mt-4 rounded-2xl bg-[#FFD23F]/10 dark:bg-[#FFD23F]/5 border-2 border-dashed border-[#2D2D2D]/30 dark:border-white/30 p-4">
                    <span className="font-black text-xs text-[#2D2D2D] dark:text-white block mb-1 flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-[#FF6B6B] shrink-0" />
                      AI Match Alignment:
                    </span>
                    <span className="text-xs text-[#2D2D2D]/80 dark:text-white/80 font-medium leading-relaxed block">
                      {match.reasoning}
                    </span>
                  </div>

                  {/* Skill Tag grids */}
                  <div className="mt-5 space-y-4">
                    {/* Can Teach */}
                    <div>
                      <span className="block text-[10px] font-black text-[#FF6B6B] uppercase tracking-wider mb-2">
                        Spellcraft Offering (Tutor)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {match.user.skills.map((skill) => {
                          const matchesNeed = currentProfile.needs.includes(skill);
                          return (
                            <span
                              key={skill}
                              className={`rounded-lg border-2 px-2.5 py-1 text-xs font-black transition-all ${
                                matchesNeed
                                  ? "bg-[#FFE66D] border-[#2D2D2D] dark:border-white text-[#2D2D2D] shadow-[1.5px_1.5px_0px_#2D2D2D] dark:shadow-[1.5px_1.5px_0px_white]"
                                  : "bg-[#F3F3F3] dark:bg-[#2D2D2D] border-[#2D2D2D]/10 dark:border-white/10 text-[#2D2D2D]/60 dark:text-white/60"
                              }`}
                            >
                              {skill} {matchesNeed && "★"}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Wants to Learn */}
                    <div>
                      <span className="block text-[10px] font-black text-[#4ECDC4] uppercase tracking-wider mb-2">
                        Magical Aspirations (Learner)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {match.user.needs.map((need) => {
                          const matchesTeach = currentProfile.skills.includes(need);
                          return (
                            <span
                              key={need}
                              className={`rounded-lg border-2 px-2.5 py-1 text-xs font-black transition-all ${
                                matchesTeach
                                  ? "bg-[#E1F7F5] dark:bg-[#1D7A73]/25 border-[#4ECDC4] dark:border-white text-[#1D7A73] dark:text-white shadow-[1.5px_1.5px_0px_#4ECDC4] dark:shadow-[1.5px_1.5px_0px_white]"
                                  : "bg-[#F3F3F3] dark:bg-[#2D2D2D] border-[#2D2D2D]/10 dark:border-white/10 text-[#2D2D2D]/60 dark:text-white/60"
                              }`}
                            >
                              {need} {matchesTeach && "★"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Icebreaker & Actions footer block */}
                <div className="mt-6 pt-4 border-t-2 border-[#2D2D2D]/10 dark:border-white/10 space-y-4">
                  {/* Generated Icebreaker prefill */}
                  <div className="bg-[#4ECDC4]/5 dark:bg-[#4ECDC4]/10 rounded-2xl p-4 border-2 border-[#4ECDC4]/20">
                    <span className="text-[10px] font-black uppercase text-[#1D7A73] dark:text-[#4ECDC4] tracking-widest block mb-1">Icebreaker Idea:</span>
                    <p className="text-xs font-semibold text-[#2D2D2D] dark:text-white italic">"{match.icebreaker}"</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Chat & Coordinate button */}
                    <button
                      onClick={() => onStartChat(match.user, match.icebreaker)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#2D2D2D] hover:bg-[#FDFCF8] dark:hover:bg-[#1E1E1E] py-3 text-xs font-black text-[#2D2D2D] dark:text-white shadow-[3px_3px_0px_#2D2D2D] dark:shadow-[3px_3px_0px_white] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4 stroke-[2.5]" />
                      Send Owl Post 🦉
                    </button>

                    {/* Lesson Request submission */}
                    <button
                      onClick={() => {
                        const matchedSkill = match.user.skills.find(s => currentProfile.needs.includes(s)) || match.user.skills[0] || "";
                        onOpenSchedule(match.user, matchedSkill);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl border-2 border-[#2D2D2D] dark:border-white bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 py-3 text-xs font-black text-white shadow-[3px_3px_0px_#2D2D2D] dark:shadow-[3px_3px_0px_white] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] dark:active:shadow-[1px_1px_0px_white] transition-all cursor-pointer"
                    >
                      <span>Propose Spell Trade</span>
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
