import Adapter from '@lib/nextAuthAdapter';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import BoxyHQSAMLProvider from 'next-auth/providers/boxyhq-saml';
import { validateEmailWithACL } from '@lib/utils';
import { jacksonOptions as env } from '@lib/env';
import { sessionName } from '@lib/constants';

export default NextAuth({
  theme: {
    colorScheme: 'light',
  },
  providers: [
    BoxyHQSAMLProvider({
      authorization: { params: { scope: '' } },
      issuer: env.externalUrl,
      clientId: 'dummy',
      clientSecret: 'dummy',
      httpOptions: {
        timeout: 30000,
      },
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30,
  },
  cookies: {
    sessionToken: {
      name: sessionName,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'),
      },
    },
  },
  callbacks: {
    async signIn({ user, account }): Promise<boolean> {
      if (!user.email) {
        return false;
      }
      return account?.provider === 'boxyhq-saml' ? true : validateEmailWithACL(user.email);
    },
  },
  pages: {
    signIn: '/admin/auth/login',
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  adapter: Adapter(),
});
