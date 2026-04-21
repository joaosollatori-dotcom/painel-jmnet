import { z } from 'zod';

export const genieTaskSchema = z.object({
    name: z.string(),
    parameterValues: z.array(z.tuple([z.string(), z.any(), z.string()])).optional(), // [path, value, type]
    objectName: z.string().optional(),
});

export const wifiConfigSchema = z.object({
    ssid: z.string().min(1),
    password: z.string().min(8),
});

export type GenieTask = z.infer<typeof genieTaskSchema>;
export type WifiConfig = z.infer<typeof wifiConfigSchema>;
