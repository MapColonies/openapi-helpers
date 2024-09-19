/* eslint-disable import/exports-last */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OmitProperties, OptionalKeys, Prettify, RequiredKeys } from 'ts-essentials';
import type * as supertest from 'supertest';
import type { AddIfNotNever, PickWritable } from '../common/types';

export type Methods = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';

export type OperationsTemplate = Record<string, any>;

export type PathsTemplate = Record<
  string,
  {
    parameters: {
      query?: any;
      header?: any;
      path?: any;
      cookie?: any;
    };
  } & {
    [key in Methods]?: OperationsTemplate;
  }
>;

interface Headers {
  headers?: Record<string, string>;
}

type HasContent<T> = [T] extends [{ content: any }] ? T['content']['application/json'] : never;

type ResponseObjectToFlat<T> = [T] extends [{ responses: any }]
  ? {
      [res in keyof T['responses']]: { status: res; body: HasContent<T['responses'][res]> };
    }[keyof T['responses']]
  : never;

type PathParamsObj<T> = [T] extends [{ parameters: { path: NonNullable<any> } }] ? { pathParams: T['parameters']['path'] } : never;

type QueryParamsObj<T> = [T] extends [{ parameters: { query?: NonNullable<any> } }]
  ? [T] extends [{ parameters: { query?: never } }]
    ? { queryParams?: Record<string, string> }
    : [RequiredKeys<T['parameters']['query']>] extends [OptionalKeys<T['parameters']['query']>]
      ? { queryParams?: T['parameters']['query'] }
      : { queryParams: T['parameters']['query'] }
  : { queryParams?: Record<string, string> };

type ContentOrUndefined<T extends { content: any } | undefined> = [T] extends [{ content: any }]
  ? PickWritable<T['content']['application/json']>
  : undefined;

type RequestBodyObj<T> = [T] extends [{ requestBody: { content: any } }]
  ? { requestBody: PickWritable<T['requestBody']['content']['application/json']> }
  : T extends { requestBody?: undefined }
    ? { requestBody?: any }
    : T extends { requestBody?: { content: any } }
      ? { requestBody?: ContentOrUndefined<T['requestBody']> }
      : { requestBody?: any };

type RequestOptionsWithoutPathParams<T> = QueryParamsObj<T> & RequestBodyObj<T> & Headers;

export type RequestOptions<T> = AddIfNotNever<RequestOptionsWithoutPathParams<T>, PathParamsObj<T>>;

export type PathRequestOptions<
  Paths extends PathsTemplate,
  Path extends keyof Paths,
  Method extends keyof OmitProperties<Omit<Paths[Path], 'parameters'>, undefined>,
> = RequestOptions<Paths[Path][Method]> & { path: Path; method: Method };

export type RequestReturn<T> = Promise<ResponseObjectToFlat<T> & Omit<Awaited<supertest.Test>, 'body' | 'status'>> & supertest.Test;

export type OperationsNames<Operations extends OperationsTemplate> = keyof Operations;

type OperationRequestOptional<Operations extends OperationsTemplate, Operation extends OperationsNames<Operations>> = (
  options?: RequestOptions<Operations[Operation]>
) => RequestReturn<Operations[Operation]>;

type OperationRequestRequired<Operations extends OperationsTemplate, Operation extends OperationsNames<Operations>> = (
  options: RequestOptions<Operations[Operation]>
) => RequestReturn<Operations[Operation]>;

type SendRequest<Paths extends PathsTemplate> = <
  Path extends keyof Paths,
  Method extends keyof OmitProperties<Omit<Paths[Path], 'parameters'>, undefined>,
>(
  options: PathRequestOptions<Paths, Path, Method>
) => RequestReturn<Paths[Path][Method]>;

export type RequestSender<Paths extends PathsTemplate, Operations extends OperationsTemplate> = Prettify<
  {
    sendRequest: SendRequest<Paths>;
  } & {
    [operation in OperationsNames<Operations>]: RequiredKeys<RequestOptions<Operations[operation]>> extends OptionalKeys<
      RequestOptions<Operations[operation]>
    >
      ? OperationRequestOptional<Operations, operation>
      : OperationRequestRequired<Operations, operation>;
  }
>;
