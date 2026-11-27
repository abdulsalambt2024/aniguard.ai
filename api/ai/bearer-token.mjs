export function extractBearerToken(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== 'string') return '';

  const match = /^Bearer\\s+([^\\s]+)$/i.exec(candidate.trim());
  return match ? match[1] : '';
}
