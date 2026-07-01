import { describe, it, expect } from 'vitest';
import { isValidCedula } from './cedulaValidator';

describe('isValidCedula', () => {
  it('debe retornar true para una cédula válida real (1710034065)', () => {
    expect(isValidCedula('1710034065')).toBe(true);
  });

  it('debe retornar false para una cédula con longitud incorrecta', () => {
    expect(isValidCedula('171003406')).toBe(false);
    expect(isValidCedula('17100340651')).toBe(false);
  });

  it('debe retornar false para una cédula que contenga letras', () => {
    expect(isValidCedula('17A0034065')).toBe(false);
  });

  it('debe retornar false para una cédula con código de provincia inválido', () => {
    // 99 no es provincia válida
    expect(isValidCedula('9910034065')).toBe(false);
  });

  it('debe retornar false para una cédula con dígito verificador incorrecto', () => {
    // 1710034065 es válida, si cambiamos el último a 4 debe fallar
    expect(isValidCedula('1710034064')).toBe(false);
  });
});
