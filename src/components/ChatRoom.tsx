import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Message } from "../types";
import { db, collection, addDoc, onSnapshot, query, where, orderBy, limit } from "../firebase";
import { Send, MessageSquare, AlertCircle, Compass, Calendar, Search, Sparkles } from "lucide-react";
import { playOwlPostChime } from "../utils/audio";

interface ChatRoomProps {
  currentProfile: UserProfile | null;
  targetUserId: string | null;
  allProfiles: UserProfile[];
  initialPrefilledMessage?: string;
  onOpenSchedule?: (targetProfile: UserProfile, skill: string) => void;
}

const QUICK_OWL_REPLIES = [
  "Meet at the Library at 7 PM? 📚",
  "The Room of Requirement is open! 🗝️",
  "Floo coordinates confirmed 🟢",
  "Bring your dragon-hide gloves! 🧤",
  "Which spellcraft shall we review first? 🪄"
];

export default function ChatRoom({
  currentProfile,
  targetUserId,
  allProfiles,
  initialPrefilledMessage = "",
  onOpenSchedule
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState(initialPrefilledMessage || "");
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive target partner
  useEffect(() => {
    if (targetUserId) {
      const found = allProfiles.find(p => p.id === targetUserId);
      setActivePartner(found || null);
    } else {
      setActivePartner(null);
    }
  }, [targetUserId, allProfiles]);

  // Sync prefilled message if it changes
  useEffect(() => {
    if (initialPrefilledMessage) {
      setInputText(initialPrefilledMessage);
    }
  }, [initialPrefilledMessage]);

  // Real-time listener for messages in active chatId
  useEffect(() => {
    if (!currentProfile || !targetUserId) {
      setMessages([]);
      return;
    }

    const chatId = currentProfile.id < targetUserId
      ? `${currentProfile.id}_${targetUserId}`
      : `${targetUserId}_${currentProfile.id}`;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text,
          timestamp: data.timestamp
        });
      });
      setMessages(list);
    }, (error) => {
      console.error("Chat real-time subscription error:", error);
    });

    return () => unsubscribe();
  }, [currentProfile, targetUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentProfile) return null;

  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !targetUserId) return;

    const chatId = currentProfile.id < targetUserId
      ? `${currentProfile.id}_${targetUserId}`
      : `${targetUserId}_${currentProfile.id}`;

    setInputText("");
    playOwlPostChime();

    try {
      await addDoc(collection(db, "messages"), {
        chatId,
        senderId: currentProfile.id,
        receiverId: targetUserId,
        text: textToSend,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputText(textToSend);
    }
  };

  // Filter partners
  const chatPartners = allProfiles.filter(p => 
    p.id !== currentProfile.id &&
    (p.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
     p.location.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-14rem)] min-h-[520px] rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] overflow-hidden shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894] text-[#2C1E14] dark:text-[#EDE7E0] transition-colors">
      
      {/* Left Sidebar: Conversational Thread Index */}
      <div className="w-full md:w-1/3 border-b-4 md:border-b-0 md:border-r-4 border-[#4A321E] dark:border-[#FFE894] flex flex-col bg-[#FDF9EE] dark:bg-[#120D1A]">
        
        {/* Header & Search */}
        <div className="p-4 border-b-2 border-[#4A321E]/15 dark:border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black font-serif text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider flex items-center gap-1.5">
              <span>Owl Post Messenger</span>
              <span>🦉</span>
            </h3>
            <span className="text-[10px] font-bold text-[#4A321E]/60 dark:text-white/60">
              {chatPartners.length} Classmates
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#4A321E]/50 dark:text-white/50" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search classmates..."
              className="w-full rounded-xl border border-[#4A321E]/20 dark:border-white/20 bg-white dark:bg-[#1C1625] pl-8 pr-3 py-1.5 text-xs font-bold text-[#4A321E] dark:text-white placeholder-[#4A321E]/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Partners List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {chatPartners.map((partner) => {
            const isSelected = partner.id === targetUserId;
            return (
              <button
                key={partner.id}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("switch-chat-partner", { detail: partner.id }));
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left cursor-pointer ${
                  isSelected
                    ? "bg-[#ECB939] text-[#1A0F00] border-2 border-[#4A321E] shadow-[2px_2px_0px_#4A321E]"
                    : "hover:bg-white dark:hover:bg-[#251B33] text-[#4A321E] dark:text-white border-2 border-transparent"
                }`}
              >
                <img
                  src={partner.photoURL}
                  alt={partner.displayName}
                  className="h-10 w-10 rounded-xl object-cover border-2 border-[#4A321E] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black truncate">{partner.displayName}</h4>
                  <p className="text-[10px] font-bold opacity-75 truncate mt-0.5">
                    {partner.location} • ★ {partner.rating.toFixed(1)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content: Active Messages Viewport */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1C1625]">
        {activePartner ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-4 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33]">
              <div className="flex items-center gap-3">
                <img
                  src={activePartner.photoURL}
                  alt={activePartner.displayName}
                  className="h-11 w-11 rounded-2xl object-cover border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-black font-serif text-[#4A321E] dark:text-[#FFE894]">
                    {activePartner.displayName}
                  </h3>
                  <span className="text-[10px] text-[#740001] dark:text-[#ECB939] font-black uppercase tracking-wider block mt-0.5">
                    {activePartner.location} • Teaches: {activePartner.skills.slice(0, 2).join(", ")}
                  </span>
                </div>
              </div>

              {/* Action Button: Schedule Lesson */}
              {onOpenSchedule && (
                <button
                  onClick={() => onOpenSchedule(activePartner, activePartner.skills[0] || "")}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#740001] text-[#FFE894] px-3.5 py-2 text-xs font-black shadow-[2px_2px_0px_#4A321E] active:translate-y-0.5 cursor-pointer transition-all"
                >
                  <Calendar className="h-4 w-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Propose Trade</span>
                </button>
              )}
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDF9EE]/40 dark:bg-[#120D1A]/50">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#4A321E]/60 dark:text-white/60">
                  <div className="w-12 h-12 rounded-full bg-[#ECB939]/20 border-2 border-[#4A321E] flex items-center justify-center text-2xl mb-3">
                    🦉
                  </div>
                  <p className="text-xs font-black text-[#4A321E] dark:text-[#FFE894] font-serif">
                    No parchment letters exchanged yet
                  </p>
                  <p className="text-[11px] max-w-xs mt-1 font-semibold">
                    Send an owl letter or click a quick reply below to coordinate your spell swap schedule!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentProfile.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-end gap-2 max-w-[75%]">
                        {!isMe && (
                          <img
                            src={activePartner.photoURL}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover shrink-0 mb-1 border border-[#4A321E]"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div
                          className={`rounded-2xl border-2 border-[#4A321E] dark:border-[#FFE894] px-4 py-2.5 text-xs font-bold leading-relaxed shadow-[2px_2px_0px_#4A321E] ${
                            isMe
                              ? "bg-[#740001] text-[#FFE894] rounded-br-none"
                              : "bg-[#ECB939] text-[#1A0F00] rounded-bl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Carousel */}
            <div className="px-3 py-2 bg-[#FDF9EE] dark:bg-[#251B33] border-t-2 border-[#4A321E]/10 dark:border-white/10 flex items-center gap-2 overflow-x-auto">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#4A321E]/50 dark:text-white/50 shrink-0">
                Quick Owl:
              </span>
              {QUICK_OWL_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(null as any, reply)}
                  className="shrink-0 rounded-lg border border-[#4A321E]/30 dark:border-[#FFE894]/30 bg-white dark:bg-[#1C1625] px-2.5 py-1 text-[10px] font-bold text-[#4A321E] dark:text-[#FFE894] hover:bg-[#ECB939] hover:text-[#1A0F00] transition-all cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Footer Form Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-[#4A321E] dark:border-[#FFE894] flex gap-2 bg-white dark:bg-[#1C1625]">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Dispatch an owl letter to ${activePartner.displayName}...`}
                className="flex-1 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-4 py-2.5 text-xs font-bold text-[#4A321E] dark:text-white placeholder-[#4A321E]/40 dark:placeholder-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#740001] border-2 border-[#4A321E] dark:border-[#FFE894] text-[#FFE894] font-black shadow-[2px_2px_0px_#4A321E] active:translate-y-0.5 transition-all disabled:opacity-40 cursor-pointer"
                title="Send Owl"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-[#4A321E]/60 dark:text-white/60 p-8 text-center bg-[#FDF9EE]/20">
            <Compass className="h-12 w-12 text-[#740001] dark:text-[#FFE894] mb-3 animate-pulse" />
            <p className="text-sm font-black font-serif text-[#4A321E] dark:text-[#FFE894]">
              Select an Owl Dispatch Thread
            </p>
            <p className="text-xs mt-1 max-w-xs font-medium">
              Choose a classmate from the left or visit the Sorting Hat matches to begin an exchange.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
