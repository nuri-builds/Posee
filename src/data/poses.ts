/** A bundled asset (require) or a remote/local URI. */
export type ImageRef = number | { uri: string };

export type GroupSize = 'solo' | 'couple' | 'friends' | 'family';

export type Occasion = {
  id: string;
  label: string;
  emoji: string;
};

export type Pose = {
  id: string;
  title: string;
  occasion: string;
  group: GroupSize;
  /** Free-text search tags. Outfit, mood, setting, and occasion words go here. */
  tags: string[];
  /** One-line coaching tip shown on the camera screen. Written gender-neutrally. */
  tip: string;
  premium: boolean;
  image: ImageRef;
};

export const OCCASIONS: Occasion[] = [
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'mehendi', label: 'Mehendi & Haldi', emoji: '🌼' },
  { id: 'sangeet', label: 'Sangeet', emoji: '💃' },
  { id: 'diwali', label: 'Diwali', emoji: '🪔' },
  { id: 'holi', label: 'Holi', emoji: '🎨' },
  { id: 'navratri', label: 'Navratri', emoji: '🥁' },
  { id: 'eid', label: 'Eid', emoji: '🌙' },
  { id: 'solo-travel', label: 'Solo travel', emoji: '🎒' },
  { id: 'group-trip', label: 'Group trip', emoji: '🚐' },
  { id: 'everyday', label: 'Everyday', emoji: '📸' },
];

export const GROUPS: { id: GroupSize; label: string }[] = [
  { id: 'solo', label: 'Solo' },
  { id: 'couple', label: 'Couple' },
  { id: 'friends', label: 'Friends' },
  { id: 'family', label: 'Family' },
];

/*
 * PLACEHOLDER IMAGES: these outline silhouettes let the ghost overlay work
 * offline on day one. Replace each `image` with a photo you own or have
 * licensed, either bundled with require() or served from your CDN as
 * { uri: 'https://…' }. Reference images are downloaded only. User photos are
 * never uploaded.
 */
const IMG = {
  soloStanding: require('../../assets/poses/solo-standing.png'),
  soloCelebrate: require('../../assets/poses/solo-celebrate.png'),
  couple: require('../../assets/poses/couple.png'),
  group: require('../../assets/poses/group.png'),
  family: require('../../assets/poses/family.png'),
};

