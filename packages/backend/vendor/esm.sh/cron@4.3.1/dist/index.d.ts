import { DateTime } from 'https://esm.sh/@types/luxon@3.6.2/index.d.ts';
import { CronTime } from './time.d.ts';
export { CronJob } from './job.d.ts';
export { CronTime } from './time.d.ts';
export { CronCallback, CronCommand, CronContext, CronJobParams, CronOnCompleteCallback, CronOnCompleteCommand, Ranges, TimeUnit } from './types/cron.types.d.ts';
export declare const sendAt: (cronTime: string | Date | DateTime) => DateTime;
export declare const timeout: (cronTime: string | Date | DateTime) => number;
export declare const validateCronExpression: typeof CronTime.validateCronExpression;
