// One small gold line drawing per box, so every card shows what it is about before anyone reads it (Thomas 2026-11-12).
// Hand-drawn SVG: no image files, no generation cost, crisp at any size. Decorative only; the card text carries the meaning.
const g = (body) => `<svg class="art" viewBox="0 0 160 96" aria-hidden="true" focusable="false">${body}</svg>`;

const SCENES = {
  // A phone ringing, answered with a message bubble.
  calls: g(`<rect x="62" y="12" width="36" height="70" rx="7"/><rect x="67" y="21" width="26" height="46" rx="2"/><circle class="fill" cx="80" cy="74" r="2.5"/>
    <path d="M106 34 q9 14 0 28"/><path d="M114 27 q15 21 0 42"/>
    <rect x="14" y="22" width="40" height="26" rx="5"/><path d="M24 48 l-5 10 l13 -10"/><path d="M22 31 h24 M22 39 h16"/>`),
  // Call, then text, then email, in a chain.
  followup: g(`<path class="dash" d="M38 48 H122"/>
    <circle cx="28" cy="48" r="17"/><path d="M21 41 c0 9 5 14 14 14 l3 -4 l-5 -3 l-2 2 c-3 -1 -5 -3 -6 -6 l2 -2 l-3 -5 z"/>
    <circle cx="80" cy="48" r="17"/><rect x="70" y="40" width="20" height="13" rx="3"/><path d="M74 53 l-2 5 l7 -5"/>
    <circle class="ring" cx="132" cy="48" r="17"/><rect x="121" y="41" width="22" height="15" rx="2"/><path d="M121 42 l11 8 l11 -8"/>`),
  // A web page with the offer up top and a call button.
  website: g(`<rect x="14" y="10" width="132" height="76" rx="5"/><path d="M14 23 H146"/><circle cx="23" cy="16.5" r="2"/><circle cx="31" cy="16.5" r="2"/><circle cx="39" cy="16.5" r="2"/>
    <path d="M28 36 H96 M28 45 H82"/><rect class="fill" x="28" y="56" width="42" height="13" rx="2"/><rect x="76" y="56" width="34" height="13" rx="2"/>
    <rect x="114" y="32" width="20" height="38" rx="2"/><path d="M118 62 l6 -10 l6 10"/><path d="M98 74 l6 12 l2 -6 l6 -2 z"/>`),
  // A calendar with one slot checked.
  booking: g(`<rect x="34" y="16" width="92" height="70" rx="5"/><path d="M34 32 H126"/><path d="M54 10 V22 M106 10 V22"/>
    <path d="M57 32 V86 M80 32 V86 M103 32 V86 M34 50 H126 M34 68 H126"/>
    <rect class="fill" x="83" y="53" width="17" height="12" rx="1"/><path class="ink" d="M86 59 l4 3 l7 -6"/>`),
  // An invoice drafted from the job, with a total and a check.
  invoice: g(`<path d="M48 8 H100 L114 22 V88 H48 Z"/><path d="M100 8 V22 H114"/>
    <path d="M58 30 H90 M58 40 H104 M58 50 H104 M58 60 H96"/><path d="M58 74 H80"/><path class="thick" d="M88 74 H104"/>
    <circle class="fill" cx="120" cy="78" r="11"/><path class="ink" d="M114 78 l4 4 l8 -8"/>`),
  // A quote on a clipboard with a pencil.
  quote: g(`<rect x="42" y="14" width="64" height="76" rx="4"/><rect x="62" y="8" width="24" height="12" rx="3"/>
    <path d="M52 34 H96 M52 44 H96 M52 54 H84 M52 66 H74"/>
    <path d="M100 74 L128 30 L136 35 L108 79 L99 82 Z"/><path d="M124 36 l8 5"/>`),
  // One customer record: who they are and what they paid.
  customers: g(`<rect x="22" y="16" width="116" height="66" rx="6"/><circle cx="52" cy="40" r="10"/><path d="M34 70 c2 -12 34 -12 36 0"/>
    <path d="M82 34 H124 M82 46 H116 M82 58 H124"/><rect class="fill" x="82" y="66" width="24" height="8" rx="2"/>`),
  // Two documents and a signature.
  documents: g(`<rect x="30" y="18" width="58" height="70" rx="3"/><rect x="46" y="8" width="58" height="70" rx="3" class="back"/>
    <path d="M56 22 H94 M56 32 H94 M56 42 H86"/><path d="M40 62 c6 -10 10 6 15 -2 s8 -6 10 2 s8 0 12 -4"/><path d="M40 72 H78"/>
    <path d="M112 70 L134 30 L141 34 L119 74 L111 77 Z"/>`),
  // Three crew phones feeding one job.
  crew: g(`<rect x="14" y="20" width="28" height="50" rx="5"/><rect x="66" y="12" width="28" height="50" rx="5"/><rect x="118" y="20" width="28" height="50" rx="5"/>
    <path d="M20 32 l3 3 l5 -5 M20 44 l3 3 l5 -5 M72 24 l3 3 l5 -5 M72 36 l3 3 l5 -5 M124 32 l3 3 l5 -5"/>
    <path class="dash" d="M28 70 V84 H132 V70 M80 62 V84"/><circle class="fill" cx="80" cy="86" r="5"/>`),
  // The numbers on one screen.
  dashboard: g(`<rect x="14" y="10" width="132" height="70" rx="5"/><path d="M62 88 H98 M80 80 V88"/>
    <rect class="fill" x="26" y="50" width="10" height="20"/><rect class="fill" x="40" y="38" width="10" height="32"/><rect class="fill" x="54" y="28" width="10" height="42"/>
    <path d="M78 62 L94 46 L106 54 L132 26"/><circle cx="132" cy="26" r="3"/><path d="M78 70 H134"/>`),
  // Adjustable: sliders set to different positions.
  adjustable: g(`<path d="M24 26 H136 M24 48 H136 M24 70 H136"/>
    <circle class="fill" cx="58" cy="26" r="8"/><circle class="fill" cx="112" cy="48" r="8"/><circle class="fill" cx="80" cy="70" r="8"/>`),
  // Fixable: an alert comes in, and a wrench fixes it.
  fixable: g(`<path d="M30 66 c4 -4 4 -10 4 -20 c0 -12 8 -20 18 -20 s18 8 18 20 c0 10 0 16 4 20 Z"/><path d="M46 72 a6 6 0 0 0 12 0"/><circle class="fill" cx="70" cy="28" r="6"/>
    <g transform="rotate(40 116 52)"><path d="M122 14.5 A13 13 0 1 1 110 14.5 V24 H122 Z"/><rect x="111" y="38" width="10" height="46" rx="5"/></g>`),
  // Flexible: one line bends through the tools you already use.
  flexible: g(`<rect x="14" y="54" width="26" height="26" rx="4"/><rect x="67" y="14" width="26" height="26" rx="4"/><rect x="120" y="54" width="26" height="26" rx="4"/>
    <path class="thick" d="M27 54 C27 30, 54 27, 67 27 M93 27 C110 27, 133 30, 133 54"/><circle class="fill" cx="27" cy="67" r="4"/><circle class="fill" cx="80" cy="27" r="4"/><circle class="fill" cx="133" cy="67" r="4"/>`),
  // Customizable: cut to your measurements.
  customizable: g(`<path d="M80 8 L104 22 V50 L80 64 L56 50 V22 Z"/><path d="M80 8 V36 L104 22 M80 36 L56 22 M80 36 V64"/><path class="fill" d="M80 36 L104 50 L80 64 Z"/>
    <rect x="22" y="74" width="116" height="14" rx="2"/><path d="M34 74 v6 M46 74 v4 M58 74 v6 M70 74 v4 M82 74 v6 M94 74 v4 M106 74 v6 M118 74 v4 M130 74 v6"/>`),
  // A construction job site: a house, with each crew feeding the same job.
  jobsite: g(`<path d="M30 46 L64 20 L98 46 V84 H30 Z"/><path d="M54 84 V62 H74 V84"/><path d="M40 52 h10 v8 h-10 z"/>
    <path d="M110 84 V30 H140 M110 42 H130 M128 30 v16"/><circle class="fill" cx="128" cy="52" r="4"/><path d="M20 84 H148"/>`),
  // A mobile mechanic: a car with an invoice on a phone.
  mechanic: g(`<path d="M18 62 L30 40 H86 L102 62 Z"/><path d="M14 62 H108 V74 H14 Z"/><circle class="fill" cx="36" cy="76" r="8"/><circle class="fill" cx="88" cy="76" r="8"/>
    <rect x="118" y="18" width="28" height="56" rx="5"/><path d="M124 30 H140 M124 38 H140 M124 46 H134"/><rect class="fill" x="124" y="56" width="16" height="7" rx="1"/>`),
};

const SYSTEM_ART = {
  'ai-receptionist': 'calls',
  'speed-to-lead': 'followup',
  websites: 'website',
  booking: 'booking',
  'job-to-invoice': 'invoice',
  documents: 'documents',
  'team-apps': 'crew',
  'ai-operations': 'dashboard',
};

const COVER_ART = {
  invoices: 'invoice',
  quotes: 'quote',
  customers: 'customers',
  calls: 'calls',
  schedule: 'booking',
  crew: 'crew',
  numbers: 'dashboard',
};

export const ART_IDS = Object.keys(SCENES);

export function art(id) {
  const scene = SCENES[id];
  if (!scene) throw new Error(`No art named ${id}`);
  return `<div class="art-panel" data-art="${id}">${scene}</div>`;
}

export const systemArt = (systemId) => art(SYSTEM_ART[systemId]);
export const coverArt = (coverId) => art(COVER_ART[coverId]);
export const pillarArt = (title) => art(String(title).toLowerCase());
