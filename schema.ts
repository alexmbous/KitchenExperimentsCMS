import { list } from '@keystone-6/core';
import {
  checkbox,
  image,
  integer,
  password,
  relationship,
  select,
  text,
  timestamp,
} from '@keystone-6/core/fields';
import type { Lists } from '.keystone/types';
import {
  adminOnly,
  contentWrites,
  publishedRecipeFilter,
  viaPublishedRecipeFilter,
} from './access';

export const lists: Lists = {
  User: list({
    access: adminOnly,
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({
        validation: { isRequired: true },
        isIndexed: 'unique',
      }),
      password: password({ validation: { isRequired: true } }),
      role: select({
        type: 'enum',
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Editor', value: 'editor' },
        ],
        defaultValue: 'editor',
      }),
    },
  }),

  Recipe: list({
    access: {
      ...contentWrites,
      filter: { query: publishedRecipeFilter },
    },
    fields: {
      title: text({ validation: { isRequired: true } }),
      slug: text({
        validation: { isRequired: true },
        isIndexed: 'unique',
      }),
      summary: text({ ui: { displayMode: 'textarea' } }),
      instructions: text({ ui: { displayMode: 'textarea' } }),
      difficulty: select({
        type: 'enum',
        options: [
          { label: 'Easy', value: 'easy' },
          { label: 'Medium', value: 'medium' },
          { label: 'Hard', value: 'hard' },
        ],
        defaultValue: 'medium',
        validation: { isRequired: true },
      }),
      prepTimeMinutes: integer({ validation: { min: 0 } }),
      cookTimeMinutes: integer({ validation: { min: 0 } }),
      status: select({
        type: 'enum',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
        defaultValue: 'draft',
        validation: { isRequired: true },
        ui: { displayMode: 'segmented-control' },
      }),
      featured: checkbox({ defaultValue: false }),
      publishedAt: timestamp(),
      heroImage: image({ storage: 'local_images' }),
      ingredients: relationship({ ref: 'Ingredient.recipe', many: true }),
      sessions: relationship({ ref: 'CookingSession.recipe', many: true }),
      tags: relationship({ ref: 'Tag.recipes', many: true }),
      lessons: relationship({ ref: 'Lesson.recipe', many: true }),
      createdAt: timestamp({
        defaultValue: { kind: 'now' },
      }),
    },
  }),

  Ingredient: list({
    access: {
      ...contentWrites,
      filter: { query: viaPublishedRecipeFilter },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      amount: text(),
      unit: text(),
      optional: checkbox({ defaultValue: false }),
      recipe: relationship({ ref: 'Recipe.ingredients', many: false }),
    },
  }),

  CookingSession: list({
    access: {
      ...contentWrites,
      filter: { query: viaPublishedRecipeFilter },
    },
    fields: {
      recipe: relationship({ ref: 'Recipe.sessions', many: false }),
      cookedAt: timestamp(),
      versionLabel: text(),
      outcomeRating: integer({ validation: { min: 1, max: 5 } }),
      changesMade: text({ ui: { displayMode: 'textarea' } }),
      resultNotes: text({ ui: { displayMode: 'textarea' } }),
      wouldMakeAgain: checkbox({ defaultValue: false }),
      servingsMade: integer(),
    },
  }),

  Tag: list({
    access: contentWrites,
    fields: {
      name: text({ validation: { isRequired: true } }),
      color: text(),
      recipes: relationship({ ref: 'Recipe.tags', many: true }),
    },
  }),

  Lesson: list({
    access: {
      ...contentWrites,
      filter: { query: viaPublishedRecipeFilter },
    },
    fields: {
      title: text({ validation: { isRequired: true } }),
      body: text({ ui: { displayMode: 'textarea' } }),
      recipe: relationship({ ref: 'Recipe.lessons', many: false }),
      category: text(),
      sortOrder: integer(),
    },
  }),
};
