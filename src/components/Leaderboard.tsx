import React, { useState } from "react";
import { UserProfile } from "../types";
import {
  Trophy,
  Award,
  Star,
  Clock,
  Flame,
  ShieldAlert,
  Sparkles,
  Filter,
} from "lucide-react";
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
  const houseMap: Record<
    string,
    {
      points: number;
      hours: number;
      count: number;
      crest: string;
      color: string;
      border: string;
    }
  > = {
    Gryffindor: {
      points: 0,
      hours: 0,
      count: 0,
      crest: "🦁",
      color: "bg-[#856943] text-[#c9ac77]",
      border: "border-[#c9a66b]",
    },
    Ravenclaw: {
      points: 0,
      hours: 0,
      count: 0,
      crest: "🦅",
      color: "bg-[#0E2140] text-[#E0F0FF]",
      border: "border-[#4E93DC]",
    },
    Hufflepuff: {
      points: 0,
      hours: 0,
      count: 0,
      crest: "🦡",
      color: "bg-[#c9a66b] text-[#151c29]",
      border: "border-[#d9d1c1]",
    },
    Slytherin: {
      points: 0,
      hours: 0,
      count: 0,
      crest: "🐍",
      color: "bg-[#1A472A] text-[#E0FFF0]",
      border: "border-[#2E6F40]",
    },
  };

  allProfiles.forEach((p) => {
    const loc = (p.location || "").toLowerCase();
    let houseName = "Gryffindor";
    if (loc.includes("ravenclaw")) houseName = "Ravenclaw";
    else if (loc.includes("slytherin")) houseName = "Slytherin";
    else if (loc.includes("hufflepuff") || loc.includes("greenhouse"))
      houseName = "Hufflepuff";

    if (houseMap[houseName]) {
      houseMap[houseName].hours += p.taughtHours;
      houseMap[houseName].points += Math.round(
        p.taughtHours * 10 + p.rating * 5 + p.credits * 2,
      );
      houseMap[houseName].count += 1;
    }
  });

  const houseStandings: HouseScore[] = Object.entries(houseMap)
    .map(([name, data]) => ({
      name,
      crest: data.crest,
      color: data.color,
      border: data.border,
      points: data.points,
      hours: data.hours,
      studentsCount: data.count,
    }))
    .sort((a, b) => b.points - a.points);

  // Filter & Sort student profiles by contribution ranking
  const filteredProfiles = allProfiles.filter((p) => {
    if (houseFilter === "All") return true;
    const loc = (p.location || "").toLowerCase();
    if (houseFilter === "Gryffindor") return loc.includes("gryffindor");
    if (houseFilter === "Ravenclaw") return loc.includes("ravenclaw");
    if (houseFilter === "Hufflepuff")
      return loc.includes("hufflepuff") || loc.includes("greenhouse");
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
      bg: "bg-[#fffcf5] dark:bg-[#181f2e] border border-[#d9d1c1] dark:border-[#303747] shadow-sm",
      text: "text-[#756e64] dark:text-[#c9ac77]",
      badgeColor: "bg-[#c9a66b] text-[#151c29] border border-[#d9d1c1]",
      height: "h-52 sm:h-60 order-2",
      rank: 1,
      rankTitle: "Order of Merlin, 1st Class",
      crown: "👑",
    },
    {
      bg: "bg-[#fffcf5] dark:bg-[#181f2e] border border-[#d9d1c1] dark:border-[#303747] shadow-sm dark:shadow-lg",
      text: "text-[#756e64] dark:text-[#c9ac77]",
      badgeColor:
        "bg-[#f4f0e7] dark:bg-[#1e2737] text-[#756e64] dark:text-white border border-[#d9d1c1] dark:border-[#303747]",
      height: "h-44 sm:h-52 order-1",
      rank: 2,
      rankTitle: "Order of Merlin, 2nd Class",
      crown: "🥈",
    },
    {
      bg: "bg-[#fffcf5] dark:bg-[#181f2e] border border-[#d9d1c1] dark:border-[#303747] shadow-sm",
      text: "text-[#756e64] dark:text-[#c9ac77]",
      badgeColor: "bg-[#856943] text-[#c9ac77] border border-[#c9a66b]",
      height: "h-40 sm:h-44 order-3",
      rank: 3,
      rankTitle: "Order of Merlin, 3rd Class",
      crown: "🥉",
    },
  ];

  const visualPodium = [];
  if (podium[1])
    visualPodium.push({ profile: podium[1], style: podiumStyles[1] });
  if (podium[0])
    visualPodium.push({ profile: podium[0], style: podiumStyles[0] });
  if (podium[2])
    visualPodium.push({ profile: podium[2], style: podiumStyles[2] });

  return (
    <div className="space-y-10 text-[#302d28] dark:text-[#eee9de] transition-colors">
      {/* 1. Hogwarts House Cup Standings */}
      <div className="rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] p-6 sm:p-8 shadow-sm dark:shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-[#c9a66b] px-3 py-1 text-xs font-medium text-[#151c29] border border-[#d9d1c1]">
                Official Standings
              </span>
            </div>
            <h3 className="text-2xl font-medium font-serif text-[#756e64] dark:text-[#c9ac77] flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#c9a66b] fill-[#c9a66b]" />
              Hogwarts House Cup Gemstones 🏆
            </h3>
            <p className="text-xs font-semibold text-[#756e64]/70 dark:text-white/70 mt-1">
              Points awarded for every class hour taught and spell review
              recorded by students.
            </p>
          </div>

          {/* Quick House filter */}
          <div className="flex flex-wrap gap-2">
            {["All", "Gryffindor", "Ravenclaw", "Hufflepuff", "Slytherin"].map(
              (h) => (
                <button
                  key={h}
                  onClick={() => {
                    setHouseFilter(h);
                    playMagicalSparkle();
                  }}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    houseFilter === h
                      ? "bg-[#856943] text-[#c9ac77] border border-[#d9d1c1] dark:border-[#303747] shadow-sm"
                      : "bg-[#f4f0e7] dark:bg-[#1e2737] text-[#756e64] dark:text-white border border-[#d9d1c1]/20 hover:bg-[#c9a66b]/20"
                  }`}
                >
                  {h}
                </button>
              ),
            )}
          </div>
        </div>

        {/* 4 House Standings Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {houseStandings.map((house, idx) => {
            return (
              <div
                key={house.name}
                className={`rounded-2xl border ${house.border} ${house.color} p-4 shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{house.crest}</span>
                  <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20">
                    Rank #{idx + 1}
                  </span>
                </div>
                <h4 className="text-base font-medium font-serif">
                  {house.name}
                </h4>
                <div className="mt-3 pt-3 border-t border-current/20 flex items-center justify-between text-xs font-medium">
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
            <h3 className="text-2xl sm:text-3xl font-medium font-serif text-[#756e64] dark:text-[#c9ac77] flex items-center justify-center gap-2">
              <span>Goblet of</span>
              <span className="text-[#856943] dark:text-[#c9a66b]">
                Magic Mentors
              </span>
              <span>🧙‍♂️</span>
            </h3>
            <p className="text-xs font-semibold text-[#756e64]/70 dark:text-white/70 mt-1 max-w-md mx-auto">
              Our highest-rated student tutors and spellcraft contributors
              across all Hogwarts houses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end justify-center gap-6 pt-6 max-w-4xl mx-auto">
            {visualPodium.map(({ profile, style }) => (
              <div
                key={profile.id}
                className={`w-full sm:w-64 rounded-2xl ${style.bg} p-5 flex flex-col justify-end items-center text-center relative ${style.height} transition-all hover:-translate-y-1`}
              >
                <span
                  className={`absolute -top-3.5 px-3.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider shadow-sm ${style.badgeColor}`}
                >
                  {style.crown} {style.rankTitle}
                </span>

                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="h-16 w-16 rounded-2xl border border-[#d9d1c1] dark:border-[#303747] object-cover shadow-sm mb-2.5 shrink-0"
                  referrerPolicy="no-referrer"
                />

                <h4 className="text-sm font-medium font-serif text-[#756e64] dark:text-[#c9ac77] truncate max-w-[160px]">
                  {profile.displayName}
                </h4>
                <p className="text-[10px] text-[#756e64]/60 dark:text-white/60 font-bold uppercase tracking-wider mt-0.5">
                  {profile.location}
                </p>

                <div className="mt-3.5 grid grid-cols-2 gap-3 border-t-2 border-[#d9d1c1]/10 dark:border-white/10 pt-2.5 w-full">
                  <div>
                    <span className="text-xs font-medium text-[#756e64] dark:text-[#c9ac77] flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#c9a66b] stroke-[2.5]" />
                      {profile.taughtHours}h
                    </span>
                    <span className="text-[9px] text-[#756e64]/50 dark:text-white/50 font-medium uppercase tracking-wider">
                      Taught
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#756e64] dark:text-[#c9ac77] flex items-center justify-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-[#c9a66b] stroke-[#756e64] dark:stroke-[#c9ac77]" />
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#756e64]/50 dark:text-white/50 font-medium uppercase tracking-wider">
                      Rating
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Comprehensive Hogwarts Classmate Roster */}
      <div className="rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] shadow-sm dark:shadow-lg overflow-hidden max-w-4xl mx-auto transition-colors">
        <div className="p-4 bg-[#f4f0e7] dark:bg-[#1e2737] border-b-4 border-[#d9d1c1] dark:border-[#303747] flex items-center justify-between">
          <h4 className="text-xs font-medium font-serif text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider">
            All Hogwarts Witches & Wizards ({sortedProfiles.length})
          </h4>
          <span className="text-[10px] font-bold text-[#756e64]/60 dark:text-white/60">
            Filtered by: {houseFilter}
          </span>
        </div>

        <div className="divide-y-2 divide-[#756e64]/10 dark:divide-white/10">
          {sortedProfiles.map((profile, index) => {
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 hover:bg-[#f4f0e7] dark:hover:bg-[#1e2737]/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Rank indicator */}
                  <span
                    className={`h-8 w-8 rounded-xl border border-[#d9d1c1] dark:border-[#303747] flex items-center justify-center text-xs font-medium shadow-sm ${
                      index === 0
                        ? "bg-[#c9a66b] text-[#151c29]"
                        : index === 1
                          ? "bg-[#f4f0e7] dark:bg-[#1e2737] text-[#756e64] dark:text-white"
                          : index === 2
                            ? "bg-[#856943] text-[#c9ac77]"
                            : "bg-[#f4f0e7] dark:bg-[#121826] text-[#756e64] dark:text-white"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="h-11 w-11 rounded-xl object-cover border border-[#d9d1c1] dark:border-[#303747] shadow-sm"
                    referrerPolicy="no-referrer"
                  />

                  <div>
                    <h5 className="text-xs font-medium text-[#756e64] dark:text-[#c9ac77] flex items-center gap-1.5 font-serif">
                      {profile.displayName}
                      <span className="text-[10px] font-normal text-[#756e64]/60 dark:text-white/60 font-sans">
                        • {profile.location}
                      </span>
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.skills.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="rounded-lg bg-[#c9a66b]/20 border border-[#d9d1c1]/20 dark:border-white/20 px-2 py-0.5 text-[9px] font-medium text-[#756e64] dark:text-[#c9ac77]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <span className="block text-xs font-medium text-[#756e64] dark:text-white">
                      {profile.taughtHours}h
                    </span>
                    <span className="text-[9px] text-[#756e64]/50 dark:text-white/50 font-bold uppercase tracking-wider">
                      Taught
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] flex items-center justify-end gap-0.5">
                      <Star className="h-3 w-3 fill-[#c9a66b] stroke-[#756e64] dark:stroke-[#c9ac77]" />
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#756e64]/50 dark:text-white/50 font-bold uppercase tracking-wider">
                      {profile.totalReviews} reviews
                    </span>
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
