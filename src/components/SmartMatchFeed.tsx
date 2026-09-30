import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Star,
  MessageCircle,
  BookOpen,
  Clock3,
  RotateCw,
  X,
  Bookmark,
  WandSparkles,
  UsersRound,
} from "lucide-react";
import type { UserProfile, SmartMatch } from "../types";
import { localMatches, houseOf, sharesSkill } from "../utils/matching";
import CastleScene from "./CastleScene";
interface Props {
  currentProfile: UserProfile | null;
  allProfiles: UserProfile[];
  onOpenSchedule: (p: UserProfile, skill: string) => void;
  onStartChat: (p: UserProfile, text: string) => void;
  onNavigate?: (tab: string) => void;
}
const houses = [
  "All houses",
  "Gryffindor",
  "Slytherin",
  "Ravenclaw",
  "Hufflepuff",
];
export default function SmartMatchFeed({
  currentProfile,
  allProfiles,
  onOpenSchedule,
  onStartChat,
  onNavigate,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [house, setHouse] = useState("All houses");
  const [sort, setSort] = useState("compatibility");
  const [advanced, setAdvanced] = useState(false);
  const [remote, setRemote] = useState<{
    owner: string;
    matches: SmartMatch[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null);
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("hackwarts-saved") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    controller.current?.abort();
    setLoading(false);
    setNotice("");
    setRemote(null);
  }, [currentProfile?.id]);
  const matches = useMemo(
    () =>
      currentProfile
        ? remote?.owner === currentProfile.id
          ? remote.matches
          : localMatches(currentProfile, allProfiles)
        : [],
    [currentProfile, allProfiles, remote],
  );
  const refresh = async () => {
    if (!currentProfile || loading) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setNotice("");
    const timer = setTimeout(() => abort.abort(), 12000);
    try {
      const r = await fetch("/api/matchmaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProfile, allProfiles }),
        signal: abort.signal,
      });
      if (!r.ok) throw new Error("Matchmaking unavailable");
      const data = await r.json();
      if (!Array.isArray(data.matches)) throw new Error("Invalid response");
      const baseline = localMatches(currentProfile, allProfiles);
      const enhanced = baseline.map((m) => {
        const x = data.matches.find((n: any) => n.userId === m.user.id);
        return x &&
          Number.isFinite(x.compatibilityScore) &&
          Array.isArray(x.commonInterests) &&
          typeof x.reasoning === "string" &&
          typeof x.icebreaker === "string"
          ? {
              ...m,
              compatibilityScore: Math.max(
                0,
                Math.min(100, x.compatibilityScore),
              ),
              reasoning: x.reasoning,
              icebreaker: x.icebreaker,
            }
          : m;
      });
      setRemote({ owner: currentProfile.id, matches: enhanced });
      setNotice("Your matches have been refreshed.");
    } catch {
      if (controller.current === abort)
        setNotice(
          "The Sorting Hat is resting. Skill-based matches are ready below.",
        );
    } finally {
      clearTimeout(timer);
      if (controller.current === abort) setLoading(false);
    }
  };
  const toggleSave = (id: string) => {
    const next = saved.includes(id)
      ? saved.filter((x) => x !== id)
      : [...saved, id];
    setSaved(next);
    localStorage.setItem("hackwarts-saved", JSON.stringify(next));
  };
  const filtered = matches
    .filter((m) => {
      const text = [
        m.user.displayName,
        m.user.bio,
        m.user.location,
        houseOf(m.user),
        ...m.user.skills,
        ...m.user.needs,
      ]
        .join(" ")
        .toLowerCase();
      return (
        text.includes(query.trim().toLowerCase()) &&
        (house === "All houses" || houseOf(m.user) === house) &&
        (filter === "all" ||
          (filter === "saved" && saved.includes(m.user.id)) ||
          (filter === "learn" &&
            !!currentProfile &&
            sharesSkill(m.user.skills, currentProfile.needs).length > 0) ||
          (filter === "teach" &&
            !!currentProfile &&
            sharesSkill(m.user.needs, currentProfile.skills).length > 0))
      );
    })
    .sort((a, b) =>
      sort === "rating"
        ? b.user.rating - a.user.rating
        : sort === "name"
          ? a.user.displayName.localeCompare(b.user.displayName)
          : b.compatibilityScore - a.compatibilityScore,
    );
  const reset = () => {
    setQuery("");
    setFilter("all");
    setHouse("All houses");
  };
  return (
    <div className="discover-page">
      <section className="welcome-heading">
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h1>
            Welcome to the Great Hall<span className="heading-star">✧</span>
          </h1>
          <p>
            Every wizard has something to teach. Every wizard has something to
            learn.
          </p>
        </div>
        <span className="term-badge">
          <span /> The castle is open
        </span>
      </section>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <span>✦</span> KNOWLEDGE IS ITS OWN KIND OF MAGIC
          </p>
          <h2>
            Great things begin
            <br />
            with a little <em>exchange.</em>
          </h2>
          <p>
            Find your magical match, trade an hour of your craft,
            <br className="desktop-break" /> and discover a world beyond your
            own house.
          </p>
          <button
            className="gold-button"
            onClick={() => document.getElementById("discover-search")?.focus()}
          >
            Find my magical match <ArrowRight size={17} />
          </button>
          <span className="hero-footnote">
            <UsersRound size={14} /> {allProfiles.length} wizards. Endless
            possibilities.
          </span>
        </div>
        <CastleScene />
        <span className="hero-caption">
          HOGWARTS SCHOOL OF WITCHCRAFT & WIZARDRY
        </span>
      </section>
      <section className="stat-row" aria-label="Your activity">
        <button onClick={() => onNavigate?.("profile")}>
          <span className="stat-icon gold">
            <Sparkles size={20} />
          </span>
          <span>
            <small>YOUR TIME, YOUR TREASURE</small>
            <strong>
              {currentProfile?.credits.toFixed(1) || "0.0"}{" "}
              <em>Galleons to explore</em>
            </strong>
          </span>
          <ArrowUpRight size={16} />
        </button>
        <button onClick={() => onNavigate?.("profile")}>
          <span className="stat-icon green">
            <Clock3 size={20} />
          </span>
          <span>
            <small>MAGIC YOU'VE SHARED</small>
            <strong>
              {currentProfile?.taughtHours || 0} <em>hours of teaching</em>
            </strong>
          </span>
          <ArrowUpRight size={16} />
        </button>
        <button
          onClick={() => {
            setFilter("learn");
            document.getElementById("discover-search")?.focus();
          }}
        >
          <span className="stat-icon violet">
            <BookOpen size={20} />
          </span>
          <span>
            <small>YOUR NEXT ADVENTURE</small>
            <strong>
              {currentProfile?.needs.length || 0} <em>subjects to discover</em>
            </strong>
          </span>
          <ArrowUpRight size={16} />
        </button>
      </section>
      <section id="matches" className="match-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">THE SORTING HAT HAS A FEW IDEAS</p>
            <h2>Your kind of magic</h2>
            <p>
              Kindred spirits, complementary skills, and a little serendipity.
            </p>
          </div>
          <button
            className="subtle-button"
            disabled={loading}
            onClick={refresh}
          >
            <RotateCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Consulting the Hat…" : "Refresh matches"}
          </button>
        </div>
        <div className="discovery-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              id="discover-search"
              aria-label="Search wizards, skills or houses"
              placeholder="Search wizards, spells, or subjects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={15} />
              </button>
            )}
          </div>
          <select
            aria-label="Filter by house"
            value={house}
            onChange={(e) => setHouse(e.target.value)}
          >
            {houses.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
          <button
            className={`filter-button ${advanced ? "selected" : ""}`}
            aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        </div>
        {advanced && (
          <div className="advanced-filters">
            <label>
              Sort by{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="compatibility">Best match</option>
                <option value="rating">Highest rating</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
            <button
              className="subtle-button"
              onClick={() => {
                reset();
                setSort("compatibility");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
        <div className="filter-row">
          <div className="filter-tabs" role="group" aria-label="Match type">
            {[
              { id: "all", label: "All wizards" },
              { id: "learn", label: "I want to learn" },
              { id: "teach", label: "I can teach" },
              { id: "saved", label: "Saved" },
            ].map((t) => (
              <button
                key={t.id}
                aria-pressed={filter === t.id}
                className={filter === t.id ? "selected" : ""}
                onClick={() => setFilter(t.id)}
              >
                {t.label}
                {t.id === "saved" && saved.length > 0 ? (
                  <span>{saved.length}</span>
                ) : null}
              </button>
            ))}
          </div>
          <span className="results-count" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "wizard" : "wizards"}{" "}
            found
          </span>
        </div>
        {notice && (
          <p className="match-notice" role="status">
            <Sparkles size={14} />
            {notice}
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <WandSparkles size={36} />
            <h3>No wizards on this path… yet.</h3>
            <p>
              Try a different subject or house, or explore all your matches.
            </p>
            <button className="gold-button" onClick={reset}>
              Show all wizards <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="wizard-grid">
            {filtered.map((m, i) => {
              const houseName = houseOf(m.user);
              const need = currentProfile
                ? sharesSkill(m.user.skills, currentProfile.needs)
                : [];
              return (
                <motion.article
                  key={m.user.id}
                  className={`wizard-card house-${houseName.toLowerCase()}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 5) * 0.06, duration: 0.35 }}
                >
                  <div className="card-top">
                    <span className="house-label">
                      <span /> {houseName}
                    </span>
                    <button
                      className={`save-button ${saved.includes(m.user.id) ? "saved" : ""}`}
                      aria-label={`${saved.includes(m.user.id) ? "Unsave" : "Save"} ${m.user.displayName}`}
                      aria-pressed={saved.includes(m.user.id)}
                      onClick={() => toggleSave(m.user.id)}
                    >
                      <Bookmark
                        size={17}
                        fill={
                          saved.includes(m.user.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="wizard-identity">
                    <span className="wizard-avatar">
                      {m.user.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                      <span className="avatar-spark">✦</span>
                    </span>
                    <div>
                      <h3>{m.user.displayName}</h3>
                      <span className="wizard-rating">
                        <Star size={12} fill="currentColor" />{" "}
                        {m.user.rating.toFixed(1)}{" "}
                        <span>({m.user.totalReviews} reviews)</span>
                      </span>
                    </div>
                  </div>
                  <p className="wizard-bio">
                    {m.user.bio.split("Wand:")[0].trim() || m.user.bio}
                  </p>
                  <div className="skill-block">
                    <p className="eyebrow">CAN SHARE THEIR MAGIC IN</p>
                    <div className="skill-tags">
                      {m.user.skills.map((s) => (
                        <button
                          key={s}
                          onClick={() => onOpenSchedule(m.user, s)}
                          className={need.includes(s) ? "skill-match" : ""}
                          title={`Book a lesson in ${s}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="match-insight">
                    <Sparkles size={14} />
                    <p>
                      <strong>{m.compatibilityScore}% compatible</strong>
                      <span>{m.reasoning}</span>
                    </p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="book-button"
                      disabled={!m.user.skills.length}
                      onClick={() =>
                        onOpenSchedule(m.user, need[0] || m.user.skills[0])
                      }
                    >
                      Plan a lesson <ArrowUpRight size={16} />
                    </button>
                    <button
                      className="chat-button"
                      aria-label={`Send an owl to ${m.user.displayName}`}
                      onClick={() => onStartChat(m.user, m.icebreaker)}
                    >
                      <MessageCircle size={17} />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
      <p className="discover-footer">
        ✧ &nbsp; Different houses. Shared curiosity. A little more magic.
      </p>
    </div>
  );
}
