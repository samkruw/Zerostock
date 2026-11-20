/** Physical container labels are case-sensitive text. Keys must also be valid RTDB paths. */
function invalid(message) {
  const error = new Error(message);
  error.code = 'INVALID_CONTAINER_SERIAL';
  throw error;
}

export function parseSerialNumbers(input) {
  const list = typeof input === 'string' ? input.split(/\r\n|[\r\n]/).filter(line => line.trim()) : input;
  if (!Array.isArray(list) || !list.length) invalid('Mindestens eine Seriennummer vom Containeretikett erfassen.');
  const seen = new Set();
  for (const value of list) {
    if (typeof value !== 'string') invalid('Seriennummern als Text erfassen.');
    const number = value.trim();
    if (!number || number.length > 120 || /[\x00-\x1f\x7f]/.test(number) || /[\uD800-\uDFFF]/u.test(number)) {
      invalid('Je Zeile eine Seriennummer mit höchstens 120 Zeichen erfassen.');
    }
    if (seen.has(number)) invalid('Seriennummer mehrfach erfasst: ' + number);
    seen.add(number);
  }
  return [...seen];
}

function unitKey(number) {
  const bytes = new TextEncoder().encode(number);
  return 's' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function inStock(article) {
  return Object.values(article.containerUnits || {}).filter(unit => unit.status === 'in').length;
}
export function unassignedStock(article) {
  return Number(article.stock) - inStock(article);
}
function updateUnits(article, numbers, action, move) {
  if (article.kind !== 'container') invalid('Seriennummern gehören zu Containerartikeln.');
  const units = {...article.containerUnits};
  for (const number of numbers) {
    const key = unitKey(number), previous = units[key];
    if (action === 'assign' && previous) invalid('Seriennummer bereits zugeordnet: ' + number);
    if (action === 'in' && previous?.status === 'in') invalid('Container bereits im Lager: ' + number);
    if ((action === 'out' || action === 'shrink') && previous?.status !== 'in') {
      invalid('Für diese Seriennummer ist kein Container im Lager zugeordnet: ' + number);
    }
    units[key] = {
      number, status: action === 'assign' ? 'in' : action, updatedAt: move.ts,
      ...(move.id ? {moveId:move.id} : {}),
      ...(move.partner ? {partner:move.partner} : {}),
      ...(move.reference ? {reference:move.reference} : {}),
    };
  }
  const updated = {...article, containerUnits:units};
  updated.serialStock = inStock(updated);
  return updated;
}
export function assignContainerUnits(article, input, ts) {
  const numbers = parseSerialNumbers(input);
  if (numbers.length > unassignedStock(article)) invalid('Mehr Etiketten als unzugeordnete Container im Bestand.');
  return updateUnits(article, numbers, 'assign', {ts});
}

/** Also accepts a quantity-only movement created by an older client or queue. */
export function applyStockMovement(article, move) {
  const qty = Number(move.qty), current = Number(article.stock);
  const stock = current + (move.type === 'in' ? qty : -qty);
  if (!['in','out','shrink'].includes(move.type) || !Number.isSafeInteger(qty) || qty <= 0 ||
      !Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(stock)) throw Error('INVALID_STOCK');
  if (stock < 0) throw Error('INSUFFICIENT_STOCK_SERVER');
  let result = article;
  if (move.serialNumbers !== undefined) {
    const numbers = parseSerialNumbers(move.serialNumbers);
    if (numbers.length !== qty) invalid('Die Buchungsmenge muss der Anzahl Etiketten entsprechen.');
    result = updateUnits(article, numbers, move.type, move);
  } else if (article.containerUnits && move.type !== 'in' && qty > unassignedStock(article)) {
    invalid('Für diesen Bestand ist eine Buchung mit Seriennummern erforderlich.');
  }
  return {...result, stock};
}