export const POSES: Pose[] = [
  // Wedding
  { id: 'wed-twirl', title: 'Outfit twirl reveal', occasion: 'wedding', group: 'solo', tags: ['lehenga', 'anarkali', 'flare', 'bride', 'twirl', 'reception'], tip: 'Spin slowly and shoot mid-turn so the outfit flares.', premium: false, image: IMG.soloCelebrate },
  { id: 'wed-sherwani', title: 'Classic standing portrait', occasion: 'wedding', group: 'solo', tags: ['sherwani', 'bandhgala', 'groom', 'achkan', 'safa', 'portrait', 'reception'], tip: 'Put your weight on your back foot and keep one hand relaxed.', premium: false, image: IMG.soloStanding },
  { id: 'wed-couple-varmala', title: 'Varmala face-to-face', occasion: 'wedding', group: 'couple', tags: ['jaimala', 'garland', 'bride', 'groom', 'pheras', 'mandap'], tip: 'Angle your bodies toward each other at 45°.', premium: true, image: IMG.couple },
  { id: 'wed-prewedding', title: 'Pre-wedding walk', occasion: 'wedding', group: 'couple', tags: ['pre-wedding', 'prewedding', 'engagement', 'roka', 'walk', 'candid'], tip: 'Walk toward the camera and look at each other, not the lens.', premium: true, image: IMG.couple },
  { id: 'wed-baraat-squad', title: 'Baraat squad', occasion: 'wedding', group: 'friends', tags: ['baraat', 'dance', 'cousins', 'squad', 'bridesmaids', 'groomsmen'], tip: 'Stagger heights and have everyone lean toward the centre.', premium: false, image: IMG.group },
  { id: 'wed-family', title: 'Family portrait', occasion: 'wedding', group: 'family', tags: ['parents', 'grandparents', 'formal', 'reception', 'traditional'], tip: 'Seat the elders in the centre and frame from the waist up.', premium: true, image: IMG.family },

  // Mehendi / Haldi / Sangeet
  { id: 'meh-hands', title: 'Mehendi hands showcase', occasion: 'mehendi', group: 'solo', tags: ['henna', 'hands', 'closeup', 'detail', 'yellow'], tip: 'Hold your hands at chin height with your palms facing the camera.', premium: false, image: IMG.soloStanding },
  { id: 'haldi-splash', title: 'Haldi laugh candid', occasion: 'mehendi', group: 'friends', tags: ['haldi', 'turmeric', 'candid', 'laugh', 'yellow', 'pithi'], tip: 'Use burst mode and keep shooting while everyone laughs.', premium: true, image: IMG.group },
  { id: 'sangeet-dance', title: 'Mid-step dance', occasion: 'sangeet', group: 'couple', tags: ['dance', 'performance', 'cocktail', 'lehenga', 'kurta', 'stage'], tip: 'Freeze at the peak of a step with your arms open.', premium: true, image: IMG.couple },

  // Festivals
  { id: 'diwali-diya', title: 'Diya glow portrait', occasion: 'diwali', group: 'solo', tags: ['diya', 'lamp', 'rangoli', 'lights', 'saree', 'kurta', 'festive', 'night'], tip: 'Hold the diya at chest height so it lights your face.', premium: false, image: IMG.soloStanding },
  { id: 'diwali-family', title: 'Rangoli family circle', occasion: 'diwali', group: 'family', tags: ['rangoli', 'pooja', 'puja', 'lakshmi', 'festive', 'home'], tip: 'Kneel around the rangoli and shoot from a slightly higher angle.', premium: false, image: IMG.family },
  { id: 'holi-colours', title: 'Colour throw', occasion: 'holi', group: 'friends', tags: ['gulal', 'colours', 'colors', 'splash', 'white', 'rang'], tip: 'Throw on "3" and shoot a burst. Protect the lens with a clear cover.', premium: false, image: IMG.group },
  { id: 'holi-solo', title: 'Arms-up colour burst', occasion: 'holi', group: 'solo', tags: ['gulal', 'rang', 'celebrate', 'jump'], tip: 'Throw powder straight up, then look up into it.', premium: true, image: IMG.soloCelebrate },
  { id: 'garba-twirl', title: 'Garba twirl', occasion: 'navratri', group: 'solo', tags: ['garba', 'dandiya', 'chaniya choli', 'kediyu', 'twirl', 'durga puja'], tip: 'Hold the sticks crossed above your head mid-spin.', premium: true, image: IMG.soloCelebrate },
  { id: 'eid-family', title: 'Eid family lineup', occasion: 'eid', group: 'family', tags: ['eid', 'ramadan', 'ramzan', 'sharara', 'kurta', 'pathani', 'festive'], tip: 'Arrange everyone from tallest to shortest in a soft V.', premium: false, image: IMG.family },

  // Travel
  { id: 'solo-back-view', title: 'Back-to-camera view', occasion: 'solo-travel', group: 'solo', tags: ['mountains', 'beach', 'backpacking', 'hills', 'ladakh', 'goa', 'scenic', 'wanderlust'], tip: 'Stand on the left third and let the view fill the rest of the frame.', premium: false, image: IMG.soloStanding },
  { id: 'solo-tripod-jump', title: 'Timer jump shot', occasion: 'solo-travel', group: 'solo', tags: ['jump', 'beach', 'tripod', 'self timer', 'fun'], tip: 'Use the 10s timer. Jump on "2" so you peak at "0".', premium: true, image: IMG.soloCelebrate },
  { id: 'trip-squad-walk', title: 'Squad walk-in', occasion: 'group-trip', group: 'friends', tags: ['friends', 'road trip', 'goa', 'gang', 'college', 'walk', 'reunion'], tip: 'Walk in step and look at each other, not the lens.', premium: false, image: IMG.group },
  { id: 'trip-family-landmark', title: 'Landmark family frame', occasion: 'group-trip', group: 'family', tags: ['vacation', 'monument', 'taj mahal', 'temple', 'holiday', 'family trip'], tip: 'Keep the landmark in the top third and frame everyone below it.', premium: true, image: IMG.family },

  // Everyday
  { id: 'every-candid', title: 'Candid look-away', occasion: 'everyday', group: 'solo', tags: ['casual', 'cafe', 'ootd', 'outfit', 'instagram', 'birthday'], tip: 'Look off-frame and hold a natural half-smile.', premium: false, image: IMG.soloStanding },
];
