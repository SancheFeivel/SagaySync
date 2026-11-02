import { Platform } from 'react-native';

// Palette taken from the SagaySync web app (sagay-sync-hub.base44.app) design tokens.
export const C = {
  navy: '#182543',
  navy2: '#2A3B66',
  yellow: '#F5A214',
  bg: '#F3F5FA',
  card: '#FFFFFF',
  text: '#11192C',
  muted: '#61697E',
  border: '#E1E5EE',
  soft: '#E9EDF6',
  danger: '#D92D20',
  dangerSoft: '#FEE4E2',
  warnSoft: '#FEF1D6',
  ok: '#12B76A',
  okSoft: '#D1FADF',
  okText: '#027A48',
  grayText: '#475467',
  divider: '#CBD2E1',
};

/** Radius scale. A nested radius is the parent radius minus its padding. */
export const R = { sm: 8, md: 14, lg: 20, xl: 24, pill: 999 } as const;
export const RADIUS = R.lg;

/** Spacing scale (4-based). Gaps under 4px are optical tweaks and exempt. */
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** Type scale. Weights: 600 and 700 only; 800 is for tags and badges. */
export const TYPE = { caption: 12, small: 14, body: 16, title: 18, h3: 22, h2: 26, h1: 30 } as const;

/** Icon sizes: inline, rows and fields, navigation. Illustrations and the FAB glyph are exceptions. */
export const ICON = { sm: 16, md: 20, lg: 24 } as const;

/** Soft lift so white cards stand off the page background. */
export const SHADOW = {
  shadowColor: '#182543',
  shadowOpacity: 0.09,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
  elevation: 3,
};

/** The one card surface: white, hairline border, soft shadow. Every card in the app spreads this. */
export const CARD = {
  backgroundColor: C.card,
  borderRadius: RADIUS,
  borderWidth: 1,
  borderColor: C.border,
  ...SHADOW,
};

/** Touch feedback for buttons and cards. Use as: style={({ pressed }) => [base, pressed && PRESSED]} */
export const PRESSED = { opacity: 0.85, transform: [{ scale: 0.98 }] };

/** Touch feedback for full-width list rows, where scaling would look wrong. */
export const PRESSED_ROW = { backgroundColor: C.soft };

export const MIN_TAP = 44;

/** Widest a screen's content gets, so tablets show a centered phone-width column. */
export const CONTENT_MAX = 640;

/** Side padding every screen uses, so content lines up from tab to tab. */
export const PAD = SP.xl;

/** Shared look for text inputs and tappable fields (date pickers, search box, pickers). */
export const FIELD = {
  minHeight: 48,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: R.md,
  backgroundColor: '#fff',
};

/** Label above a form field or option group. */
export const LABEL = { fontWeight: '700' as const, color: C.text, marginBottom: SP.sm };

// The web app uses Fraunces for headings. Until that font is installed, fall back to the system serif.
export const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) as string;

/** Small tracked uppercase label used above sections ("ANNOUNCEMENTS", "UPCOMING EVENTS"). */
export const EYEBROW = {
  fontSize: TYPE.caption,
  fontWeight: '600' as const,
  letterSpacing: 1.9,
  textTransform: 'uppercase' as const,
  color: 'rgba(17,25,44,0.75)',
};
