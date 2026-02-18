import { describe, it, expect } from 'vitest'

// Stesse regex usate in CompanySetup.vue
// Omocodia: l'AdE sostituisce cifre con lettere (0→L,1→M,2→N,3→P,4→Q,5→R,6→S,7→T,8→U,9→V)
// nelle posizioni 6,7,9,10,12,13,14 del CF
const oD = '[0-9LMNPQRSTUV]' // cifra o lettera omocodica
// Posizione 11 (codice catastale): normalmente lettera, ma in sandbox può essere cifra
const cfBody = `[A-Z]{6}${oD}{2}[A-Z]${oD}{2}[A-Z0-9]${oD}{3}[A-Z]`

const patterns = {
  codiceFiscale: new RegExp(`^${cfBody}$`),
  partitaIva: /^\d{11}$/,
  fiscalId: new RegExp(`^(${cfBody}|\\d{11})$`),
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  cap: /^\d{5}$/,
  provincia: /^[A-Z]{2}$/,
  sdiCode: /^[A-Z0-9]{7}$/,
  pinAdE: /^\d{8}$/,
}

// =============================================
// LOGIN: Codice Fiscale / P.IVA (fiscalId)
// =============================================
describe('Login - Codice Fiscale / P.IVA', () => {
  // --- VALIDI ---
  it('accetta CF persona fisica corretto', () => {
    expect(patterns.fiscalId.test('RSSMRA80A01H501U')).toBe(true)
  })

  it('accetta CF con lettere mese diverse (B, C, D, E, H, L, M, P, R, S, T)', () => {
    expect(patterns.fiscalId.test('RSSMRA80B01H501U')).toBe(true)
    expect(patterns.fiscalId.test('RSSMRA80H01H501U')).toBe(true)
    expect(patterns.fiscalId.test('RSSMRA80T01H501U')).toBe(true)
  })

  it('accetta P.IVA 11 cifre', () => {
    expect(patterns.fiscalId.test('12345678901')).toBe(true)
  })

  it('accetta P.IVA che inizia con 0', () => {
    expect(patterns.fiscalId.test('01234567890')).toBe(true)
  })

  it('accetta CF sandbox test (99988877766) come P.IVA', () => {
    expect(patterns.fiscalId.test('99988877766')).toBe(true)
  })

  it('accetta CF omocodico sandbox (RSSMRA67B8N5458J)', () => {
    // N in posizione 10 = omocodia per cifra 2
    // 8 in posizione 9 = cifra normale
    expect(patterns.fiscalId.test('RSSMRA67B8N5458J')).toBe(true)
  })

  // --- OMOCODIA ---
  it('accetta CF con omocodia su una posizione (anno: L=0)', () => {
    // Posizione 6: L invece di 0 → anno L0 = 00
    expect(patterns.fiscalId.test('RSSMRAL0A01H501U')).toBe(true)
  })

  it('accetta CF con omocodia su più posizioni', () => {
    // Posizioni 6,7 entrambe omocodiche: TL = 70
    expect(patterns.fiscalId.test('RSSMRATLA01H501U')).toBe(true)
  })

  it('accetta CF con omocodia completa (tutte le posizioni sostituibili)', () => {
    // Tutte le 7 posizioni omocodiche (6,7,9,10,12,13,14) con lettere
    expect(patterns.fiscalId.test('RSSMRATLALMARRLU')).toBe(true)
  })

  // --- NON VALIDI ---
  it('rifiuta stringa vuota', () => {
    expect(patterns.fiscalId.test('')).toBe(false)
  })

  it('rifiuta P.IVA con meno di 11 cifre', () => {
    expect(patterns.fiscalId.test('1234567890')).toBe(false)
  })

  it('rifiuta P.IVA con più di 11 cifre', () => {
    expect(patterns.fiscalId.test('123456789012')).toBe(false)
  })

  it('rifiuta P.IVA con lettere', () => {
    expect(patterns.fiscalId.test('1234567890A')).toBe(false)
  })

  it('rifiuta CF con meno di 16 caratteri', () => {
    expect(patterns.fiscalId.test('RSSMRA80A01H501')).toBe(false)
  })

  it('rifiuta CF con più di 16 caratteri', () => {
    expect(patterns.fiscalId.test('RSSMRA80A01H501UX')).toBe(false)
  })

  it('rifiuta CF con cifre dove servono lettere (prime 6 posizioni)', () => {
    expect(patterns.fiscalId.test('123MRA80A01H501U')).toBe(false)
  })

  it('rifiuta CF con lettera non omocodica in posizione cifra (es. W, X, Y, Z)', () => {
    // W non è una lettera omocodica valida
    expect(patterns.fiscalId.test('RSSMRAW0A01H501U')).toBe(false)
    expect(patterns.fiscalId.test('RSSMRAX0A01H501U')).toBe(false)
  })

  it('rifiuta CF in minuscolo (il form fa toUpperCase ma la regex vuole maiuscolo)', () => {
    expect(patterns.fiscalId.test('rssmra80a01h501u')).toBe(false)
  })

  it('rifiuta stringhe casuali', () => {
    expect(patterns.fiscalId.test('abc')).toBe(false)
    expect(patterns.fiscalId.test('test@email.it')).toBe(false)
    expect(patterns.fiscalId.test('---')).toBe(false)
  })
})

