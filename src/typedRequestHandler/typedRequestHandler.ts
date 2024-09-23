import type { RequestHandler } from 'express';
import type { OptionalKeys } from 'ts-essentials';
import type { ResponseObjectToFlat } from '../requestSender/types';
import { OperationsTemplate, PathsTemplate } from '../common/types';

// The types only work with any, so we need to disable the eslint rule
// It doesn't affect the resulting types as its only used for the condition
/* eslint-disable @typescript-eslint/no-explicit-any */
type HasPathParams<T> = T extends { parameters: { path: NonNullable<any> } } ? T['parameters']['path'] : undefined;
type HasRequestBody<T> = T extends { requestBody: any } ? T['requestBody']['content']['application/json'] : undefined;
type HasQueryParams<T> = T extends { parameters: { query?: NonNullable<any> } } ? T['parameters']['query'] : undefined;
// /* eslint-enable @typescript-eslint/no-explicit-any */

type GenericRequestHandler<T> = RequestHandler<HasPathParams<T>, ResponseObjectToFlat<T>['body'], HasRequestBody<T>, HasQueryParams<T>>;

type OperationHandlers<Operations extends OperationsTemplate> = {
  [key in keyof Operations]: GenericRequestHandler<Operations[key]>;
};

type DefinedMethods<T> = Omit<T, 'parameters' | OptionalKeys<T>>;

type AllPathsAndMethodsUnion<Paths extends PathsTemplate> = {
  [path in keyof Paths]: {
    [method in keyof DefinedMethods<Paths[path]>]: { operation: Paths[path][method]; method: method; path: path };
  }[keyof DefinedMethods<Paths[path]>];
}[keyof Paths];

type PathHandlers<Paths extends PathsTemplate> = {
  [T in AllPathsAndMethodsUnion<Paths> as `${Uppercase<string & T['method']>} ${string & T['path']}`]: GenericRequestHandler<T['operation']>;
};

export type TypedRequestHandlers<Paths extends PathsTemplate, Operations extends OperationsTemplate> = OperationHandlers<Operations> &
  PathHandlers<Paths>;
