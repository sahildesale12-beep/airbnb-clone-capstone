function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseDateOnly(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, `${fieldName} must use YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw httpError(400, `${fieldName} is not a valid calendar date.`);
  }

  return parsed;
}

function utcToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getNights(checkIn, checkOut) {
  const nightCount = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  if (nightCount < 1) {
    throw httpError(400, 'Check-out must be at least one night after check-in.');
  }
  if (nightCount > 90) {
    throw httpError(400, 'A booking cannot exceed 90 nights.');
  }
  return nightCount;
}

function getNightKeys(checkIn, checkOut) {
  const keys = [];
  for (let date = new Date(checkIn); date < checkOut; date.setUTCDate(date.getUTCDate() + 1)) {
    keys.push(date.toISOString().slice(0, 10));
  }
  return keys;
}

function parseStay(checkInValue, checkOutValue) {
  const checkIn = parseDateOnly(checkInValue, 'checkIn');
  const checkOut = parseDateOnly(checkOutValue, 'checkOut');

  if (checkIn < utcToday()) {
    throw httpError(400, 'Check-in cannot be in the past.');
  }

  const nights = getNights(checkIn, checkOut);
  return { checkIn, checkOut, nights, dateKeys: getNightKeys(checkIn, checkOut) };
}

module.exports = { httpError, parseDateOnly, utcToday, getNights, getNightKeys, parseStay };
