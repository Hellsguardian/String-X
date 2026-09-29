import { EventDefinition, EventMatch } from '../types/events';

export const STRINGX_EVENTS: EventDefinition[] = [
  {
    id: 'navratri',
    category: 'cultural',
    title: 'NAVRATRI',
    tagline: 'Find your Garba partner',
    shortDesc: 'Sync your 3-taali rhythm, late-night chai stamina & dance energy before the dhol drops.',
    emoji: '🪩',
    participantCount: '12.4K joining',
    joinedCountNum: 12430,
    accentColor: '#894EFF',
    accentBg: '#F3EEFF',
    accentBorder: '#894EFF',
    themeGradient: 'from-[#894EFF] via-[#F02A8A] to-[#FFC928]',
    badge: 'LIVE ON CAMPUS',
    date: 'Starts Oct 12 · 9 Nights',
    location: 'Main University Grounds & Partner Domes',
    introHeadline: "Let's find your Garba vibe.",
    introSubtitle: "A few quick questions help us find someone you'll actually enjoy dancing with.",
    questions: [
      {
        id: 'garba-experience',
        numberLabel: 'Question 01',
        title: 'How much Garba do you know?',
        subtitle: 'Be real! Clappers and Sanedo beasts both get paired.',
        type: 'cards',
        options: [
          {
            id: 'beginner',
            title: 'Just starting',
            subtitle: 'Figuring out the 2-taali groove on the sidelines',
            emoji: '🌱',
            vibe: 'Enthusiastic beginner',
            badge: 'Learner'
          },
          {
            id: 'basics',
            title: 'Know a few steps',
            subtitle: 'Can do Dodhiya & 2-Taali without stepping on toes',
            emoji: '💃',
            vibe: 'Rhythm confident',
            badge: 'Solid groover'
          },
          {
            id: 'decent',
            title: 'Pretty good',
            subtitle: '3-Taali, fast spins, can lead the circle with style',
            emoji: '🔥',
            vibe: 'Circle favorite',
            badge: 'Spin master'
          },
          {
            id: 'pro',
            title: 'Garba pro',
            subtitle: 'Sanedo beast, 250 RPM spins, non-stop stamina',
            emoji: '👑',
            vibe: 'Final Boss',
            badge: 'Pro Tier'
          }
        ]
      },
      {
        id: 'garba-energy',
        numberLabel: 'Question 02',
        title: "What's your Garba energy?",
        subtitle: 'How hard are we going once the rhythm kicks in?',
        type: 'cards',
        options: [
          {
            id: 'chill',
            title: 'Chill & casual',
            subtitle: 'Sip cold drinks, take photos, jump in for friendly rounds',
            emoji: '☕',
            vibe: 'Aesthetic observer'
          },
          {
            id: 'vibes',
            title: 'Here for the vibes',
            subtitle: 'Hype the circle, scream the chorus, eat midnight snacks',
            emoji: '✨',
            vibe: 'Vibe catalyst'
          },
          {
            id: 'full-energy',
            title: 'Full energy',
            subtitle: 'Sweat through the kurta, lead the taalis, dance till midnight',
            emoji: '⚡',
            vibe: 'High voltage'
          },
          {
            id: 'no-breaks',
            title: 'Dance till the last beat',
            subtitle: "Feet bleeding? Doesn't matter. Last person leaving!",
            emoji: '🪩',
            vibe: 'Untamed stamina'
          }
        ]
      },
      {
        id: 'partner-type',
        numberLabel: 'Question 03',
        title: 'What kind of partner sounds right?',
        subtitle: 'Focusing on dance compatibility and event chemistry.',
        type: 'cards',
        options: [
          {
            id: 'match-energy',
            title: 'Someone who matches my energy',
            subtitle: 'Same tempo, synchronized flow, no holding back',
            emoji: '👯',
            vibe: 'Sync master'
          },
          {
            id: 'can-teach',
            title: 'Someone who can teach me',
            subtitle: 'Guide me through crazy steps and keep it effortless',
            emoji: '💡',
            vibe: 'Curious learner'
          },
          {
            id: 'learn-together',
            title: 'Someone I can learn with',
            subtitle: 'Laugh when we mess up, celebrate when we nail it',
            emoji: '🤝',
            vibe: 'Partner in crime'
          },
          {
            id: 'pure-fun',
            title: "Someone who's just here to have fun",
            subtitle: 'Zero pressure, maximum laughs and unforgettable memories',
            emoji: '🎉',
            vibe: 'Pure fun'
          }
        ]
      },
      {
        id: 'frequency',
        numberLabel: 'Question 04',
        title: 'How often do you play Garba?',
        subtitle: 'Tap your typical seasonal habit across the 9 nights.',
        type: 'scale',
        scalePoints: [
          { value: 'never', label: 'First time', emoji: '🐣' },
          { value: 'sometimes', label: '2–3 Nights', emoji: '✨' },
          { value: 'often', label: '5–6 Nights', emoji: '🔥' },
          { value: 'daily', label: 'All 9 Nights', emoji: '👑' }
        ]
      },
      {
        id: 'ideal-night',
        numberLabel: 'Question 05',
        title: "What's your ideal Navratri night?",
        subtitle: 'Pick the plot that sounds like peak happiness.',
        type: 'cards',
        options: [
          {
            id: 'dance-all-night',
            title: 'Dance all night',
            subtitle: 'Pure rhythm from ground entry till the security turns off lights',
            emoji: '💃',
            vibe: 'Unstoppable groove'
          },
          {
            id: 'dance-convo',
            title: 'Dance + conversations',
            subtitle: 'Spinning for 40 mins, then hot chai and deep late-night talks',
            emoji: '🍵',
            vibe: 'Balanced soul'
          },
          {
            id: 'meet-people',
            title: 'Meet new people',
            subtitle: 'Circle hopping, expanding the campus crew, and making memories',
            emoji: '🤝',
            vibe: 'Social butterfly'
          },
          {
            id: 'spontaneous',
            title: "Let's see where the night goes",
            subtitle: 'No schedule, spontaneous night market food hopping & laughs',
            emoji: '🚀',
            vibe: 'Free spirit'
          }
        ]
      },
      {
        id: 'social-energy',
        numberLabel: 'Question 06',
        title: "What's your social energy?",
        subtitle: 'Drag the slider to define your social frequency for the night.',
        type: 'slider',
        sliderConfig: {
          minLabel: 'Keep it chill',
          maxLabel: "LET'S MEET EVERYONE",
          defaultValue: 70
        }
      }
    ],
    vibeDimensions: [
      { key: 'dance', label: 'Dance energy', defaultScore: 88, color: '#894EFF' },
      { key: 'experience', label: 'Garba experience', defaultScore: 74, color: '#F02A8A' },
      { key: 'social', label: 'Social energy', defaultScore: 92, color: '#FFC928' },
      { key: 'vibe', label: 'Event vibe', defaultScore: 96, color: '#08A98D' }
    ]
  },
  {
    id: 'freshers',
    category: 'campus',
    title: 'FRESHERS',
    tagline: 'Meet someone before the first lecture',
    shortDesc: 'Skip the awkward icebreakers. Find your college day-one buddy to survive classes, canteen runs & campus life.',
    emoji: '🎓',
    participantCount: '842 joining',
    joinedCountNum: 842,
    accentColor: '#08A98D',
    accentBg: '#E6FAF7',
    accentBorder: '#08A98D',
    themeGradient: 'from-[#08A98D] via-[#059669] to-[#3B82F6]',
    badge: 'CAMPUS MUST',
    date: 'This Weekend · 4 PM Onwards',
    location: 'Student Amphitheatre & Campus Lawn',
    introHeadline: 'Find your campus day-one.',
    introSubtitle: 'A few quick questions help us match you with someone on your exact campus wavelength.',
    questions: [
      {
        id: 'looking-forward',
        numberLabel: 'Question 01',
        title: 'What are you looking forward to?',
        subtitle: 'What brings you the most excitement about college?',
        type: 'cards',
        options: [
          {
            id: 'making-friends',
            title: 'Making friends',
            subtitle: 'Building a solid inner circle that survives 4 years together',
            emoji: '🤝',
            vibe: 'Circle builder'
          },
          {
            id: 'exploring-campus',
            title: 'Exploring campus',
            subtitle: 'Finding hidden rooftop spots, best chai tapris & study nooks',
            emoji: '🗺️',
            vibe: 'Campus explorer'
          },
          {
            id: 'parties-events',
            title: 'Parties & events',
            subtitle: 'Never missing a cultural fest, weekend gig, or campus concert',
            emoji: '🎉',
            vibe: 'Event hunter'
          },
          {
            id: 'finding-people',
            title: 'Finding my people',
            subtitle: 'Genuine souls who match my niche music and random obsessions',
            emoji: '✨',
            vibe: 'Soul tribe'
          }
        ]
      },
      {
        id: 'how-social',
        numberLabel: 'Question 02',
        title: 'How social are you?',
        subtitle: 'Select the statement that sounds most like you.',
        type: 'cards',
        options: [
          {
            id: 'low-key',
            title: 'Low-key',
            subtitle: 'Prefer meaningful 1-on-1 conversations over crowded rooms',
            emoji: '🎧',
            vibe: 'Quiet & thoughtful'
          },
          {
            id: 'in-between',
            title: 'Somewhere in between',
            subtitle: 'Ambivert vibe: down to hang, but definitely need recharge time',
            emoji: '⚖️',
            vibe: 'Balanced ambivert'
          },
          {
            id: 'very-social',
            title: 'Very social',
            subtitle: 'Can make friends with anyone in line at the campus canteen',
            emoji: '⚡',
            vibe: 'Social powerhouse'
          }
        ]
      },
      {
        id: 'ideal-first-meet',
        numberLabel: 'Question 03',
        title: "What's your ideal first meet?",
        subtitle: 'How would you prefer to break the ice?',
        type: 'cards',
        options: [
          {
            id: 'coffee',
            title: 'Coffee & iced tea',
            subtitle: 'Casual cafe table, exchanging timetable horror stories',
            emoji: '☕',
            vibe: 'Cafe debrief'
          },
          {
            id: 'campus-walk',
            title: 'Campus walk',
            subtitle: 'Strolling between department blocks and checking campus vibes',
            emoji: '🚶‍♂️',
            vibe: 'Breezy stroll'
          },
          {
            id: 'food',
            title: 'Food / Canteen run',
            subtitle: 'Hitting the legendary Maggie & samosa stall near gate 3',
            emoji: '🥟',
            vibe: 'Foodie bond'
          },
          {
            id: 'college-event',
            title: 'College event / gig',
            subtitle: 'Catching an orientation comedy act or live acoustic jamming',
            emoji: '🎸',
            vibe: 'Festival spirit'
          }
        ]
      },
      {
        id: 'click-with',
        numberLabel: 'Question 04',
        title: 'What kind of people do you click with?',
        subtitle: 'What personality trait makes an instant friendship for you?',
        type: 'cards',
        options: [
          {
            id: 'funny',
            title: 'Funny',
            subtitle: 'Constant witty banter and sending unhinged reels during lectures',
            emoji: '😂',
            vibe: 'Meme sync'
          },
          {
            id: 'chill',
            title: 'Chill',
            subtitle: 'Zero drama, comfortable silence, genuinely relaxed energy',
            emoji: '🌿',
            vibe: 'Easygoing'
          },
          {
            id: 'adventurous',
            title: 'Adventurous',
            subtitle: 'Saying yes to spontaneous 5 AM road trips and hackathons',
            emoji: '🚀',
            vibe: 'Adrenaline ally'
          },
          {
            id: 'talkative',
            title: 'Talkative',
            subtitle: 'Never runs out of funny stories and keeps conversation flowing',
            emoji: '🗣️',
            vibe: 'Storyteller'
          },
          {
            id: 'quiet-interesting',
            title: 'Quiet but interesting',
            subtitle: 'Calm on the outside, deeply fascinating once you get to know them',
            emoji: '🔮',
            vibe: 'Deep soul'
          }
        ]
      }
    ],
    vibeDimensions: [
      { key: 'campus', label: 'Campus Vibe', defaultScore: 91, color: '#08A98D' },
      { key: 'social', label: 'Social Energy', defaultScore: 82, color: '#3B82F6' },
      { key: 'hangout', label: 'Hangout Style', defaultScore: 95, color: '#894EFF' },
      { key: 'dayone', label: 'Day-One Match', defaultScore: 98, color: '#FFC928' }
    ]
  },
  {
    id: 'fest',
    category: 'fest',
    title: 'COLLEGE FEST',
    tagline: 'Find your vibe for the fest',
    shortDesc: 'Concert buddies, streetwear sync, pro-nite front row warriors & fest hype squad.',
    emoji: '🎤',
    participantCount: '1.2K joining',
    joinedCountNum: 1210,
    accentColor: '#F02A8A',
    accentBg: '#FFF0F7',
    accentBorder: '#F02A8A',
    themeGradient: 'from-[#F02A8A] via-[#EC4899] to-[#8B5CF6]',
    badge: 'COMING SOON',
    date: 'Nov 18–20 · Annual Cultural Fest',
    location: 'Central Arena & OAT',
    introHeadline: 'Find your pro-nite partner.',
    introSubtitle: 'Connect with someone who shares your music taste and festival stamina.',
    questions: [
      {
        id: 'fest-role',
        numberLabel: 'Question 01',
        title: "What's your fest role?",
        subtitle: 'How do you experience the annual college festival?',
        type: 'cards',
        options: [
          { id: 'front-row', title: 'Front row concert screamer', subtitle: 'Losing my voice for the headlining artist', emoji: '🎸' },
          { id: 'wanderer', title: 'Stall & games explorer', subtitle: 'Trying every snack and competing in informal events', emoji: '🎯' },
          { id: 'chill-vibe', title: 'Lawn acoustic vibe', subtitle: 'Sitting under fairy lights listening to indie sets', emoji: '🌙' },
          { id: 'organizer', title: 'Committee warrior', subtitle: 'Running around with a walkie-talkie looking stressed', emoji: '📻' }
        ]
      },
      {
        id: 'music-taste',
        numberLabel: 'Question 02',
        title: 'Which genre owns your Spotify?',
        subtitle: 'Pick what fuels your weekend playlist.',
        type: 'cards',
        options: [
          { id: 'indie', title: 'Indie & Acoustic Hindi', subtitle: 'Prateek Kuhad, Anuv Jain, Lifafa', emoji: '🎧' },
          { id: 'hiphop', title: 'Desi Hip-Hop & Rap', subtitle: 'DIVINE, Seedhe Maut, KR$NA', emoji: '🎤' },
          { id: 'edm', title: 'EDM & Festival Bass', subtitle: 'High tempo drops and laser lights', emoji: '⚡' },
          { id: 'bollywood', title: 'Bollywood Classics & Pop', subtitle: 'Singing every 2010s anthem word for word', emoji: '💃' }
        ]
      }
    ],
    vibeDimensions: [
      { key: 'fest-energy', label: 'Fest Energy', defaultScore: 94, color: '#F02A8A' },
      { key: 'music-sync', label: 'Music Taste', defaultScore: 89, color: '#894EFF' },
      { key: 'night-stamina', label: 'Pro-Nite Stamina', defaultScore: 92, color: '#FFC928' },
      { key: 'crowd-comfort', label: 'Crowd Vibe', defaultScore: 86, color: '#08A98D' }
    ]
  },
  {
    id: 'social',
    category: 'social',
    title: 'CAMPUS SOCIAL',
    tagline: 'Meet someone new on campus',
    shortDesc: 'Casual coffee runs, late-night campus walks, hostel debriefs & study buddy matches.',
    emoji: '☕',
    participantCount: '563 joining',
    joinedCountNum: 563,
    accentColor: '#FF8811',
    accentBg: '#FFF5EB',
    accentBorder: '#FF8811',
    themeGradient: 'from-[#FF8811] via-[#F59E0B] to-[#EF4444]',
    badge: 'WEEKLY DROP',
    date: 'Every Thursday · 6 PM',
    location: 'Campus Cafe Lawn & Student Plaza',
    introHeadline: 'Meet someone new outside your batch.',
    introSubtitle: 'Connect over casual coffee, shared hobbies, and honest campus banter.',
    questions: [
      {
        id: 'hangout-time',
        numberLabel: 'Question 01',
        title: 'When is your peak hangout window?',
        subtitle: 'When are you actually free on campus?',
        type: 'cards',
        options: [
          { id: 'post-lunch', title: 'Post-lunch break (1:30 PM)', subtitle: 'Quick 30 min chai between heavy labs', emoji: '☀️' },
          { id: 'evening', title: 'Golden hour (5:30 PM)', subtitle: 'Classes done, sitting on lawn as sun sets', emoji: '🌅' },
          { id: 'post-dinner', title: 'Post-dinner walk (9:30 PM)', subtitle: 'Hostel gate gossip and fresh air', emoji: '🌙' },
          { id: 'late-night', title: 'Midnight chai tapri (11:30 PM)', subtitle: 'Deep talks about life, universe and exams', emoji: '🍵' }
        ]
      }
    ],
    vibeDimensions: [
      { key: 'hangout', label: 'Chill Frequency', defaultScore: 88, color: '#FF8811' },
      { key: 'conversation', label: 'Conversation Depth', defaultScore: 93, color: '#894EFF' },
      { key: 'timing', label: 'Schedule Sync', defaultScore: 85, color: '#08A98D' },
      { key: 'overall', label: 'Campus Resonance', defaultScore: 90, color: '#F02A8A' }
    ]
  }
];

