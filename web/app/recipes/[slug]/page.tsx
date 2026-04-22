import { notFound } from 'next/navigation';

const GRAPHQL_ENDPOINT =
  process.env.KEYSTONE_ENDPOINT ?? 'http://localhost:3000/api/graphql';

type Tag = { id: string; name: string; color: string | null };
type Ingredient = {
  id: string;
  name: string;
  amount: string | null;
  unit: string | null;
  optional: boolean;
};
type Session = {
  id: string;
  cookedAt: string | null;
  versionLabel: string | null;
  outcomeRating: number | null;
  changesMade: string | null;
  resultNotes: string | null;
  wouldMakeAgain: boolean;
  servingsMade: number | null;
};
type Lesson = {
  id: string;
  title: string;
  body: string | null;
  category: string | null;
  sortOrder: number | null;
};
type Recipe = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  instructions: string | null;
  tags: Tag[];
  ingredients: Ingredient[];
  sessions: Session[];
  lessons: Lesson[];
};

const RECIPE_DEEP = `
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
`;

export default async function RecipeDetail({
  params,
}: {
  params: { slug: string };
}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: RECIPE_DEEP,
      variables: { slug: params.slug },
    }),
    cache: 'no-store',
  });

  const json = await res.json();
  const recipe: Recipe | null = json.data?.recipe ?? null;

  if (!recipe) {
    notFound();
  }

  return (
    <>
      <p>
        <a href="/">← all recipes</a>
      </p>
      <h1>{recipe.title}</h1>
      {recipe.summary && <p className="meta">{recipe.summary}</p>}

      {recipe.tags.length > 0 && (
        <div className="tags" style={{ marginBottom: '1rem' }}>
          {recipe.tags.map((tag) => (
            <span
              key={tag.id}
              className="tag"
              style={
                tag.color
                  ? { background: tag.color, color: 'white' }
                  : undefined
              }
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <>
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.map((ing) => (
              <li key={ing.id}>
                {ing.amount && `${ing.amount} `}
                {ing.unit && `${ing.unit} `}
                {ing.name}
                {ing.optional && ' (optional)'}
              </li>
            ))}
          </ul>
        </>
      )}

      {recipe.instructions && (
        <>
          <h2>Instructions</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions}</p>
        </>
      )}

      {recipe.sessions.length > 0 && (
        <>
          <h2>Cooking log</h2>
          {recipe.sessions.map((s) => (
            <div key={s.id} className="session">
              <p className="meta">
                {s.cookedAt && new Date(s.cookedAt).toLocaleDateString()}
                {s.versionLabel && ` · ${s.versionLabel}`}
                {s.outcomeRating !== null && ` · ${s.outcomeRating}/5`}
                {s.servingsMade !== null && ` · ${s.servingsMade} servings`}
                {s.wouldMakeAgain && ' · would make again'}
              </p>
              {s.changesMade && (
                <p>
                  <strong>Changes:</strong> {s.changesMade}
                </p>
              )}
              {s.resultNotes && (
                <p>
                  <strong>Notes:</strong> {s.resultNotes}
                </p>
              )}
            </div>
          ))}
        </>
      )}

      {recipe.lessons.length > 0 && (
        <>
          <h2>Lessons</h2>
          {recipe.lessons.map((lesson) => (
            <div key={lesson.id} style={{ marginBottom: '1rem' }}>
              <h3>{lesson.title}</h3>
              {lesson.category && <p className="meta">{lesson.category}</p>}
              {lesson.body && <p>{lesson.body}</p>}
            </div>
          ))}
        </>
      )}
    </>
  );
}
