export function isValidCedula(cedula: string): boolean {
  if (!cedula || cedula.length !== 10 || !/^\d{10}$/.test(cedula)) {
    return false;
  }

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    return false;
  }

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10);
    // Índices pares en base 0 (0, 2, 4, 6, 8) corresponden al 1°, 3°, 5°... dígito
    if (i % 2 === 0) {
      valor = valor * 2;
      if (valor > 9) {
        valor -= 9;
      }
    }
    suma += valor;
  }

  const verificadorCalculado = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  const verificadorReal = parseInt(cedula.charAt(9), 10);

  return verificadorCalculado === verificadorReal;
}