// Rich, event-specific match profiles
export const MOCK_EVENT_MATCHES: Record<string, EventMatch[]> = {
  navratri: [
    {
      id: 'match-nav-01',
      eventId: 'navratri',
      name: 'Arjun Mehta',
      nickname: 'Arju',
      age: 21,
      gender: 'Male',
      college: 'DA-IICT Gandhinagar',
      department: 'B.Tech ICT',
      collegeYear: '3rd Year',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      compatibilityScore: 98,
      vibeTitle: 'High-Stamina 3-Taali Partner',
      vibeQuote: 'Will stay till 3 AM. I live in the ground now.',
      sharedHighlights: [
        'Synchronized 3-Taali & Sanedo spins',
        'Both voted: Dance all night & post-Garba chai',
        'Stamina compatibility: 96%'
      ],
      dimensionScores: [
        { label: 'Dance Energy', score: 98 },
        { label: 'Rhythm Sync', score: 95 },
        { label: 'Social Vibe', score: 92 },
        { label: 'Night Stamina', score: 99 }
      ],
      badges: ['Circle Leader', 'Sanedo Beast', 'Night Owl']
    },
    {
      id: 'match-nav-02',
      eventId: 'navratri',
      name: 'Rhea Desai',
      nickname: 'Rhee',
      age: 20,
      gender: 'Female',
      college: 'NIFT Gandhinagar',
      department: 'Fashion Design',
      collegeYear: '2nd Year',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      compatibilityScore: 94,
      vibeTitle: 'Aesthetic Chaniya Choli & Spin Queen',
      vibeQuote: 'Outfit 10/10, spins 200 RPM, always ready for reels.',
      sharedHighlights: [
        'Both love fast dodhiya with style',
        'Shared obsession with 1 AM Maggie stalls',
        'Aesthetic photo-ready vibe'
      ],
      dimensionScores: [
        { label: 'Dance Energy', score: 92 },
        { label: 'Rhythm Sync', score: 94 },
        { label: 'Social Vibe', score: 96 },
        { label: 'Night Stamina', score: 90 }
      ],
      badges: ['Styling Icon', 'Dodhiya Pro', 'Photogenic']
    },
    {
      id: 'match-nav-03',
      eventId: 'navratri',
      name: 'Kabir Varma',
      nickname: 'KV',
      age: 21,
      gender: 'Male',
      college: 'PDPU / PDEU',
      department: 'Mechanical Engg',
      collegeYear: '3rd Year',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      compatibilityScore: 91,
      vibeTitle: 'Chill Groove & Hype Specialist',
      vibeQuote: 'Never lets a partner feel awkward on the dance floor.',
      sharedHighlights: [
        'Patient & great at teaching tricky turns',
        'Both prefer fun over strict choreography',
        'Never leaves before Chogada'
      ],
      dimensionScores: [
        { label: 'Dance Energy', score: 88 },
        { label: 'Rhythm Sync', score: 90 },
        { label: 'Social Vibe', score: 95 },
        { label: 'Night Stamina', score: 92 }
      ],
      badges: ['Great Hype Partner', 'Chill Mood', 'Canteen Regular']
    }
  ],
  freshers: [
    {
      id: 'match-fresh-01',
      eventId: 'freshers',
      name: 'Ananya Joshi',
      nickname: 'Anu',
      age: 19,
      gender: 'Female',
      college: 'Parul University',
      department: 'B.Des Architecture',
      collegeYear: '1st Year',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      compatibilityScore: 97,
      vibeTitle: 'Day-One Exploration Buddy',
      vibeQuote: 'Looking for someone to map the best rooftop study nooks.',
      sharedHighlights: [
        'Both excited about exploring campus secrets',
        'Meme humor & easygoing personality match',
        'First-meet preference: Iced Latte & schedule debrief'
      ],
      dimensionScores: [
        { label: 'Campus Vibe', score: 96 },
        { label: 'Social Energy', score: 92 },
        { label: 'Humor Sync', score: 98 },
        { label: 'Day-One Vibe', score: 99 }
      ],
      badges: ['Campus Explorer', 'Design Mind', 'Coffee Lover']
    },
    {
      id: 'match-fresh-02',
      eventId: 'freshers',
      name: 'Siddharth Shah',
      nickname: 'Sid',
      age: 18,
      gender: 'Male',
      college: 'DA-IICT Gandhinagar',
      department: 'B.Tech MnC',
      collegeYear: '1st Year',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      compatibilityScore: 92,
      vibeTitle: 'Witty Canteen & Hackathon Partner',
      vibeQuote: 'Will make sure we never get lost in the engineering quad.',
      sharedHighlights: [
        'Both love spontaneous food runs near gate 3',
        'Equal balance of ambition and chill weekends',
        'Zero-drama communication style'
      ],
      dimensionScores: [
        { label: 'Campus Vibe', score: 90 },
        { label: 'Social Energy', score: 88 },
        { label: 'Humor Sync', score: 95 },
        { label: 'Day-One Vibe', score: 93 }
      ],
      badges: ['Hackathon Beast', 'Witty Banter', 'Night Canteen']
    }
  ],
  fest: [
    {
      id: 'match-fest-01',
      eventId: 'fest',
      name: 'Zoya Khan',
      nickname: 'Zo',
      age: 20,
      gender: 'Female',
      college: 'Symbiosis Pune',
      department: 'Media & Comm',
      collegeYear: '2nd Year',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      compatibilityScore: 96,
      vibeTitle: 'Pro-Nite Front Row Partner',
      vibeQuote: 'Can scream every word of the headliner set without losing breath.',
      sharedHighlights: [
        'Matching music taste: Indie & Desi Hip-Hop',
        'Both voted: Front row barricade warriors',
        'Fest energy: 95%'
      ],
      dimensionScores: [
        { label: 'Fest Energy', score: 97 },
        { label: 'Music Taste', score: 94 },
        { label: 'Concert Stamina', score: 96 },
        { label: 'Crowd Vibe', score: 92 }
      ],
      badges: ['Concert Goer', 'Front Row', 'Indie Soul']
    }
  ],
  social: [
    {
      id: 'match-soc-01',
      eventId: 'social',
      name: 'Aditya Nair',
      nickname: 'Adi',
      age: 21,
      gender: 'Male',
      college: 'IIT Gandhinagar',
      department: 'Electrical Engg',
      collegeYear: '3rd Year',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      compatibilityScore: 93,
      vibeTitle: 'Golden Hour Campus Conversationalist',
      vibeQuote: 'Prefers honest conversation and good chai over loud crowds.',
      sharedHighlights: [
        'Both free during evening golden hour (5:30 PM)',
        'Love peaceful walks along the campus perimeter',
        'Book, tech & music debriefs'
      ],
      dimensionScores: [
        { label: 'Chill Frequency', score: 95 },
        { label: 'Conversation', score: 96 },
        { label: 'Schedule Sync', score: 90 },
        { label: 'Campus Resonance', score: 92 }
      ],
      badges: ['Golden Hour', 'Deep Listener', 'Chai Connoisseur']
    }
  ]
};
