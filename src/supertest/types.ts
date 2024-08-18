/* eslint-disable import/exports-last */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OptionalKeys, RequiredKeys, WritableKeys } from 'ts-essentials';
import type * as supertest from 'supertest';

type AddIfNotNever<T, U> = [U] extends [never] ? T : T & U;

export type PathsTemplate = Record<
  string,
  {
    get?: any;
    put?: any;
    post?: any;
    delete?: any;
    options?: any;
    head?: any;
    patch?: any;
    trace?: any;
    parameters: {
      query?: any;
      header?: any;
      path?: any;
      cookie?: any;
    };
  }
>;

export interface Headers {
  headers?: Record<string, string>;
}

export type OperationsTemplate = Record<string, any>;

export type Methods = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';

type HasContent<T> = [T] extends [{ content: any }] ? T['content']['application/json'] : never;

type ResponseObjectToFlat<T> = [T] extends [{ responses: any }]
  ? {
      [res in keyof T['responses']]: { status: res; body: HasContent<T['responses'][res]> };
    }[keyof T['responses']]
  : never;

export type PathParamsObj<T> = [T] extends [{ parameters: { path: NonNullable<any> } }] ? { pathParams: T['parameters']['path'] } : never;

export type QueryParamsObj<T> = [T] extends [{ parameters: { query?: NonNullable<any> } }]
  ? [T] extends [{ parameters: { query?: never } }] // was also any in the original code
    ? { queryParams?: Record<string, string> }
    : [RequiredKeys<T['parameters']['query']>] extends [OptionalKeys<T['parameters']['query']>]
      ? { queryParams?: T['parameters']['query'] }
      : { queryParams: T['parameters']['query'] }
  : { queryParams?: Record<string, string> };

export type A<T extends { content: any } | undefined> = [T] extends [{ content: any }]
  ? Pick<T['content']['application/json'], WritableKeys<T['content']['application/json']>>
  : undefined;

export type RequestBodyObj<T> = [T] extends [{ requestBody: { content: any } }]
  ? { requestBody: Pick<T['requestBody']['content']['application/json'], WritableKeys<T['requestBody']['content']['application/json']>> }
  : T extends { requestBody?: undefined }
    ? { requestBody?: any }
    : T extends { requestBody?: { content: any } }
      ? { requestBody?: A<T['requestBody']> }
      : { requestBody?: any };

export type PathRequestOptionsWithoutPathParams<Paths extends PathsTemplate, Path extends keyof Paths, Method extends keyof Paths[Path]> = {
  path: Path;
  method: Method;
} & QueryParamsObj<Paths[Path][Method]> &
  RequestBodyObj<Paths[Path][Method]> &
  Headers;

export type PathRequestOptions<Paths extends PathsTemplate, Path extends keyof Paths, Method extends keyof Paths[Path]> = AddIfNotNever<
  PathRequestOptionsWithoutPathParams<Paths, Path, Method>,
  PathParamsObj<Paths[Path]>
>;

export type PathRequestReturn<Paths extends PathsTemplate, Path extends keyof Paths, Method extends keyof Paths[Path]> = Promise<
  (ResponseObjectToFlat<Paths[Path][Method]> | { status: number; body: any }) & Omit<Awaited<supertest.Test>, 'body' | 'status'>
> &
  supertest.Test;

export type OperationsNames<Operations extends OperationsTemplate> = keyof Operations;

export type OperationRequestOptionsWithoutPath<Operations extends OperationsTemplate, OperationKey extends keyof Operations> = QueryParamsObj<
  Operations[OperationKey]
> &
  RequestBodyObj<Operations[OperationKey]> &
  Headers;

export type OperationRequestOptions<Operations extends OperationsTemplate, OperationKey extends keyof Operations> = AddIfNotNever<
  OperationRequestOptionsWithoutPath<Operations, OperationKey>,
  PathParamsObj<Operations[OperationKey]>
>;

export type OperationRequestReturn<Operations extends OperationsTemplate, Operation extends OperationsNames<Operations>> = Promise<
  ResponseObjectToFlat<Operations[Operation]> & Omit<Awaited<supertest.Test>, 'body' | 'status'>
> &
  supertest.Test;

export type OperationRequestRequired<Operations extends OperationsTemplate, Operation extends OperationsNames<Operations>> = (
  options: OperationRequestOptions<Operations, Operation>
) => OperationRequestReturn<Operations, Operation>;

export type OperationRequestOptional<Operations extends OperationsTemplate, Operation extends OperationsNames<Operations>> = (
  options?: OperationRequestOptions<Operations, Operation>
) => OperationRequestReturn<Operations, Operation>;

export type RequestSenderObj<Paths extends PathsTemplate, Operations extends OperationsTemplate> = {
  sendRequest: <Path extends keyof Paths, Method extends keyof Paths[Path]>(
    options: PathRequestOptions<Paths, Path, Method>
  ) => PathRequestReturn<Paths, Path, Method>;
} & {
  [operation in OperationsNames<Operations>]: RequiredKeys<OperationRequestOptions<Operations, operation>> extends OptionalKeys<
    OperationRequestOptions<Operations, operation>
  >
    ? OperationRequestOptional<Operations, operation>
    : OperationRequestRequired<Operations, operation>;
};
