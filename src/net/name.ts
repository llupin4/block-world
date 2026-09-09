// Display names (ADR 0019 follow-up): a typed name or a random "<Color>4402"-style one. The name
// travels in the ?host/?join URL `name` param and over the existing wire fields (the client's
// `hello` name; the host's own entity name via `state`/`welcome`) — no protocol change.
export const NAME_COLORS = [
  'Blue', 'Red', 'Green', 'Orange', 'Purple', 'Indigo', 'Gold', 'Crimson', 'Amber', 'Coral',
  'Teal', 'Mint', 'Slate', 'Ivory', 'Ruby', 'Lime', 'Aqua', 'Scarlet', 'Sapphire', 'Topaz',
];

export function randomName(): string {
  const word = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)]!;
  return word + String(1000 + Math.floor(Math.random() * 9000));
}

// Trim, collapse internal whitespace, hard-cap at 16 (the name-tag texture slices at 14, so 16 is
// safe); an empty result becomes a random name (the host/join always gets a name).
export function sanitizeName(input: string): string {
  const t = input.trim().replace(/\s+/g, ' ').slice(0, 16).trim();
  return t === '' ? randomName() : t;
}