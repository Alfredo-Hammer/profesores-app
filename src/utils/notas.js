// utils/notas.js
export function convertirNotaACualitativa(nota) {
  if (nota >= 90 && nota <= 100) return "AA";
  if (nota >= 76 && nota <= 89) return "AS";
  if (nota >= 60 && nota <= 75) return "AF";
  if (nota >= 40 && nota <= 59) return "AI";
  return "N/A";
}
