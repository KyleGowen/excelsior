import type { Response } from 'express';
import type { ZodIssue, ZodTypeAny, infer as ZodInfer } from 'zod';
import { sendV1Json, type V1ErrorBody } from './v1Envelope';

/**
 * Phase 2 §6.1.7 — centralized zod body parser for /api/v1 mutations.
 *
 * Usage:
 *   const parsed = parseV1Body(MySchema, req.body, res);
 *   if (!parsed) return; // response already sent with 400 + errors
 *   // ...use `parsed.value`
 *
 * Kill switch: `DISABLE_ZOD_V1=1` → pass-through with a warning so rollouts
 * can disable the parse without redeploy. The caller then receives the raw
 * body in `value`.
 */
export interface ParsedBody<T> {
  value: T;
}

export interface ParseV1BodyOptions {
  issueCode?: string | ((issue: ZodIssue) => string);
}

export function parseV1Body<S extends ZodTypeAny>(
  schema: S,
  body: unknown,
  res: Response,
  options: ParseV1BodyOptions = {}
): ParsedBody<ZodInfer<S>> | null {
  if (process.env.DISABLE_ZOD_V1 === '1') {
    console.warn('DISABLE_ZOD_V1=1: skipping zod body validation');
    return { value: body as ZodInfer<S> };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const errors: V1ErrorBody[] = result.error.issues.map((issue) => {
      const code = typeof options.issueCode === 'function'
        ? options.issueCode(issue)
        : options.issueCode ?? 'VALIDATION_ERROR';
      const err: V1ErrorBody = { code, message: issue.message };
      if (issue.path.length > 0) {
        err.field = String(issue.path.join('.'));
      }
      return err;
    });
    sendV1Json(res, 400, null, errors);
    return null;
  }
  return { value: result.data as ZodInfer<S> };
}
