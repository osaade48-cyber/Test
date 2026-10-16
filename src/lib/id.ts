export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function sixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
