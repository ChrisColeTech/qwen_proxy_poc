// Simple router utility for pattern matching and param extraction

export interface RouteMatch {
  params: Record<string, string>;
  matched: boolean;
}

/**
 * Match a route pattern against a path and extract params
 * @param pattern - Route pattern like "/providers/:id" or "/providers/:id/edit"
 * @param path - Actual path like "/providers/openai" or "/providers/openai/edit"
 * @returns Match result with params
 */
export function matchRoute(pattern: string, path: string): RouteMatch {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  // If different lengths, no match (unless pattern has catch-all)
  if (patternParts.length !== pathParts.length) {
    return { params: {}, matched: false };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // Dynamic segment (starts with :)
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    }
    // Static segment must match exactly
    else if (patternPart !== pathPart) {
      return { params: {}, matched: false };
    }
  }

  return { params, matched: true };
}

/**
 * Build a path from a pattern and params
 * @param pattern - Route pattern like "/providers/:id/edit"
 * @param params - Params object like { id: "openai" }
 * @returns Built path like "/providers/openai/edit"
 */
export function buildPath(pattern: string, params: Record<string, string>): string {
  let path = pattern;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value);
  }
  return path;
}
