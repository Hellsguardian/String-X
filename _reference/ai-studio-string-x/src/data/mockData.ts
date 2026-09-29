import { UserProfile } from '../types';

export const INDIAN_STATES_LIST = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

export const INDIAN_UNION_TERRITORIES = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export const ALL_INDIAN_STATES_AND_UTS = [
  ...INDIAN_STATES_LIST,
  ...INDIAN_UNION_TERRITORIES,
  'Other'
];

export const INDIAN_STATES = ALL_INDIAN_STATES_AND_UTS;

export const POPULAR_COLLEGES = [
  'NIFT Gandhinagar',
  'DA-IICT Gandhinagar',
  'PDPU / PDEU',
  'CEPT University',
  'IIT Gandhinagar',
  'IIM Ahmedabad',
  'NMIMS Mumbai',
  'Mithibai College',
  'St. Xavier\'s College',
  'BITS Pilani',
  'IIT Bombay',
  'Symbiosis Pune',
  'Delhi University (DU)',
  'Other Campus'
];

export const DEPARTMENTS = [
  { id: 'eng', name: 'Engineering & Tech', icon: '💻', desc: 'Code by day, Garba by night' },
  { id: 'des', name: 'Design & Architecture', icon: '🎨', desc: 'Outfit aesthetics 10/10' },
  { id: 'bus', name: 'Management & BBA/MBA', icon: '📊', desc: 'Networking on the dance floor' },
  { id: 'art', name: 'Arts, Media & Liberal', icon: '🎭', desc: 'Main character energy' },
  { id: 'sci', name: 'Science & Bio/Med', icon: '🔬', desc: 'Anatomically accurate spins' },
  { id: 'law', name: 'Law & Humanities', icon: '⚖️', desc: 'Will argue for one more round' },
  { id: 'oth', name: 'Other Department', icon: '✨', desc: 'Keeping campus wild' }
];

export const GARBA_LEVELS = [
  {
    id: 'vibes',
    title: 'Zero 😭',
    subtitle: 'Just here for the vibes.',
    badge: 'Vibe Seeker',
    icon: '😭',
    bg: '#FFECF4',
    border: '#F02A8A',
    accent: '#F02A8A'
  },
  {
    id: 'basics',
    title: 'A few steps 👌',
    subtitle: 'I can clap while moving in circles.',
    badge: 'Rhythm Ready',
    icon: '👌',
    bg: '#D4CEEF',
    border: '#894EFF',
    accent: '#894EFF'
  },
  {
    id: 'decent',
    title: 'Pretty good 🔥',
    subtitle: 'I can rotate without buffering.',
    badge: 'Circle Leader',
    icon: '🔥',
    bg: '#FFF9E6',
    border: '#FFC928',
    accent: '#FFC928'
  },
  {
    id: 'beast',
    title: 'I’m from Gujarat 😌',
    subtitle: 'The circle moves around me.',
    badge: 'Sanedo Final Boss',
    icon: '😌',
    bg: '#E2F8F4',
    border: '#08A98D',
    accent: '#08A98D'
  }
];

export const NAVRATRI_EXCITEMENT_OPTIONS = [
  {
    id: 'garba',
    title: '💃 Garba',
    description: 'The dance floor is calling.'
  },
  {
    id: 'outfits',
    title: '📸 Outfits, Photos & Reels',
    description: 'Here for the memories and the camera roll.'
  },
  {
    id: 'food',
    title: '🍜 Food & Late-Night Plans',
    description: "Garba can wait. Food can't."
  },
  {
    id: 'people',
    title: '🫂 Meeting New People',
    description: 'New faces, new friends, new stories.'
  },
  {
    id: 'nightout',
    title: '🪩 Finally, a Whole Night Out!',
    description: 'Nine nights. Zero hostel curfew.'
  }
];

export const GARBA_ENERGIES = [
  {
    level: 'Chill',
    title: 'Chill Mode ☕',
    description: 'Sip cold drinks, dance 2 casual rounds, take photos, vibe peacefully.'
  },
  {
    level: 'Casual',
    title: 'Casual Groove 🎶',
    description: 'Warm up slowly, jump into moderate circles, take break every 20 mins.'
  },
  {
    level: 'Energetic',
    title: 'Full Energy ⚡',
    description: 'Sweat through the kurta/chaniya, lead the taalis, dance till midnight.'
  },
  {
    level: 'No Breaks',
    title: 'No Breaks / 3 AM Beast 🪩',
    description: 'Feet bleeding? Doesn\'t matter. Chogada on repeat, last person leaving.'
  }
];

