import { createHash } from 'crypto';
import { initNextAuthDB } from '@lib/nextAuthAdapter';
import { IDENTIFIER as identifier, EXPIRES as expires, TOKEN as token } from './nextAuth.constants';

export function hashToken(token: string) {
  return createHash('sha256').update(`${token}${process.env.NEXTAUTH_SECRET}`).digest('hex');
}

(async function setup() {
  const store = await initNextAuthDB();

  const verificationToken = {
    identifier,
    expires,
    token: hashToken(token),
  };

  await (await store).put(verificationToken.identifier, verificationToken);
  process.exit(0);
})();