// =============================================
// SIGNUP: Codice Fiscale (solo CF 16 chars)
// =============================================
describe('Signup - Codice Fiscale (codiceFiscale)', () => {
  it('accetta CF persona fisica standard', () => {
    expect(patterns.codiceFiscale.test('RSSMRA80A01H501U')).toBe(true)
  })

  it('accetta CF con diverse lettere mese', () => {
    expect(patterns.codiceFiscale.test('BNCLGU92M15F205Z')).toBe(true)
  })

  it('accetta CF omocodico (RSSMRA67B8N5458J)', () => {
    expect(patterns.codiceFiscale.test('RSSMRA67B8N5458J')).toBe(true)
  })

  it('accetta CF con omocodia su tutte le posizioni', () => {
    expect(patterns.codiceFiscale.test('RSSMRATLALMARRLU')).toBe(true)
  })

  it('rifiuta CF con lettera non omocodica in posizione cifra', () => {
    expect(patterns.codiceFiscale.test('RSSMRAW0A01H501U')).toBe(false)
  })

  it('rifiuta P.IVA 11 cifre (non è un CF)', () => {
    expect(patterns.codiceFiscale.test('12345678901')).toBe(false)
  })

  it('rifiuta CF troppo corto', () => {
    expect(patterns.codiceFiscale.test('RSSMRA80A01H50')).toBe(false)
  })

  it('rifiuta CF con spazi', () => {
    expect(patterns.codiceFiscale.test('RSSMRA80 01H501U')).toBe(false)
  })
})

// =============================================
// SIGNUP: Partita IVA
// =============================================
describe('Signup - Partita IVA', () => {
  it('accetta P.IVA 11 cifre standard', () => {
    expect(patterns.partitaIva.test('12345678901')).toBe(true)
  })

  it('accetta P.IVA che inizia con 0', () => {
    expect(patterns.partitaIva.test('00000000000')).toBe(true)
  })

  it('rifiuta P.IVA con 10 cifre', () => {
    expect(patterns.partitaIva.test('1234567890')).toBe(false)
  })

  it('rifiuta P.IVA con 12 cifre', () => {
    expect(patterns.partitaIva.test('123456789012')).toBe(false)
  })

  it('rifiuta P.IVA con lettere', () => {
    expect(patterns.partitaIva.test('1234567890A')).toBe(false)
  })

  it('rifiuta P.IVA con trattini', () => {
    expect(patterns.partitaIva.test('123-456-789')).toBe(false)
  })

  it('rifiuta P.IVA con spazi', () => {
    expect(patterns.partitaIva.test('123 456 789')).toBe(false)
  })

  it('rifiuta stringa vuota', () => {
    expect(patterns.partitaIva.test('')).toBe(false)
  })
})

// =============================================
// SIGNUP: Email
// =============================================
describe('Signup - Email', () => {
  it('accetta email standard', () => {
    expect(patterns.email.test('info@azienda.it')).toBe(true)
  })

  it('accetta email con sottodominio', () => {
    expect(patterns.email.test('info@mail.azienda.it')).toBe(true)
  })

  it('accetta email con punti nel nome', () => {
    expect(patterns.email.test('mario.rossi@azienda.it')).toBe(true)
  })

  it('accetta email con + nel nome', () => {
    expect(patterns.email.test('mario+test@azienda.it')).toBe(true)
  })

  it('accetta email con dominio .com', () => {
    expect(patterns.email.test('test@gmail.com')).toBe(true)
  })

  it('rifiuta email senza @', () => {
    expect(patterns.email.test('infoazienda.it')).toBe(false)
  })

  it('rifiuta email senza dominio', () => {
    expect(patterns.email.test('info@')).toBe(false)
  })

  it('rifiuta email senza estensione', () => {
    expect(patterns.email.test('info@azienda')).toBe(false)
  })

  it('rifiuta email con estensione 1 lettera', () => {
    expect(patterns.email.test('info@azienda.i')).toBe(false)
  })

  it('rifiuta email con spazi', () => {
    expect(patterns.email.test('info @azienda.it')).toBe(false)
  })

  it('rifiuta stringa vuota', () => {
    expect(patterns.email.test('')).toBe(false)
  })
})

// =============================================
// SIGNUP: PEC (stessa regex email)
// =============================================
describe('Signup - PEC', () => {
  it('accetta PEC standard', () => {
    expect(patterns.email.test('azienda@pec.it')).toBe(true)
  })

  it('accetta PEC con sottodominio', () => {
    expect(patterns.email.test('fatture@pec.azienda.it')).toBe(true)
  })

  it('rifiuta PEC senza @', () => {
    expect(patterns.email.test('aziendapec.it')).toBe(false)
  })
})

