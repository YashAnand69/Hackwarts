import { UserProfile } from "./types";

export const MOCK_PROFILES: UserProfile[] = [
  {
    id: "maya_lin",
    displayName: "Maya Lin",
    email: "maya.lin@community.org",
    photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
    bio: "French tutor and watercolor artist based in Noe Valley. Eager to help you learn conversational French or paint beautiful landscapes. Looking to pick up standard acoustic guitar and beginner yoga!",
    skills: ["Conversational French", "Watercolor Painting", "Landscape Sketching"],
    needs: ["Acoustic Guitar", "Beginner Yoga", "React Frontend Dev"],
    credits: 8,
    rating: 4.9,
    totalReviews: 12,
    taughtHours: 15,
    location: "Noe Valley, SF",
    isMock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "marcus_vance",
    displayName: "Marcus Vance",
    email: "marcus.vance@community.org",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
    bio: "Acoustic and electric guitarist of 10 years. Teaching rhythm, chords, music theory, and songwriting. Looking to learn authentic Thai cooking and React frontend development.",
    skills: ["Acoustic Guitar", "Music Theory Basics", "Songwriting"],
    needs: ["Thai Cooking", "React Frontend Dev", "Conversational French"],
    credits: 4,
    rating: 4.8,
    totalReviews: 8,
    taughtHours: 10,
    location: "Mission District, SF",
    isMock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "hiroshi_sato",
    displayName: "Dr. Hiroshi Sato",
    email: "hiroshi.sato@community.org",
    photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250",
    bio: "Retired professor of history and culinary enthusiast. Specialty: Japanese homestyle cooking (ramen, gyoza, sushi) and Calligraphy. Wants to learn landscape sketching and conversational French.",
    skills: ["Japanese Cooking", "Japanese Calligraphy", "World History"],
    needs: ["Landscape Sketching", "Conversational French", "Digital Photography"],
    credits: 6,
    rating: 5.0,
    totalReviews: 14,
    taughtHours: 22,
    location: "Sunset District, SF",
    isMock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "elena_rostova",
    displayName: "Elena Rostova",
    email: "elena.rostova@community.org",
    photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250",
    bio: "Senior React engineer by day, yoga instructor by evening. Let's build beautiful apps together or practice morning vinyasa flow. Seeking to learn Japanese cooking and watercolor painting.",
    skills: ["React Frontend Dev", "Beginner Yoga", "TypeScript Basics"],
    needs: ["Japanese Cooking", "Watercolor Painting", "Japanese Calligraphy"],
    credits: 5,
    rating: 4.7,
    totalReviews: 9,
    taughtHours: 12,
    location: "SoMa, SF",
    isMock: true,
    createdAt: new Date().toISOString()
  }
];
