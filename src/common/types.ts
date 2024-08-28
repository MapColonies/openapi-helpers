import { WritableKeys } from 'ts-essentials';

export type AddIfNotNever<T, U> = [U] extends [never] ? T : T & U;
export type PickWritable<T extends NonNullable<unknown>> = Pick<T, WritableKeys<T>>;
