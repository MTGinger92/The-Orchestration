// Loads public/feed.json, written hourly by abbrescia-os/pipeline/orchestration_feed.py.
// The feed is encrypted (AES-GCM, key from PBKDF2-SHA256 of the passphrase), so the page can be
// hosted publicly while the data stays private. A plain feed (no "data" field) is accepted for local testing.
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function loadFeed(passphrase) {
  const res = await fetch(`${import.meta.env.BASE_URL}feed.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('nofeed');
  const enc = await res.json();
  if (!enc.data) return enc;
  if (!passphrase) throw new Error('locked');
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(enc.salt), iterations: enc.iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  );
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enc.iv) }, key, b64(enc.data));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error('badpass');
  }
}
