// Local mock data source for the Discover tab, replacing the Gemini-backed
// getDiscoveryFeed (deleted along with services/geminiService.ts — Ticket 0.1, Fix 3).
//
// Shape is pinned to the Activities master schema, not to the DiscoveryItem type this
// mock feeds into — DiscoveryFeed.tsx maps between the two at the component boundary.
// Fields are placeholders where noted; do not fill in the deliberate omissions below.

export interface Activity {
  name: string;
  description: string;
  cost: 'Free' | '$' | '$$' | '$$$';
  source: 'manual_diy';
  tags: string[];
  pictures: string[];
  is_location_based: boolean;
  click_count: number;
  likes: number;
  // A JS Date, not a Firestore Timestamp — @react-native-firebase isn't installed yet,
  // so there's no Timestamp type to import. The Firestore SDK converts a Date to a
  // Timestamp at write time; Project 11 is what actually writes these to Firestore.
  created_at: Date;
}

// Deliberately omitted on every row, do not add:
// - location / geohash: nothing in the app captures a user's location yet (D4), so a
//   mock claiming to be location-based would point at a distance calculation with
//   nothing to compare against. Hence is_location_based is always false.
// - category: open question, Master Schema Q4. Its absence here isn't a ruling against it.
// - creator_id: the schema puts this on source === "user_generated" rows only; these
//   rows are seeded, not user-generated.

export const MOCK_ACTIVITIES: (Activity & { id: string })[] = [
  {
    id: 'mock-1',
    name: 'Sunset Picnic at Dolores Park',
    description: 'Grab a blanket and watch the sunset over the city skyline with a spread of snacks.',
    cost: 'Free',
    source: 'manual_diy',
    tags: ['outdoors', 'chill', 'placeholder'],
    pictures: ['https://picsum.photos/seed/mock-1/600/800'],
    is_location_based: false,
    click_count: 0,
    likes: 0,
    created_at: new Date(),
  },
  {
    id: 'mock-2',
    name: 'Board Game Night',
    description: 'A cozy night in with a rotating stack of party and strategy games.',
    cost: '$',
    source: 'manual_diy',
    tags: ['indoors', 'games', 'placeholder'],
    pictures: ['https://picsum.photos/seed/mock-2/600/800'],
    is_location_based: false,
    click_count: 0,
    likes: 0,
    created_at: new Date(),
  },
  {
    id: 'mock-3',
    name: 'Farmers Market Brunch Crawl',
    description: 'Sample coffee, pastries, and produce from stall to stall on a Saturday morning.',
    cost: '$$',
    source: 'manual_diy',
    tags: ['food', 'morning', 'placeholder'],
    pictures: ['https://picsum.photos/seed/mock-3/600/800'],
    is_location_based: false,
    click_count: 0,
    likes: 0,
    created_at: new Date(),
  },
  {
    id: 'mock-4',
    name: 'Rooftop Trivia',
    description: 'Weekly trivia with a view — teams of four, prizes for first and last place.',
    cost: '$$',
    source: 'manual_diy',
    tags: ['nightlife', 'games', 'placeholder'],
    pictures: ['https://picsum.photos/seed/mock-4/600/800'],
    is_location_based: false,
    click_count: 0,
    likes: 0,
    created_at: new Date(),
  },
  {
    id: 'mock-5',
    name: 'Tasting Menu Night Out',
    description: 'A multi-course tasting menu for a special-occasion group dinner.',
    cost: '$$$',
    source: 'manual_diy',
    tags: ['food', 'dinner', 'placeholder'],
    pictures: ['https://picsum.photos/seed/mock-5/600/800'],
    is_location_based: false,
    click_count: 0,
    likes: 0,
    created_at: new Date(),
  },
];
