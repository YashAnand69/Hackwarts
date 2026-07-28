import React from "react";
import { UserProfile } from "../types";
import { Trophy, Award, Star, Clock, Flame, ShieldAlert, ArrowRight } from "lucide-react";

interface LeaderboardProps {
  allProfiles: UserProfile[];
}

export default function Leaderboard({ allProfiles }: LeaderboardProps) {
  // Sort profiles by contribution ranking: taught hours descending, then rating descending
  const sortedProfiles = [...allProfiles].sort((a, b) => {
    if (b.taughtHours !== a.taughtHours) {
      return b.taughtHours - a.taughtHours;
    }
    return b.rating - a.rating;
  });

  const podium = sortedProfiles.slice(0, 3);
  const remaining = sortedProfiles.slice(3);

  // Helper for podium ranks styles
  const podiumStyles = [
    {
      bg: "bg-white dark:bg-[#1E1E1E] border-4 border-[#2D2D2D] dark:border-white shadow-[6px_6px_0px_#FFE66D]",
      text: "text-[#2D2D2D] dark:text-white",
      badgeColor: "bg-[#FFE66D] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white",
      height: "h-48 md:h-56 order-2",
      rank: 1,
      rankTitle: "Gold Mentor",
    },
    {
      bg: "bg-white dark:bg-[#1E1E1E] border-4 border-[#2D2D2D] dark:border-white shadow-[6px_6px_0px_#4ECDC4]",
      text: "text-[#2D2D2D] dark:text-white",
      badgeColor: "bg-[#4ECDC4] text-[#2D2D2D] border-2 border-[#2D2D2D] dark:border-white",
      height: "h-40 md:h-48 order-1",
      rank: 2,
      rankTitle: "Silver Mentor",
    },
    {
      bg: "bg-white dark:bg-[#1E1E1E] border-4 border-[#2D2D2D] dark:border-white shadow-[6px_6px_0px_#FF6B6B]",
      text: "text-[#2D2D2D] dark:text-white",
      badgeColor: "bg-[#FF6B6B] text-white border-2 border-[#2D2D2D] dark:border-white",
      height: "h-36 md:h-40 order-3",
      rank: 3,
      rankTitle: "Bronze Mentor",
    }
  ];

  // Map podium list into proper layout: 2nd place, 1st place, 3rd place visually
  const visualPodium = [];
  if (podium[1]) visualPodium.push({ profile: podium[1], style: podiumStyles[1] }); // Silver on left
  if (podium[0]) visualPodium.push({ profile: podium[0], style: podiumStyles[0] }); // Gold in center
  if (podium[2]) visualPodium.push({ profile: podium[2], style: podiumStyles[2] }); // Bronze on right

  return (
    <div className="space-y-8 text-[#2D2D2D] dark:text-white">
      
      {/* Visual Podium section */}
      {podium.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-[#2D2D2D] dark:text-white flex items-center justify-center gap-2 tracking-tight">
              <Trophy className="h-7 w-7 text-[#FFD23F] fill-[#FFD23F] stroke-[#2D2D2D] dark:stroke-white stroke-[2]" />
              Mentor <span className="text-[#FF6B6B]">Leaderboard</span>
            </h3>
            <p className="text-xs font-bold text-[#2D2D2D]/60 dark:text-white/60 mt-1 max-w-md mx-auto">
              Our community thrives on shared knowledge! Meet our most active neighborhood mentors ranked by hours taught.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end justify-center gap-6 pt-6 max-w-4xl mx-auto">
            {visualPodium.map(({ profile, style }) => (
              <div
                key={profile.id}
                className={`w-full sm:w-64 rounded-[2rem] ${style.bg} p-5 flex flex-col justify-end items-center text-center relative ${style.height} transition-all hover:-translate-y-1`}
              >
                {/* Gold/Silver/Bronze crown badge */}
                <span className={`absolute -top-3 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] ${style.badgeColor}`}>
                  ★ Rank {style.rank}
                </span>

                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="h-16 w-16 rounded-full border-4 border-[#2D2D2D] dark:border-white object-cover shadow-[2px_2px_0px_#2D2D2D] dark:shadow-[2px_2px_0px_white] mb-3 shrink-0"
                  referrerPolicy="no-referrer"
                />

                <h4 className="text-sm font-black text-[#2D2D2D] dark:text-white truncate max-w-[150px]">
                  {profile.displayName}
                </h4>
                <p className="text-[10px] text-[#2D2D2D]/60 dark:text-white/60 font-bold mt-1 uppercase tracking-wider">{profile.location}</p>

                <div className="mt-4 grid grid-cols-2 gap-3.5 border-t-2 border-[#2D2D2D]/10 dark:border-white/10 pt-3 w-full">
                  <div>
                    <span className="block text-sm font-black text-[#2D2D2D] dark:text-white flex items-center justify-center gap-0.5">
                      <Clock className="h-3.5 w-3.5 text-[#4ECDC4] stroke-[2.5]" />
                      {profile.taughtHours}h
                    </span>
                    <span className="text-[9px] text-[#2D2D2D]/50 dark:text-white/50 font-black uppercase tracking-wider">Taught</span>
                  </div>
                  <div>
                    <span className="block text-sm font-black text-[#2D2D2D] dark:text-white flex items-center justify-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-[#FFD23F] stroke-[#2D2D2D] dark:stroke-white stroke-[1.5]" />
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#2D2D2D]/50 dark:text-white/50 font-black uppercase tracking-wider">Rating</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard list / remaining volunteers */}
      <div className="rounded-[2rem] border-4 border-[#2D2D2D] dark:border-white bg-white dark:bg-[#1E1E1E] shadow-[6px_6px_0px_#2D2D2D] dark:shadow-[6px_6px_0px_white] overflow-hidden max-w-4xl mx-auto transition-colors">
        <div className="p-4 bg-[#F3F3F3] dark:bg-[#2D2D2D] border-b-4 border-[#2D2D2D] dark:border-white">
          <h4 className="text-xs font-black text-[#2D2D2D] dark:text-white uppercase tracking-wider">
            All Neighborhood Volunteers
          </h4>
        </div>

        <div className="divide-y-2 divide-[#2D2D2D]/10 dark:divide-white/10">
          {sortedProfiles.map((profile, index) => {
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 hover:bg-[#FDFCF8] dark:hover:bg-[#2D2D2D]/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Rank number indicator */}
                  <span className={`h-8 w-8 rounded-xl border-2 border-[#2D2D2D] dark:border-white flex items-center justify-center text-xs font-black shadow-[1.5px_1.5px_0px_#2D2D2D] dark:shadow-[1.5px_1.5px_0px_white] ${
                    index === 0 ? "bg-[#FFE66D] text-[#2D2D2D] dark:text-[#2D2D2D]" :
                    index === 1 ? "bg-[#4ECDC4] text-[#2D2D2D] dark:text-[#2D2D2D]" :
                    index === 2 ? "bg-[#FF6B6B] text-white" : "bg-[#F3F3F3] dark:bg-[#2D2D2D] text-[#2D2D2D] dark:text-white"
                  }`}>
                    {index + 1}
                  </span>

                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="h-11 w-11 rounded-xl object-cover border-2 border-[#2D2D2D] dark:border-white shadow-[1.5px_1.5px_0px_#2D2D2D] dark:shadow-[1.5px_1.5px_0px_white]"
                    referrerPolicy="no-referrer"
                  />

                  <div>
                    <h5 className="text-xs font-black text-[#2D2D2D] dark:text-white flex items-center gap-1.5">
                      {profile.displayName}
                      {profile.isMock && (
                        <span className="rounded-lg bg-[#F3F3F3] dark:bg-[#2D2D2D] border border-[#2D2D2D]/20 dark:border-white/20 px-1.5 py-0.5 text-[8px] font-black text-[#2D2D2D]/50 dark:text-white/50 uppercase tracking-wider">Demo</span>
                      )}
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.skills.slice(0, 2).map(s => (
                        <span key={s} className="rounded-lg bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 dark:border-white/20 px-1.5 py-0.5 text-[9px] font-bold text-[#1D7A73] dark:text-[#4ECDC4]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <span className="block text-xs font-black text-[#2D2D2D] dark:text-white">{profile.taughtHours} Hours</span>
                    <span className="text-[9px] text-[#2D2D2D]/50 dark:text-white/50 font-bold uppercase tracking-wider">Contributed</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#2D2D2D] dark:text-white flex items-center justify-end gap-0.5">
                      <Star className="h-3 w-3 fill-[#FFD23F] stroke-[#2D2D2D] dark:stroke-white stroke-[1]" />
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#2D2D2D]/50 dark:text-white/50 font-bold uppercase tracking-wider">{profile.totalReviews} reviews</span>
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
