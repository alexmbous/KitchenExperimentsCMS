import { config } from '@keystone-6/core';
import rateLimit from 'express-rate-limit';
import { withAuth, session } from './auth';
import { lists } from './schema';

const graphqlRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => (req.headers.cookie ?? '').includes('keystonejs-session='),
});

const corsOrigin = (process.env.CORS_ORIGIN ?? 'http://localhost:3001')
  .split(',')
  .map((s) => s.trim());

export default withAuth(
  config({
    db: {
      provider: process.env.DATABASE_URL ? 'postgresql' : 'sqlite',
      url: process.env.DATABASE_URL ?? 'file:./keystone.db',
    },
    lists,
    session,
    server: {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
      extendExpressApp: (app) => {
        app.use('/api/graphql', graphqlRateLimit);
      },
    },
    storage: {
      local_images: {
        kind: 'local',
        type: 'image',
        generateUrl: (path) => `/images${path}`,
        serverRoute: { path: '/images' },
        storagePath: 'public/images',
      },
    },
  })
);
