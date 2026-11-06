import { z } from 'zod';
import { LIMITS } from '../domain/constants.js';

/** Only http(s) URLs: blocks javascript:, data:, file: and similar schemes. */
export const httpUrl = z.url({ protocol: /^https?$/ }).max(LIMITS.urlLength);

/** ISO-8601 date-time with timezone (Z or offset). */
export const isoDateTime = z.iso.datetime({ offset: true });

export const sourceKey = z.string().regex(/^[a-z0-9_]{2,64}$/, 'invalid source key');

export const idParams = z.object({ id: z.coerce.number().int().positive() });

export function optionalText(max: number) {
  return z.string().trim().max(max).nullish();
}
