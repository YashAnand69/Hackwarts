import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Message } from "../types";
import { db, collection, addDoc, onSnapshot, query, where, orderBy, limit } from "../firebase";
import { Send, MessageSquare, AlertCircle, Compass } from "lucide-react";

interface ChatRoomProps {
  currentProfile: UserProfile | null;
  targetUserId: string | null;
  allProfiles: UserProfile[];
  initialPrefilledMessage?: string;
}

export default function ChatRoom({
  currentProfile,
  targetUserId,
  allProfiles,
  initialPrefilledMessage = ""
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState(initialPrefilledMessage || "");
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);
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

  // Sync prefilled message if it changes (e.g. from Match card click)
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !targetUserId) return;

    const chatId = currentProfile.id < targetUserId
      ? `${currentProfile.id}_${targetUserId}`
      : `${targetUserId}_${currentProfile.id}`;

    const textToSend = inputText;
    setInputText(""); // Instant UI clearing

    try {
      await addDoc(collection(db, "messages"), {
        chatId,
        senderId: currentProfile.id,
        receiverId: targetUserId,
        text: textToSend,
        timestamp: new Date().toISOString() // Fallback iso string keeps ordering and works offline/instantly!
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputText(textToSend); // Restore if failed
    }
  };

  // Find users who have open chats with this user by compiling a list from active profiles
  const chatPartners = allProfiles.filter(p => p.id !== currentProfile.id);

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[480px] rounded-[2rem] border-4 border-[#2D2D2D] bg-white overflow-hidden shadow-[6px_6px_0px_#2D2D2D]">
      
      {/* Left Sidebar: Conversational Thread Index */}
      <div className="w-1/3 border-r-4 border-[#2D2D2D] flex flex-col bg-[#F3F3F3]">
        <div className="p-4 border-b-4 border-[#2D2D2D] bg-white">
          <h3 className="text-xs font-black text-[#2D2D2D] uppercase tracking-wider">
            Owl Post Chats 🦉
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {chatPartners.map((partner) => {
            const isSelected = partner.id === targetUserId;
            return (
              <button
                key={partner.id}
                onClick={() => {
                  // Navigate to this partner's chat
                  window.dispatchEvent(new CustomEvent("switch-chat-partner", { detail: partner.id }));
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                  isSelected
                    ? "bg-[#FFE66D] border-2 border-[#2D2D2D] shadow-[2px_2px_0px_#2D2D2D] mx-1"
                    : "hover:bg-white hover:border-[#2D2D2D]/30 border-2 border-transparent mx-1"
                }`}
              >
                <img
                  src={partner.photoURL}
                  alt={partner.displayName}
                  className="h-9 w-9 rounded-xl object-cover border-2 border-[#2D2D2D] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block min-w-0 flex-1">
                  <h4 className="text-xs font-black text-[#2D2D2D] truncate">{partner.displayName}</h4>
                  <p className="text-[10px] font-bold text-[#2D2D2D]/60 truncate mt-0.5">{partner.location}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content: Active Messages viewport */}
      <div className="flex-1 flex flex-col bg-white">
        {activePartner ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3.5 p-4 border-b-4 border-[#2D2D2D] bg-[#FDFCF8]">
              <img
                src={activePartner.photoURL}
                alt={activePartner.displayName}
                className="h-11 w-11 rounded-xl object-cover border-2 border-[#2D2D2D] shadow-[1.5px_1.5px_0px_#2D2D2D]"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-sm font-black text-[#2D2D2D]">{activePartner.displayName}</h3>
                <span className="text-[10px] text-[#FF6B6B] font-black uppercase tracking-wider block mt-0.5">
                  {activePartner.location} • Hogwarts Study Partner
                </span>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFD23F]/5">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#2D2D2D]/40">
                  <MessageSquare className="h-10 w-10 text-[#FF6B6B] mb-2" />
                  <p className="text-xs font-black text-[#2D2D2D]">No letters yet</p>
                  <p className="text-[10px] max-w-xs mt-1 font-bold">Send a friendly owl letter to coordinate your spell swap schedule!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentProfile.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-end gap-2 max-w-[70%]">
                        {!isMe && (
                          <img
                            src={activePartner.photoURL}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover shrink-0 mb-1 border border-[#2D2D2D]"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div
                          className={`rounded-2xl border-2 border-[#2D2D2D] px-4 py-2.5 text-xs font-bold leading-relaxed shadow-[2px_2px_0px_#2D2D2D] ${
                            isMe
                              ? "bg-[#4ECDC4] text-[#2D2D2D] rounded-br-none"
                              : "bg-[#FFE66D] text-[#2D2D2D] rounded-bl-none"
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

            {/* Footer Form input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t-4 border-[#2D2D2D] flex gap-2 bg-white">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a message to ${activePartner.displayName}...`}
                className="flex-1 rounded-xl border-2 border-[#2D2D2D] bg-[#F3F3F3] px-4 py-3 text-xs font-bold text-[#2D2D2D] placeholder-[#2D2D2D]/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20 shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B6B] border-2 border-[#2D2D2D] text-white font-black shadow-[2.5px_2.5px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-4.5 w-4.5 text-white" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-[#2D2D2D]/40 p-8 text-center bg-[#FFD23F]/5">
            <Compass className="h-12 w-12 text-[#FF6B6B] mb-3 animate-pulse" />
            <p className="text-sm font-black text-[#2D2D2D]">Select an owl communication</p>
            <p className="text-[10px] mt-1 text-[#2D2D2D]/60 max-w-xs font-bold">
              Go to the matches feed and click "Send Owl Post" to open direct owl-post communication lines with Hogwarts student classmates.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
