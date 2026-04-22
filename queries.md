# Example GraphQL queries

Run these against `http://localhost:3000/api/graphql`.

## 1. List published recipes

```graphql
query PublishedRecipes($now: DateTime!) {
  recipes(
    where: {
      status: { equals: published }
      publishedAt: { lte: $now }
    }
    orderBy: [{ publishedAt: desc }]
  ) {
    id
    title
    slug
    summary
    difficulty
    prepTimeMinutes
    cookTimeMinutes
    featured
    publishedAt
    tags { name color }
  }
}
```

Variables:
```json
{ "now": "2026-04-22T20:00:00.000Z" }
```

Note: for anonymous callers the `publishedAt: { lte: $now }` clause is redundant — Phase 8's access filter already enforces it server-side. The explicit clause matters for authenticated callers who want the same "published and live now" view.

## 2. Fetch a recipe by slug

```graphql
query RecipeBySlug($slug: String!) {
  recipe(where: { slug: $slug }) {
    id
    title
    slug
    summary
    instructions
    difficulty
    prepTimeMinutes
    cookTimeMinutes
    status
    featured
    publishedAt
  }
}
```

Variables:
```json
{ "slug": "sourdough" }
```

## 3. Fetch a recipe with ingredients, sessions, and lessons

```graphql
query RecipeDeep($slug: String!) {
  recipe(where: { slug: $slug }) {
    id
    title
    slug
    summary
    instructions
    tags { id name color }
    ingredients {
      id
      name
      amount
      unit
      optional
    }
    sessions(orderBy: [{ cookedAt: desc }]) {
      id
      cookedAt
      versionLabel
      outcomeRating
      changesMade
      resultNotes
      wouldMakeAgain
      servingsMade
    }
    lessons(orderBy: [{ sortOrder: asc }]) {
      id
      title
      body
      category
      sortOrder
    }
  }
}
```

Variables:
```json
{ "slug": "sourdough" }
```