export const GENERAL_INTERESTS = [
  { id: 'Movies', label: 'Movies' },
  { id: 'Reading', label: 'Reading' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Cooking', label: 'Cooking' },
  { id: 'Vlogging', label: 'Vlogging' },
  { id: 'Fitness', label: 'Fitness' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Anime', label: 'Anime' },
  { id: 'Photography', label: 'Photography' },
  { id: 'Late Night Chai', label: 'Late Night Chai' },
  { id: 'Reels', label: 'Reels' },
  { id: 'Content Creation', label: 'Content Creation' },
  { id: 'Skateboarding', label: 'Skateboarding' },
  { id: 'Travel', label: 'Travel' },
  { id: 'Basketball', label: 'Basketball' },
  { id: 'Badminton', label: 'Badminton' },
  { id: 'Music', label: 'Music' },
  { id: 'Dance', label: 'Dance' },
  { id: 'Singing', label: 'Singing' },
  { id: 'Instruments', label: 'Instruments' },
  { id: 'Coding', label: 'Coding' },
  { id: 'Food', label: 'Food' },
  { id: 'Making New Friends', label: 'Making New Friends' },
  { id: 'Gym', label: 'Gym' },
  { id: 'Art', label: 'Art' },
  { id: 'Running', label: 'Running' },
  { id: 'Exploring Cafés', label: 'Exploring Cafés' },
  { id: 'Design', label: 'Design' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'Other', label: 'Other' },
  { id: 'Events & Parties', label: 'Events & Parties' },
  { id: 'Volunteering', label: 'Volunteering' },
  { id: 'Road Trips', label: 'Road Trips' },
];

export const PU_EVENING_SPOTS = [
  { id: 'Greenzee', name: 'Greenzee' },
  { id: 'Capitol', name: 'Capitol' },
  { id: 'New Food Court', name: 'New Food Court' },
  { id: 'Hostel Room', name: 'Hostel Room' },
];

export const FESTIVAL_INTERESTS = [
  { id: 'dandiya', label: 'Dandiya Raas 🥢', category: 'Dance' },
  { id: 'maggie', label: '1 AM Maggie & Chai 🍜', category: 'Food' },
  { id: 'outfits', label: 'Chaniya Choli / Kurta drip ✨', category: 'Vibe' },
  { id: 'reels', label: 'Aesthetic Reels & Photos 📸', category: 'Media' },
  { id: 'sanedo', label: 'Sanedo Screaming 🗣️', category: 'Dance' },
  { id: 'twotaali', label: 'Traditional 2-Taali 👏', category: 'Dance' },
  { id: 'streetfood', label: 'Night Market Food Hopping 🧆', category: 'Food' },
  { id: 'friends', label: 'Making New Friends 🤝', category: 'Social' },
  { id: 'music', label: 'Dhol & Live Band 🥁', category: 'Music' },
  { id: 'latewalk', label: 'Post-Garba Campus Walks 🌙', category: 'Vibe' },
  { id: 'styling', label: 'Oxidised Jewellery & Tattoos 🪞', category: 'Style' },
  { id: 'teaching', label: 'Teaching Noobs New Steps 💡', category: 'Social' }
];

export const PROMPTS = {
  lastRound: {
    question: 'Your friend says "one last round" at 1 AM.',
    subtitle: "Be totally honest here 👀",
    options: [
      {
        main: "Nope.",
        subtext: "I’m out.",
        tag: "EARLY SLEEPER",
        emoji: "💤",
        emojiBg: "#E8EEFF",
        text: "Nope. I’m out.",
        vibe: "EARLY SLEEPER"
      },
      {
        main: "Fine…",
        subtext: "just one more.",
        tag: "EASILY PERSUADED",
        emoji: "🤝",
        emojiBg: "#FFF5D6",
        text: "Fine… just one more.",
        vibe: "EASILY PERSUADED"
      },
      {
        main: "Obviously staying",
        subtext: "the night just started.",
        tag: "NIGHT OWL",
        emoji: "🔥",
        emojiBg: "#FFE8DF",
        text: "Obviously staying the night just started.",
        desc: "the night just started.",
        vibe: "NIGHT OWL"
      },
      {
        main: "Ofcourse",
        subtext: "I was never planning to leave.",
        tag: "SECRETLY HYPED",
        emoji: "💬",
        emojiBg: "#FCE7F3",
        text: "Ofcourse I was never planning to leave.",
        vibe: "SECRETLY HYPED"
      }
    ]
  },
  personality: {
    question: "Pick your Navratri persona.",
    subtitle: "Who are you once the dhol kicks in?",
    options: [
      { text: "Main Character 👑", emoji: "✨", desc: "Front row, best outfit, knows all camera angles" },
      { text: "Dance Machine ⚡", emoji: "💃", desc: "Non-stop spinning, hasn't drank water in 2 hours" },
      { text: "Campus Photographer 📸", emoji: "🎞️", desc: "Takes 600 candids of everyone, delivers drive link" },
      { text: "Night Food Hunter 🥟", emoji: "🍲", desc: "Knows every stall within a 5km radius" },
      { text: "Pure Vibes ✨", emoji: "🪩", desc: "Just clapping along, hyping everyone up" }
    ]
  },
  partnerNewStep: {
    question: "Your Garba partner suddenly starts a crazy new step.",
    subtitle: "Quick reflex test:",
    options: [
      { text: "Instantly copy them and match the energy", emoji: "👯", vibe: "Adrenaline match" },
      { text: "Watch respectfully and cheer them on 👏", emoji: "👀", vibe: "Great hype partner" },
      { text: "Raise the stakes and go even harder 🔥", emoji: "🚀", vibe: "Friendly rivalry" },
      { text: "Panic, laugh hysterically, and trip 😂", emoji: "💀", vibe: "Wholesome chaos" }
    ]
  }
};

export const AVATAR_PRESETS = [
  {
    id: 'avatar1',
    name: 'Aanya (Chaniya Choli Queen)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    tag: 'Festive Glam'
  },
  {
    id: 'avatar2',
    name: 'Kabir (Kurta & Sneaker Drip)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    tag: 'Classic Swag'
  },
  {
    id: 'avatar3',
    name: 'Riya (Oxidised & Bohemian)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    tag: 'Boho Vibe'
  },
  {
    id: 'avatar4',
    name: 'Dev (High Energy Dhol Lover)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    tag: 'Dance Beast'
  }
];

export const INITIAL_USER_PROFILE: UserProfile = {
  collegeEmail: '',
  phone: '',
  collegeName: 'Parul University',
  hostel: '',
  fullName: '',
  nickname: '',
  pronouns: '',
  age: 0,
  photoUrl: '',
  additionalPhotos: [],
  gender: '',
  heightCm: 0,
  weightKg: 0,
  homeState: '',
  collegeYear: '',
  department: '',
  garbaLevel: '',
  garbaLevelTitle: '',
  garbaEnergy: '',
  navratriVibes: [],
  interests: [],
  favouriteEveningSpot: '',
  navratriExcitement: 50,
  partnerGenderPreference: '',
  partnerVibePreference: '',
  answerLastRound: '',
  answerPersonality: '',
  answerPartnerNewStep: '',
  instagramId: ''
};

export const SAMPLE_MATCH_PROFILE = {
  name: 'Arjun Mehta',
  nickname: 'Arju',
  age: 21,
  collegeYear: '3rd Year',
  college: 'DA-IICT Gandhinagar',
  department: 'Engineering & Tech',
  photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  height: '179 cm',
  garbaLevel: 'Pretty decent 🔥',
  garbaEnergy: 'No Breaks / 3 AM Beast 🪩',
  homeState: 'Gujarat',
  matchCompatibility: 98,
  sharedInterests: ['Dandiya Raas 🥢', '1 AM Maggie & Chai 🍜', 'Sanedo Screaming 🗣️', 'Night Market Food Hopping 🧆'],
  favoritePromptAnswer: "Stay till 3 AM. I live in the ground now.",
  compatibilityReasons: [
    'Both matched on: High Garba stamina & 3-taali synchronization',
    'Shared love for late-night campus food hunts',
    'Both stay past 1 AM without tapping out!'
  ]
};
