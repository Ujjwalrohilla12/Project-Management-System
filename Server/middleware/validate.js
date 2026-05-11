import { ZodError } from 'zod';

/**
 * Middleware factory: validates req.body against a Zod schema.
 * On failure returns 422 with structured field errors.
 * On success, replaces req.body with the parsed (coerced + stripped) data.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req.body = result.data;
  next();
};

/**
 * Middleware factory: validates req.params against a Zod schema.
 */
export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(422).json({ success: false, message: 'Invalid parameters', errors });
  }
  req.params = result.data;
  next();
};
