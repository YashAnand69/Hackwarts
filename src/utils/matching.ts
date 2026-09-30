import type { UserProfile, SmartMatch } from "../types";
export const normalizeSkill = (skill: string) =>
  skill.trim().toLocaleLowerCase();
export const sharesSkill = (a: string[], b: string[]) =>
  a.filter((s) => b.some((n) => normalizeSkill(n) === normalizeSkill(s)));
export function localMatches(
  current: UserProfile,
  profiles: UserProfile[],
): SmartMatch[] {
  return profiles
    .filter((p) => p.id !== current.id)
    .map((user) => {
      const learn = sharesSkill(user.skills, current.needs),
        teach = sharesSkill(user.needs, current.skills);
      const commonInterests = [...new Set([...learn, ...teach])];
      return {
        user,
        commonInterests,
        compatibilityScore: Math.min(
          100,
          Math.round(
            35 +
              learn.length * 18 +
              teach.length * 14 +
              (learn.length && teach.length ? 10 : 0) +
              user.rating * 3,
          ),
        ),
        reasoning:
          learn.length && teach.length
            ? "A two-way exchange: you both have something to share."
            : learn.length
              ? `Can help you learn ${learn[0]}.`
              : teach.length
                ? `Would love to learn ${teach[0]} from you.`
                : "Explore a new subject together.",
        icebreaker: `Hi ${user.displayName.split(" ")[0]}! I'd love to ${learn.length ? `learn ${learn[0]} from you` : teach.length ? `help you with ${teach[0]}` : `explore ${user.skills[0] || "magic"} together`}. Shall we plan a lesson?`,
      };
    })
    .sort(
      (a, b) =>
        b.compatibilityScore - a.compatibilityScore ||
        b.user.rating - a.user.rating,
    );
}
export function houseOf(user: UserProfile): string {
  const known: Record<string, string> = {
    harry_potter: "Gryffindor",
    hermione_granger: "Gryffindor",
    neville_longbottom: "Gryffindor",
    draco_malfoy: "Slytherin",
    luna_lovegood: "Ravenclaw",
    cho_chang: "Ravenclaw",
    cedric_diggory: "Hufflepuff",
  };
  return (
    ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"].find((h) =>
      user.location.toLowerCase().includes(h.toLowerCase()),
    ) ||
    known[user.id] ||
    "Hogwarts"
  );
}
