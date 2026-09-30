import { useState } from "react";
import { motion } from "motion/react";
import {
  Coins,
  CalendarDays,
  MessageCircle,
  Trophy,
  UserRound,
  Sun,
  Moon,
  WandSparkles,
  Sparkles,
  Volume2,
  VolumeX,
  Search,
  Menu,
  X,
  GraduationCap,
  FlaskConical,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { UserProfile } from "../types";
import {
  getSoundEnabled,
  setSoundEnabled,
  playWandSwoosh,
} from "../utils/audio";
interface Props {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  onSelectProfile: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRequestCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenSearch?: () => void;
}
export const navigation = [
  {
    id: "matches",
    label: "The Great Hall",
    subtitle: "Discover your people",
    icon: GraduationCap,
  },
  {
    id: "swaps",
    label: "My Lessons",
    subtitle: "Your next chapter",
    icon: CalendarDays,
  },
  {
    id: "messages",
    label: "Owl Post",
    subtitle: "Conversations",
    icon: MessageCircle,
  },
  {
    id: "alchemy",
    label: "Potions Lab",
    subtitle: "A little experimentation",
    icon: FlaskConical,
  },
  {
    id: "practice",
    label: "Spell Practice",
    subtitle: "Perfect your craft",
    icon: WandSparkles,
  },
  {
    id: "leaderboard",
    label: "House Cup",
    subtitle: "The hall of fame",
    icon: Trophy,
  },
  {
    id: "profile",
    label: "My Wizard Profile",
    subtitle: "Skills & Galleons",
    icon: UserRound,
  },
];
export default function Navbar(p: Props) {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(getSoundEnabled);
  const go = (id: string) => {
    p.setActiveTab(id);
    setOpen(false);
    playWandSwoosh();
  };
  return (
    <>
      <header className="mobile-header">
        <button className="brand" onClick={() => go("matches")}>
          <span className="brand-mark">
            <WandSparkles size={23} />
          </span>
          <span>
            Hackwarts<small>THE MAGIC OF SHARING</small>
          </span>
        </button>
        <button
          className="icon-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <button className="brand" onClick={() => go("matches")}>
          <span className="brand-mark">
            <WandSparkles size={25} />
          </span>
          <span>
            Hackwarts<small>THE MAGIC OF SHARING</small>
          </span>
        </button>
        <div className="sidebar-rule">
          <span>✦</span>
        </div>
        <p className="eyebrow sidebar-caption">YOUR WIZARDING WORLD</p>
        <nav aria-label="Main navigation">
          {navigation.map((n, i) => (
            <button
              key={n.id}
              className={`nav-link ${p.activeTab === n.id ? "active" : ""}`}
              aria-current={p.activeTab === n.id ? "page" : undefined}
              onClick={() => go(n.id)}
            >
              {p.activeTab === n.id && (
                <motion.span
                  layoutId="nav-active"
                  className="nav-highlight"
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                />
              )}
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "swaps" && p.onRequestCount > 0 ? (
                <b className="nav-count">{p.onRequestCount}</b>
              ) : p.activeTab === n.id ? (
                <span className="nav-dot" />
              ) : null}
              {i === 2 && (
                <span className="sr-only">End of community navigation</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={20} />
          <h3>
            A little magic.
            <br />A lot of possibility.
          </h3>
          <p>
            Share what you know.
            <br />
            Discover what you could become.
          </p>
          <button onClick={() => go("practice")}>
            Try a spell <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="wallet">
            <span>
              <Coins size={17} /> YOUR GALLEONS
            </span>
            <strong>
              {p.activeProfile?.credits.toFixed(1) || "0.0"}
              <small>1 Galleon = 1 hour</small>
            </strong>
          </div>
          <label className="persona">
            <span className="avatar-initial">
              {p.activeProfile?.displayName
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <small>EXPLORING AS</small>
              <select
                aria-label="Active wizard profile"
                value={p.activeProfile?.id || ""}
                onChange={(e) => p.onSelectProfile(e.target.value)}
              >
                {p.profiles.map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.displayName}
                    {u.isMock ? " (Demo)" : ""}
                  </option>
                ))}
              </select>
            </span>
            <ChevronDown size={14} />
          </label>
        </div>
      </aside>
      <div className="topbar">
        <span className="breadcrumb">
          Hogwarts <span>/</span>{" "}
          {navigation.find((n) => n.id === p.activeTab)?.label}
        </span>
        <div className="topbar-tools">
          <button className="search-trigger" onClick={p.onOpenSearch}>
            <Search size={15} />
            <span>Search the castle</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="icon-button"
            aria-label={sound ? "Mute sound effects" : "Enable sound effects"}
            aria-pressed={sound}
            onClick={() => {
              setSound(!sound);
              setSoundEnabled(!sound);
            }}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            className="icon-button"
            aria-label={`Switch to ${p.theme === "dark" ? "light" : "dark"} theme`}
            onClick={p.onToggleTheme}
          >
            {p.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="topbar-avatar avatar-initial"
            aria-label="Open my profile"
            onClick={() => go("profile")}
          >
            {p.activeProfile?.displayName[0] || "H"}
          </button>
        </div>
      </div>
    </>
  );
}
