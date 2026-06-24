const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const dataDir = process.env.DATA_DIR || './data';
  const keyPath = path.join(path.resolve(dataDir), '.encryption_key');

  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  }

  const key = crypto.randomBytes(32);
  const dir = path.resolve(dataDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(keyPath, key);
  return key;
}

function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;
  try {
    const key = getKey();
    const buf = Buffer.from(ciphertext, 'base64');
    if (buf.length < IV_LENGTH + TAG_LENGTH + 1) return ciphertext; // Not encrypted (too short)
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // If decryption fails, return raw value (might be unencrypted legacy data)
    return ciphertext;
  }
}

module.exports = { encrypt, decrypt };
