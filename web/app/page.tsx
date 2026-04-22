const GRAPHQL_ENDPOINT =
  process.env.KEYSTONE_ENDPOINT ?? 'http://localhost:3000/api/graphql';

type Tag = { id: string; name: string; color: string | null };
type Recipe = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  difficulty: string;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  publishedAt: string | null;
  tags: { name: string; color: string | null }[];
};

const HOMEPAGE_QUERY = `
  query Homepage($where: RecipeWhereInput!) {
    recipes(where: $where, orderBy: [{ publishedAt: desc }]) {
      id
      title
      slug
      summary
      difficulty
      prepTimeMinutes
      cookTimeMinutes
      publishedAt
      tags { name color }
    }
    tags(orderBy: [{ name: asc }]) {
      id
      name
      color
    }
  }
`;

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string };
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const activeTag =
    typeof searchParams.tag === 'string' ? searchParams.tag : '';

  const where: Record<string, unknown> = {
    status: { equals: 'published' },
  };
  if (q) where.title = { contains: q };
  if (activeTag) where.tags = { some: { name: { equals: activeTag } } };

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: HOMEPAGE_QUERY,
      variables: { where },
    }),
    cache: 'no-store',
  });

  const json = await res.json();
  const recipes: Recipe[] = json.data?.recipes ?? [];
  const allTags: Tag[] = json.data?.tags ?? [];

  const tagHref = (tagName: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tagName !== activeTag) params.set('tag', tagName);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  return (
    <>
      <h1>Kitchen CMS</h1>

      <form method="get" className="search-form">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search recipes…"
        />
        {activeTag && <input type="hidden" name="tag" value={activeTag} />}
        <button type="submit">Search</button>
      </form>

      {allTags.length > 0 && (
        <div className="tag-filter">
          {allTags.map((t) => {
            const active = t.name === activeTag;
            return (
              <a
                key={t.id}
                href={tagHref(t.name)}
                className={active ? 'active' : ''}
                style={
                  active && t.color
                    ? { background: t.color, color: 'white' }
                    : undefined
                }
              >
                {t.name}
                {active ? ' ×' : ''}
              </a>
            );
          })}
        </div>
      )}

      {recipes.length === 0 ? (
        <p>No recipes match.</p>
      ) : (
        recipes.map((recipe) => (
          <a
            key={recipe.id}
            href={`/recipes/${encodeURIComponent(recipe.slug)}`}
            className="recipe-card"
          >
            <h2 style={{ margin: 0 }}>{recipe.title}</h2>
            {recipe.summary && <p className="meta">{recipe.summary}</p>}
            <p className="meta">
              {recipe.difficulty}
              {recipe.prepTimeMinutes !== null &&
                ` · prep ${recipe.prepTimeMinutes}m`}
              {recipe.cookTimeMinutes !== null &&
                ` · cook ${recipe.cookTimeMinutes}m`}
            </p>
            {recipe.tags.length > 0 && (
              <div className="tags">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag.name}
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
          </a>
        ))
      )}
    </>
  );
}
