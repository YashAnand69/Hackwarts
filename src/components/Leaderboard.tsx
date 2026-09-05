import React, { useState } from "react";
import { UserProfile } from "../types";
import { Trophy, Award, Star, Clock, Flame, ShieldAlert, Sparkles, Filter } from "lucide-react";
import { playMagicalSparkle } from "../utils/audio";

interface LeaderboardProps {
  allProfiles: UserProfile[];
}

interface HouseScore {
  name: string;
  crest: string;
  color: string;
  border: string;
  points: number;
  hours: number;
  studentsCount: number;
}

export default function Leaderboard({ allProfiles }: LeaderboardProps) {
  const [houseFilter, setHouseFilter] = useState<string>("All");

  // Calculate House Cup tallies
  const houseMap: Record<string, { points: number; hours: number; count: number; crest: string; color: string; border: string }> = {
    Gryffindor: { points: 0, hours: 0, count: 0, crest: "🦁", color: "bg-[#740001] text-[#FFE894]", border: "border-[#ECB939]" },
    Ravenclaw: { points: 0, hours: 0, count: 0, crest: "🦅", color: "bg-[#0E2140] text-[#E0F0FF]", border: "border-[#4E93DC]" },
    Hufflepuff: { points: 0, hours: 0, count: 0, crest: "🦡", color: "bg-[#ECB939] text-[#1A0F00]", border: "border-[#4A321E]" },
    Slytherin: { points: 0, hours: 0, count: 0, crest: "🐍", color: "bg-[#1A472A] text-[#E0FFF0]", border: "border-[#2E6F40]" }
  };

  allProfiles.forEach(p => {
    const loc = (p.location || "").toLowerCase();
    let houseName = "Gryffindor";
    if (loc.includes("ravenclaw")) houseName = "Ravenclaw";
    else if (loc.includes("slytherin")) houseName = "Slytherin";
    else if (loc.includes("hufflepuff") || loc.includes("greenhouse")) houseName = "Hufflepuff";

    if (houseMap[houseName]) {
      houseMap[houseName].hours += p.taughtHours;
      houseMap[houseName].points += Math.round(p.taughtHours * 10 + p.rating * 5 + p.credits * 2);
      houseMap[houseName].count += 1;
    }
  });

  const houseStandings: HouseScore[] = Object.entries(houseMap).map(([name, data]) => ({
    name,
    crest: data.crest,
    color: data.color,
    border: data.border,
    points: data.points,
    hours: data.hours,
    studentsCount: data.count
  })).sort((a, b) => b.points - a.points);

  // Filter & Sort student profiles by contribution ranking
  const filteredProfiles = allProfiles.filter(p => {
    if (houseFilter === "All") return true;
    const loc = (p.location || "").toLowerCase();
    if (houseFilter === "Gryffindor") return loc.includes("gryffindor");
    if (houseFilter === "Ravenclaw") return loc.includes("ravenclaw");
    if (houseFilter === "Hufflepuff") return loc.includes("hufflepuff") || loc.includes("greenhouse");
    if (houseFilter === "Slytherin") return loc.includes("slytherin");
    return true;
  });

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    if (b.taughtHours !== a.taughtHours) {
      return b.taughtHours - a.taughtHours;
    }
    return b.rating - a.rating;
  });

  const podium = sortedProfiles.slice(0, 3);

  const podiumStyles = [
    {
      bg: "bg-white dark:bg-[#1C1625] border-4 border-[#4A321E] dark:border-[#FFE894] shadow-[6px_6px_0px_#ECB939]",
      text: "text-[#4A321E] dark:text-[#FFE894]",
      badgeColor: "bg-[#ECB939] text-[#1A0F00] border-2 border-[#4A321E]",
      height: "h-52 sm:h-60 order-2",
      rank: 1,
      rankTitle: "Order of Merlin, 1st Class",
      crown: "👑"
    },
    {
      bg: "bg-white dark:bg-[#1C1625] border-4 border-[#4A321E] dark:border-[#FFE894] shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894]",
      text: "text-[#4A321E] dark:text-[#FFE894]",
      badgeColor: "bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E] dark:text-white border-2 border-[#4A321E] dark:border-[#FFE894]",
      height: "h-44 sm:h-52 order-1",
      rank: 2,
      rankTitle: "Order of Merlin, 2nd Class",
      crown: "🥈"
    },
    {
      bg: "bg-white dark:bg-[#1C1625] border-4 border-[#4A321E] dark:border-[#FFE894] shadow-[6px_6px_0px_#740001]",
      text: "text-[#4A321E] dark:text-[#FFE894]",
      badgeColor: "bg-[#740001] text-[#FFE894] border-2 border-[#ECB939]",
      height: "h-40 sm:h-44 order-3",
      rank: 3,
      rankTitle: "Order of Merlin, 3rd Class",
      crown: "🥉"
    }
  ];

  const visualPodium = [];
  if (podium[1]) visualPodium.push({ profile: podium[1], style: podiumStyles[1] });
  if (podium[0]) visualPodium.push({ profile: podium[0], style: podiumStyles[0] });
  if (podium[2]) visualPodium.push({ profile: podium[2], style: podiumStyles[2] });

  return (
    <div className="space-y-10 text-[#2C1E14] dark:text-[#EDE7E0] transition-colors">
      
      {/* 1. Hogwarts House Cup Standings */}
      <div className="rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 sm:p-8 shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-[#ECB939] px-3 py-1 text-xs font-black text-[#1A0F00] border-2 border-[#4A321E]">
                Official Standings
              </span>
            </div>
            <h3 className="text-2xl font-black font-serif text-[#4A321E] dark:text-[#FFE894] flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#ECB939] fill-[#ECB939]" />
              Hogwarts House Cup Gemstones 🏆
            </h3>
            <p className="text-xs font-semibold text-[#4A321E]/70 dark:text-white/70 mt-1">
              Points awarded for every class hour taught and spell review recorded by students.
            </p>
          </div>

          {/* Quick House filter */}
          <div className="flex flex-wrap gap-2">
            {["All", "Gryffindor", "Ravenclaw", "Hufflepuff", "Slytherin"].map(h => (
              <button
                key={h}
                onClick={() => {
                  setHouseFilter(h);
                  playMagicalSparkle();
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  houseFilter === h
                    ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E]"
                    : "bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E] dark:text-white border-2 border-[#4A321E]/20 hover:bg-[#ECB939]/20"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* 4 House Standings Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {houseStandings.map((house, idx) => {
            return (
              <div
                key={house.name}
                className={`rounded-2xl border-3 ${house.border} ${house.color} p-4 shadow-[4px_4px_0px_#4A321E] relative overflow-hidden transition-transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{house.crest}</span>
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20">
                    Rank #{idx + 1}
                  </span>
                </div>
                <h4 className="text-base font-black font-serif">{house.name}</h4>
                <div className="mt-3 pt-3 border-t border-current/20 flex items-center justify-between text-xs font-black">
                  <span>{house.points} House Pts</span>
                  <span>{house.hours}h Taught</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Podium of Top Tutors */}
      {podium.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#4A321E] dark:text-[#FFE894] flex items-center justify-center gap-2">
              <span>Goblet of</span>
              <span className="text-[#740001] dark:text-[#ECB939]">Magic Mentors</span>
              <span>🧙‍♂️</span>
            </h3>
            <p className="text-xs font-semibold text-[#4A321E]/70 dark:text-white/70 mt-1 max-w-md mx-auto">
              Our highest-rated student tutors and spellcraft contributors across all Hogwarts houses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end justify-center gap-6 pt-6 max-w-4xl mx-auto">
            {visualPodium.map(({ profile, style }) => (
              <div
                key={profile.id}
                className={`w-full sm:w-64 rounded-[2.5rem] ${style.bg} p-5 flex flex-col justify-end items-center text-center relative ${style.height} transition-all hover:-translate-y-1`}
              >
                <span className={`absolute -top-3.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#4A321E] ${style.badgeColor}`}>
                  {style.crown} {style.rankTitle}
                </span>

                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="h-16 w-16 rounded-2xl border-3 border-[#4A321E] dark:border-[#FFE894] object-cover shadow-[2px_2px_0px_#4A321E] mb-2.5 shrink-0"
                  referrerPolicy="no-referrer"
                />

                <h4 className="text-sm font-black font-serif text-[#4A321E] dark:text-[#FFE894] truncate max-w-[160px]">
                  {profile.displayName}
                </h4>
                <p className="text-[10px] text-[#4A321E]/60 dark:text-white/60 font-bold uppercase tracking-wider mt-0.5">
                  {profile.location}
                </p>

                <div className="mt-3.5 grid grid-cols-2 gap-3 border-t-2 border-[#4A321E]/10 dark:border-white/10 pt-2.5 w-full">
                  <div>
                    <span className="text-xs font-black text-[#4A321E] dark:text-[#FFE894] flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#ECB939] stroke-[2.5]" />
                      {profile.taughtHours}h
                    </span>
                    <span className="text-[9px] text-[#4A321E]/50 dark:text-white/50 font-black uppercase tracking-wider">Taught</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#4A321E] dark:text-[#FFE894] flex items-center justify-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-[#ECB939] stroke-[#4A321E] dark:stroke-[#FFE894]" />
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#4A321E]/50 dark:text-white/50 font-black uppercase tracking-wider">Rating</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Comprehensive Hogwarts Classmate Roster */}
      <div className="rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894] overflow-hidden max-w-4xl mx-auto transition-colors">
        <div className="p-4 bg-[#FDF9EE] dark:bg-[#251B33] border-b-4 border-[#4A321E] dark:border-[#FFE894] flex items-center justify-between">
          <h4 className="text-xs font-black font-serif text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider">
            All Hogwarts Witches & Wizards ({sortedProfiles.length})
          </h4>
          <span className="text-[10px] font-bold text-[#4A321E]/60 dark:text-white/60">
            Filtered by: {houseFilter}
          </span>
        </div>

        <div className="divide-y-2 divide-[#4A321E]/10 dark:divide-white/10">
          {sortedProfiles.map((profile, index) => {
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 hover:bg-[#FDF9EE] dark:hover:bg-[#251B33]/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Rank indicator */}
                  <span className={`h-8 w-8 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] flex items-center justify-center text-xs font-black shadow-[1.5px_1.5px_0px_#4A321E] ${
                    index === 0 ? "bg-[#ECB939] text-[#1A0F00]" :
                    index === 1 ? "bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E] dark:text-white" :
                    index === 2 ? "bg-[#740001] text-[#FFE894]" : "bg-[#FDF9EE] dark:bg-[#120D1A] text-[#4A321E] dark:text-white"
                  }`}>
                    {index + 1}
                  </span>

                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="h-11 w-11 rounded-xl object-cover border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[1.5px_1.5px_0px_#4A321E]"
                    referrerPolicy="no-referrer"
                  />

                  <div>
                    <h5 className="text-xs font-black text-[#4A321E] dark:text-[#FFE894] flex items-center gap-1.5 font-serif">
                      {profile.displayName}
                      <span className="text-[10px] font-normal text-[#4A321E]/60 dark:text-white/60 font-sans">
                        • {profile.location}
                      </span>
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.skills.slice(0, 2).map(s => (
                        <span key={s} className="rounded-lg bg-[#ECB939]/20 border border-[#4A321E]/20 dark:border-white/20 px-2 py-0.5 text-[9px] font-black text-[#4A321E] dark:text-[#FFE894]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <span className="block text-xs font-black text-[#4A321E] dark:text-white">{profile.taughtHours}h</span>
                    <span className="text-[9px] text-[#4A321E]/50 dark:text-white/50 font-bold uppercase tracking-wider">Taught</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] flex items-center justify-end gap-0.5">
                      <Star className="h-3 w-3 fill-[#ECB939] stroke-[#4A321E] dark:stroke-[#FFE894]" />
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#4A321E]/50 dark:text-white/50 font-bold uppercase tracking-wider">{profile.totalReviews} reviews</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
