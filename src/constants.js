// Punti classifica generale (posizione -> punti)
export const PUNTI_CLASSIFICA_GENERALE = {
  1: 100, 2: 95, 3: 90, 4: 86, 5: 82, 6: 79, 7: 77, 8: 75, 9: 70, 10: 67,
  11: 64, 12: 61, 13: 58, 14: 56, 15: 54, 16: 52, 17: 45, 18: 42, 19: 39, 20: 36,
  21: 33, 22: 31, 23: 29, 24: 27,
};

// Punti gara (posizione 1-10)
export const PUNTI_GARA = {
  1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8, 9: 7, 10: 6,
};

export const getPuntiGara = (pos) => PUNTI_GARA[pos] ?? 0;
export const getPuntiClassifica = (pos) => PUNTI_CLASSIFICA_GENERALE[pos] ?? 0;

// Categoria età
export const getCategoriaEta = (eta) => {
  if (eta == null) return '';
  const n = Number(eta);
  if (n <= 34) return 'Junior';
  if (n <= 49) return 'Middle';
  return 'Senior';
};

// Categoria peso (kg)
export const getCategoriaPeso = (peso) => {
  if (peso == null) return '';
  const p = Number(peso);
  if (p <= 79.63) return 'Light';
  if (p <= 92.31) return 'Medium';
  return 'Strong';
};

export const ANNO_MIN = 2026;
