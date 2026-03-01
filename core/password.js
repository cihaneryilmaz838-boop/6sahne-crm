const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;

function hashPassword(plain) {
  const normalized = String(plain || '');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(normalized, salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash };
}

function verifyPassword(plain, salt, hash) {
  const normalized = String(plain || '');
  const expectedHash = String(hash || '');
  const computedHash = crypto.scryptSync(normalized, String(salt || ''), SCRYPT_KEYLEN).toString('hex');

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');

  if (expectedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, computedBuffer);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
