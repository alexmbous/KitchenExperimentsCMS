import { getContext } from '@keystone-6/core/context';
import * as PrismaModule from '.prisma/client';
import config from './keystone';

async function seed() {
  const context = getContext(config, PrismaModule).sudo();

  // 1. Role backfill: pre-Phase-8 users have role = null because the column
  // was just added. Set null roles to 'admin' (simplest safe thing — the only
  // pre-existing user was the bootstrap admin from /init). Idempotent.
  const users = await context.query.User.findMany({ query: 'id email role' });
  for (const u of users) {
    if (!u.role) {
      await context.query.User.updateOne({
        where: { id: u.id },
        data: { role: 'admin' },
      });
      console.log(`Backfilled role=admin for ${u.email}`);
    }
  }

  // 2. Test editor user (for Phase 8 verification). Idempotent via email.
  const existingEditor = await context.query.User.findOne({
    where: { email: 'editor@test.local' },
  });
  if (!existingEditor) {
    await context.query.User.createOne({
      data: {
        name: 'Test Editor',
        email: 'editor@test.local',
        password: 'editor-test-pass-123',
        role: 'editor',
      },
    });
    console.log('Created test editor user (editor@test.local / editor-test-pass-123).');
  }

  // 3. Main content seed — runs once, guarded by the 'sourdough' slug.
  const sourdough = await context.query.Recipe.findOne({
    where: { slug: 'sourdough' },
  });
  if (!sourdough) {
    const tags = await context.query.Tag.createMany({
      data: [
        { name: 'Bread', color: '#b5651d' },
        { name: 'Weeknight', color: '#4a90e2' },
        { name: 'Comfort', color: '#e27d60' },
        { name: 'Weekend', color: '#55a630' },
      ],
      query: 'id name',
    });

    const tagId = (name: string) => {
      const t = tags.find((t: { id: string; name: string }) => t.name === name);
      if (!t) throw new Error(`Missing tag: ${name}`);
      return t.id;
    };

    await context.query.Recipe.createOne({
      data: {
        title: 'Sourdough',
        slug: 'sourdough',
        summary: 'Basic sourdough loaf.',
        instructions: 'Mix, bulk ferment, shape, proof, bake.',
        difficulty: 'medium',
        prepTimeMinutes: 30,
        cookTimeMinutes: 45,
        status: 'published',
        featured: true,
        publishedAt: new Date().toISOString(),
        tags: { connect: [{ id: tagId('Bread') }, { id: tagId('Weekend') }] },
        ingredients: {
          create: [
            { name: 'Bread flour', amount: '500', unit: 'g', optional: false },
            { name: 'Water', amount: '375', unit: 'g', optional: false },
            { name: 'Starter', amount: '100', unit: 'g', optional: false },
            { name: 'Salt', amount: '10', unit: 'g', optional: false },
          ],
        },
        sessions: {
          create: [{
            cookedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
            versionLabel: 'v1',
            outcomeRating: 4,
            changesMade: 'Used stone-ground flour',
            resultNotes: 'Great crust; crumb a bit tight',
            wouldMakeAgain: true,
            servingsMade: 8,
          }],
        },
        lessons: {
          create: [{
            title: 'Temperature matters',
            body: 'Dough temperature dictates fermentation pace.',
            category: 'technique',
            sortOrder: 1,
          }],
        },
      },
    });

    await context.query.Recipe.createOne({
      data: {
        title: 'Weeknight Pasta',
        slug: 'weeknight-pasta',
        summary: 'Fast tomato-basil pasta.',
        instructions: 'Boil pasta; reduce sauce; combine.',
        difficulty: 'easy',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        status: 'published',
        featured: false,
        publishedAt: new Date().toISOString(),
        tags: { connect: [{ id: tagId('Weeknight') }] },
        ingredients: {
          create: [
            { name: 'Spaghetti', amount: '400', unit: 'g', optional: false },
            { name: 'Canned tomatoes', amount: '1', unit: 'can', optional: false },
            { name: 'Garlic', amount: '3', unit: 'cloves', optional: false },
            { name: 'Basil', amount: '1', unit: 'handful', optional: true },
          ],
        },
        sessions: {
          create: [{
            cookedAt: new Date('2024-02-20T19:30:00Z').toISOString(),
            versionLabel: 'v1',
            outcomeRating: 5,
            changesMade: 'Added extra garlic',
            resultNotes: 'Perfect weeknight meal',
            wouldMakeAgain: true,
            servingsMade: 4,
          }],
        },
      },
    });

    await context.query.Recipe.createOne({
      data: {
        title: 'Experimental Miso Broth',
        slug: 'experimental-miso-broth',
        summary: 'Still iterating.',
        instructions: 'Simmer dashi; whisk in miso off heat; taste.',
        difficulty: 'medium',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        status: 'draft',
        featured: false,
        tags: { connect: [{ id: tagId('Comfort') }] },
        ingredients: {
          create: [
            { name: 'Dashi', amount: '1', unit: 'liter', optional: false },
            { name: 'White miso', amount: '3', unit: 'tbsp', optional: false },
          ],
        },
        sessions: {
          create: [{
            cookedAt: new Date('2024-03-05T18:00:00Z').toISOString(),
            versionLabel: 'v1',
            outcomeRating: 3,
            changesMade: 'First attempt',
            resultNotes: 'Too salty; needs rebalancing',
            wouldMakeAgain: false,
            servingsMade: 2,
          }],
        },
        lessons: {
          create: [{
            title: 'Miso type matters',
            body: 'White miso is mild; red is more assertive.',
            category: 'ingredient',
            sortOrder: 1,
          }],
        },
      },
    });

    console.log('Seeded 3 recipes (2 published, 1 draft), 4 tags, 10 ingredients, 3 sessions, 2 lessons.');
  } else {
    console.log('Main seed already present (slug "sourdough" exists); skipping.');
  }

  // 4. Future-scheduled recipe (for Phase 8 scheduled-publishing verification).
  const future = await context.query.Recipe.findOne({
    where: { slug: 'future-holiday-menu' },
  });
  if (!future) {
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    await context.query.Recipe.createOne({
      data: {
        title: 'Future Holiday Menu',
        slug: 'future-holiday-menu',
        summary: 'Scheduled to go live next week.',
        instructions: 'Details coming later.',
        difficulty: 'medium',
        status: 'published',
        publishedAt: inSevenDays.toISOString(),
        featured: false,
      },
    });
    console.log('Created "future-holiday-menu" (status=published, publishedAt = +7 days).');
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
