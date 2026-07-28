export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  skills: string[]; // can teach
  needs: string[]; // wants to learn
  credits: number;
  rating: number;
  totalReviews: number;
  taughtHours: number;
  location: string;
  isMock?: boolean;
  createdAt: string;
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  receiverId: string;
  receiverName: string;
  skill: string;
  credits: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  dateTime: string;
  duration: number; // in hours
  notes: string;
  createdAt: string;
  learnerReviewed?: boolean;
  teacherReviewed?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
}

export interface Review {
  id: string;
  swapId: string;
  authorId: string;
  authorName: string;
  targetId: string;
  rating: number;
  comment: string;
  role: 'learner' | 'teacher';
  createdAt: string;
}

export interface SmartMatch {
  user: UserProfile;
  commonInterests: string[];
  compatibilityScore: number; // 0 - 100
  icebreaker: string;
  reasoning: string;
}
