// Odmiana rzeczownika po liczebniku: 1 symulator, 2–4 symulatory (bez 12–14), 5+ symulatorów.
export const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
