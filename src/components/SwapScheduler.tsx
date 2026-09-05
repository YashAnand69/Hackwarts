import React, { useState } from "react";
import { UserProfile, SwapRequest } from "../types";
import { collection, addDoc, db } from "../firebase";
import { Calendar, Clock, AlertCircle, Sparkles, Check, X, ShieldAlert, MapPin, Wand2 } from "lucide-react";
import { playOwlPostChime, playWandSwoosh } from "../utils/audio";

interface SwapSchedulerProps {
  currentProfile: UserProfile | null;
  targetProfile: UserProfile;
  initialSkill: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FLOO_LOCATIONS = [
  "Room of Requirement",
  "Hogwarts Library (Restricted Section)",
  "Greenhouse 3 (Mandrakes)",
  "Great Hall Fireside",
  "Astronomy Tower",
  "Quidditch Pitch Stands",
  "Potions Dungeon B-4"
];

export default function SwapScheduler({
  currentProfile,
  targetProfile,
  initialSkill,
  onClose,
  onSuccess
}: SwapSchedulerProps) {
  const [selectedSkill, setSelectedSkill] = useState(initialSkill || targetProfile.skills[0] || "");
  const [duration, setDuration] = useState(1); // Hours
  const [dateTime, setDateTime] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Room of Requirement");
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!currentProfile) return null;

