type AccessArgs = {
  session?: {
    data: {
      id: string;
      name: string;
      email: string;
      role: 'admin' | 'editor' | null;
    };
  };
};

export const isSignedIn = ({ session }: AccessArgs): boolean => Boolean(session);

export const isAdmin = ({ session }: AccessArgs): boolean =>
  session?.data.role === 'admin';

export const adminOnly = {
  operation: {
    query: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
};

export const contentWrites = {
  operation: {
    query: () => true,
    create: isSignedIn,
    update: isSignedIn,
    delete: isAdmin,
  },
};

export const publishedRecipeFilter = ({ session }: AccessArgs) => {
  if (session) return true;
  return {
    status: { equals: 'published' as const },
    publishedAt: { lte: new Date().toISOString() },
  };
};

export const viaPublishedRecipeFilter = ({ session }: AccessArgs) => {
  if (session) return true;
  return {
    recipe: {
      status: { equals: 'published' as const },
      publishedAt: { lte: new Date().toISOString() },
    },
  };
};
