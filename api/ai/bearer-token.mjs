export function extractBearerToken(value) {
  // Authorization is a single-valued header. Reject duplicates rather than
  // trusting whichever value a proxy or framework happens to select.
  const candidate = Array.isArray(value)
    ? (value.length === 1 ? value[0] : undefined)
    : value;
  if (typeof candidate !== 'string') return '';

  const match = /^Bearer\s+([^\s]+)$/i.exec(candidate.trim());
  return match ? match[1] : '';
}
