export function truncateString(str: string, length: number): string {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function truncateToken(token: string): string {
  if (!token) return '';
  if (token.length <= 20) return token;
  return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
}

export function truncateCookies(cookies: string): string {
  if (!cookies) return '';
  if (cookies.length <= 40) return cookies;
  return `${cookies.substring(0, 40)}...`;
}