// =============================================
// SIGNUP: PIN Dispositivo AdE
// =============================================
describe('Signup - PIN Dispositivo AdE', () => {
  it('accetta PIN di 8 cifre', () => {
    expect(patterns.pinAdE.test('12345678')).toBe(true)
  })

  it('accetta PIN di 8 zeri', () => {
    expect(patterns.pinAdE.test('00000000')).toBe(true)
  })

  it('rifiuta PIN con 7 cifre', () => {
    expect(patterns.pinAdE.test('1234567')).toBe(false)
  })

  it('rifiuta PIN con 9 cifre', () => {
    expect(patterns.pinAdE.test('123456789')).toBe(false)
  })

  it('rifiuta PIN con lettere', () => {
    expect(patterns.pinAdE.test('1234567A')).toBe(false)
  })

  it('rifiuta PIN con caratteri speciali', () => {
    expect(patterns.pinAdE.test('1234-678')).toBe(false)
  })

  it('rifiuta stringa vuota', () => {
    expect(patterns.pinAdE.test('')).toBe(false)
  })
})

// =============================================
// SIGNUP: CAP (opzionale)
// =============================================
describe('Signup - CAP', () => {
  it('accetta CAP romano (00100)', () => {
    expect(patterns.cap.test('00100')).toBe(true)
  })

  it('accetta CAP milanese (20100)', () => {
    expect(patterns.cap.test('20100')).toBe(true)
  })

  it('accetta CAP napoletano (80100)', () => {
    expect(patterns.cap.test('80100')).toBe(true)
  })

  it('rifiuta CAP con 4 cifre', () => {
    expect(patterns.cap.test('0010')).toBe(false)
  })

  it('rifiuta CAP con 6 cifre', () => {
    expect(patterns.cap.test('001001')).toBe(false)
  })

  it('rifiuta CAP con lettere', () => {
    expect(patterns.cap.test('0010A')).toBe(false)
  })

  it('rifiuta stringa vuota', () => {
    expect(patterns.cap.test('')).toBe(false)
  })
})

// =============================================
// SIGNUP: Provincia (opzionale)
// =============================================
describe('Signup - Provincia', () => {
  it('accetta RM (Roma)', () => {
    expect(patterns.provincia.test('RM')).toBe(true)
  })

  it('accetta MI (Milano)', () => {
    expect(patterns.provincia.test('MI')).toBe(true)
  })

  it('accetta NA (Napoli)', () => {
    expect(patterns.provincia.test('NA')).toBe(true)
  })

  it('accetta TO (Torino)', () => {
    expect(patterns.provincia.test('TO')).toBe(true)
  })

  it('rifiuta provincia minuscola (il form fa toUpperCase)', () => {
    expect(patterns.provincia.test('rm')).toBe(false)
  })

  it('rifiuta provincia con 1 lettera', () => {
    expect(patterns.provincia.test('R')).toBe(false)
  })

  it('rifiuta provincia con 3 lettere', () => {
    expect(patterns.provincia.test('RMA')).toBe(false)
  })

  it('rifiuta provincia con numeri', () => {
    expect(patterns.provincia.test('R1')).toBe(false)
  })

  it('rifiuta stringa vuota', () => {
    expect(patterns.provincia.test('')).toBe(false)
  })
})

// =============================================
// SIGNUP: Codice SDI (opzionale)
// =============================================
describe('Signup - Codice SDI', () => {
  it('accetta SDI 7 lettere maiuscole', () => {
    expect(patterns.sdiCode.test('ABCDEFG')).toBe(true)
  })

  it('accetta SDI 7 cifre', () => {
    expect(patterns.sdiCode.test('1234567')).toBe(true)
  })

  it('accetta SDI misto lettere e cifre', () => {
    expect(patterns.sdiCode.test('ABC1234')).toBe(true)
  })

  it('accetta SDI default (0000000)', () => {
    expect(patterns.sdiCode.test('0000000')).toBe(true)
  })

  it('rifiuta SDI con 6 caratteri', () => {
    expect(patterns.sdiCode.test('ABCDEF')).toBe(false)
  })

  it('rifiuta SDI con 8 caratteri', () => {
    expect(patterns.sdiCode.test('ABCDEFGH')).toBe(false)
  })

  it('rifiuta SDI in minuscolo (il form fa toUpperCase)', () => {
    expect(patterns.sdiCode.test('abcdefg')).toBe(false)
  })

  it('rifiuta SDI con caratteri speciali', () => {
    expect(patterns.sdiCode.test('ABC-123')).toBe(false)
  })

  it('rifiuta stringa vuota', () => {
    expect(patterns.sdiCode.test('')).toBe(false)
  })
})
