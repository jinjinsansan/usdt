import { z } from 'zod';

export const traceRequestSchema = z.object({
  address: z
    .string()
    .min(10, 'ウォレットアドレスを入力してください')
    .regex(/^[0-9a-zA-Z]+$/, '半角英数字で入力してください'),
  chain: z
    .enum(['TRON', 'ETHEREUM', 'BSC', 'POLYGON'])
    .optional(),
  depth: z
    .number({ invalid_type_error: '追跡階層は数値で指定してください' })
    .min(1)
    .max(10)
    .optional()
    .default(5),
});

export type TraceRequestSchema = z.infer<typeof traceRequestSchema>;