  // Credit calculation: 1 credit per hour
  const requiredCredits = duration * 1;
  const hasEnoughCredits = currentProfile.credits >= requiredCredits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) {
      setError("Please select a magical discipline or spellcraft to learn.");
      return;
    }
    if (!dateTime) {
      setError("Please pick a scheduled date and time.");
      return;
    }
    if (!hasEnoughCredits) {
      setError("Insufficient Galleons! Tutor a classmate to earn Galleons before booking more spell trades.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const combinedNotes = `Location: ${selectedLocation}\n${notes}`.trim();

      // 1. Add SwapRequest to Firestore
      const swapData: Omit<SwapRequest, "id"> = {
        requesterId: currentProfile.id,
        requesterName: currentProfile.displayName,
        receiverId: targetProfile.id,
        receiverName: targetProfile.displayName,
        skill: selectedSkill,
        credits: requiredCredits,
        status: "pending",
        dateTime: new Date(dateTime).toISOString(),
        duration,
        notes: combinedNotes,
        createdAt: new Date().toISOString(),
        learnerReviewed: false,
        teacherReviewed: false
      };

      await addDoc(collection(db, "swaps"), swapData);
      playOwlPostChime();
      onSuccess();
    } catch (err) {
      console.error("Scheduling error:", err);
      setError("Failed to dispatch schedule owl. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 p-4 backdrop-blur-xs animate-fade-in text-[#2C1E14] dark:text-[#EDE7E0]">
      <div className="w-full max-w-lg rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 sm:p-8 shadow-[8px_8px_0px_#4A321E] dark:shadow-[8px_8px_0px_#FFE894] animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#740001] flex items-center justify-center text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E]">
              <Calendar className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black font-serif text-[#4A321E] dark:text-[#FFE894]">
                Propose Spell Trade 📜
              </h3>
              <span className="text-[10px] font-bold text-[#4A321E]/60 dark:text-white/60">
                Dispatch an official Hogwarts Skill Exchange request
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] p-1.5 text-[#4A321E] dark:text-[#FFE894] hover:bg-[#ECB939]/20 cursor-pointer transition-all"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Teacher Snapshot */}
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-[#FDF9EE] dark:bg-[#251B33] p-4 border-3 border-[#4A321E] dark:border-[#FFE894] shadow-[3px_3px_0px_#4A321E]">
          <img
            src={targetProfile.photoURL}
            alt={targetProfile.displayName}
            className="h-12 w-12 rounded-xl object-cover border-2 border-[#4A321E] dark:border-[#FFE894]"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[9px] font-black text-[#740001] dark:text-[#ECB939] uppercase tracking-wider block">
              SPELL TUTOR
            </span>
            <h4 className="text-sm font-black font-serif text-[#4A321E] dark:text-[#FFE894] mt-0.5">
              {targetProfile.displayName}
            </h4>
            <p className="text-[10px] font-bold text-[#4A321E]/70 dark:text-white/70 mt-0.5">
              ★ {targetProfile.rating.toFixed(1)} • {targetProfile.location}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#740001]/10 dark:bg-[#740001]/30 p-3 text-xs font-bold text-[#740001] dark:text-[#FFE894] border-2 border-[#740001]">
            <AlertCircle className="h-5 w-5 text-[#740001] shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Skill Selector */}
          <div>
            <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
              Which spellcraft do you wish to study?
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3 py-2.5 text-xs font-black text-[#4A321E] dark:text-white focus:outline-none"
            >
              <option value="">-- Choose spellcraft topic --</option>
              {targetProfile.skills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Duration & Date-Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
                Lesson Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3 py-2.5 text-xs font-black text-[#4A321E] dark:text-white focus:outline-none"
              >
                <option value={1}>1.0 Hour (1.0 Galleon)</option>
                <option value={1.5}>1.5 Hours (1.5 Galleons)</option>
                <option value={2}>2.0 Hours (2.0 Galleons)</option>
                <option value={3}>3.0 Hours (3.0 Galleons)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
                Owl Meeting Time
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3 py-2 text-xs font-black text-[#4A321E] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Floo Location Presets */}
          <div>
            <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#740001] dark:text-[#ECB939]" />
              Floo Network Meeting Point
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3 py-2.5 text-xs font-black text-[#4A321E] dark:text-white focus:outline-none"
            >
              {FLOO_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Coordinate info */}
          <div>
            <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
              Personal Owl Note (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3 py-2 text-xs font-semibold text-[#4A321E] dark:text-white placeholder-[#4A321E]/40 dark:placeholder-white/40 focus:outline-none"
              placeholder="e.g. Please bring your dragon-hide gloves, or I have spare parchment for incantation notes..."
            />
          </div>

          {/* Credit Math summary box */}
          <div className="rounded-2xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#ECB939]/15 dark:bg-[#FFE894]/10 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#4A321E]/70 dark:text-white/70">Your Galleon Vault Balance:</span>
              <span className="font-black text-[#4A321E] dark:text-[#FFE894]">{currentProfile.credits.toFixed(1)} Galleons</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#4A321E]/70 dark:text-white/70">Exchange Fee (Escrowed upon finish):</span>
              <span className="font-black text-[#740001] dark:text-[#FFE894]">-{requiredCredits.toFixed(1)} Galleons</span>
            </div>
            <hr className="border-[#4A321E]/10 dark:border-white/10" />
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-[#4A321E] dark:text-white">Post-Session Balance:</span>
              <span className={hasEnoughCredits ? "text-[#1A472A] dark:text-[#4ECDC4]" : "text-[#740001]"}>
                {(currentProfile.credits - requiredCredits).toFixed(1)} Galleons
              </span>
            </div>

            {!hasEnoughCredits && (
              <div className="mt-2.5 flex items-start gap-1.5 text-[10px] font-black text-[#740001] dark:text-[#FFE894] bg-[#740001]/10 rounded-xl p-3 border border-[#740001]/30">
                <ShieldAlert className="h-4.5 w-4.5 text-[#740001] shrink-0 stroke-[2.5]" />
                <span>Insufficient Galleons in your Gringotts vault. Tutor a classmate to earn Galleons!</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#251B33] text-[#4A321E] dark:text-[#FFE894] font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#4A321E] cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasEnoughCredits}
              className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#740001] text-[#FFE894] font-black px-6 py-2.5 text-xs shadow-[3px_3px_0px_#4A321E] dark:shadow-[3px_3px_0px_#FFE894] cursor-pointer disabled:opacity-40 transition-all active:translate-y-0.5"
            >
              {isSubmitting ? "Dispatching Owl..." : "Dispatch Request Owl 🦉"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
