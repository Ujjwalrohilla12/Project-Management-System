// Strips HTML tags and null bytes from all string values in req.body.
// Prevents XSS and null-byte injection. Prisma's parameterized queries
// already prevent SQL injection, but this adds a defense-in-depth layer.

const sanitizeValue = (val) => {
  if (typeof val !== 'string') return val;
  return val
    .replace(/\0/g, '')                          // null bytes
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // script tags
    .replace(/<[^>]+>/g, '')                     // all HTML tags
    .trim();
};

const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)])
    );
  }
  return sanitizeValue(obj);
};

export const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};
