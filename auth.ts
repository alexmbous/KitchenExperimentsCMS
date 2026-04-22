import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';

try {
  process.loadEnvFile();
} catch {}

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set in .env');
}

const isProduction = process.env.NODE_ENV === 'production';

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'id name email role',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    itemData: { role: 'admin' },
  },
});

const session = statelessSessions({
  maxAge: 60 * 60 * 24 * 30,
  secret: sessionSecret,
  secure: isProduction,
  sameSite: 'lax',
});

export { withAuth, session };
