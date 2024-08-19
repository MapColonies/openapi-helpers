import { readFileSync } from 'node:fs';
import supertest from 'supertest';
import type express from 'express';
import OASNormalize from 'oas-normalize';
import type { OmitProperties } from 'ts-essentials';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  PathsTemplate,
  PathRequestOptions,
  Methods,
  RequestOptions,
  OperationsNames,
  OperationsTemplate,
  RequestSenderObj,
  RequestReturn,
} from './types';

// eslint-disable-next-line @typescript-eslint/promise-function-async
function sendRequest<
  Paths extends PathsTemplate,
  Path extends keyof Paths,
  Method extends keyof OmitProperties<Omit<Paths[Path], 'parameters'>, undefined>,
>(app: express.Application, options: PathRequestOptions<Paths, Path, Method>): RequestReturn<Paths[Path][Method]> {
  const method = options.method as Methods;
  let actualPath = options.path as string;

  if ('pathParams' in options && options.pathParams !== undefined) {
    actualPath = Object.entries(options.pathParams).reduce((acc, [key, value]) => acc.replace(`{${key}}`, value as string), actualPath);
  }

  /* istanbul ignore next */
  if (actualPath.includes('{') || actualPath.includes('}')) {
    throw new Error('Path params are not provided');
  }

  let request = supertest.agent(app)[method](actualPath);

  if (options.queryParams !== undefined) {
    request = request.query(options.queryParams);
  }

  if ('requestBody' in options && options.requestBody !== undefined) {
    request = request.send(options.requestBody as object);
  }

  if (options.headers !== undefined) {
    for (const [key, value] of Object.entries(options.headers)) {
      request = request.set(key, value);
    }
  }

  request = request.set('Content-Type', 'application/json');;
  // @ts-expect-error whatever
  return request;
}

const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'] as const;

function getOperationsPathAndMethod<Paths extends PathsTemplate, Operations extends OperationsTemplate>(
  openapi: Awaited<ReturnType<OASNormalize['deref']>>
): Record<OperationsNames<Operations>, { path: keyof Paths; method: Methods }> {
  const result = {} as Record<OperationsNames<Operations>, { path: string; method: string }>;

  /* istanbul ignore next */
  if (openapi.paths === undefined) {
    throw new Error('No paths found in the OpenAPI file');
  }

  for (const [path, pathValue] of Object.entries(openapi.paths)) {
    /* istanbul ignore next */
    if (pathValue === undefined) {
      continue;
    }

    const pathObject = pathValue as OpenAPIV3.PathItemObject;

    for (const method of methods) {
      if (pathObject[method] !== undefined) {
        const operationId = pathObject[method]?.operationId;

        /* istanbul ignore next */
        if (operationId === undefined) {
          throw new Error(`OperationId is not defined for ${method} method on ${path}`);
        }

        // @ts-expect-error typescript does not allow to assign a generic index, but it is safe in this case
        // as we are iterating over all the paths and methods
        result[operationId] = {
          path,
          method,
        };
      }
    }
  }

  return result as Record<OperationsNames<Operations>, { path: keyof Paths; method: Methods }>;
}

export async function requestSender<Operations extends OperationsTemplate = never, Paths extends PathsTemplate = never>(
  openapiFilePath: Operations extends never ? never : string,
  app: express.Application
): Promise<RequestSenderObj<Paths, Operations>> {
  const fileContent = readFileSync(openapiFilePath, 'utf-8');
  const normalized = new OASNormalize(fileContent);
  const derefed = await normalized.deref();
  const operationsPathAndMethod = getOperationsPathAndMethod(derefed);

  const returnObj = {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    sendRequest: <Path extends keyof Paths, Method extends keyof OmitProperties<Omit<Paths[Path], 'parameters'>, undefined>>(
      options: PathRequestOptions<Paths, Path, Method>
    ) => sendRequest(app, options),
  };

  for (const [operation, { path, method }] of Object.entries(operationsPathAndMethod)) {
    // @ts-expect-error as we iterate over all the operations, the operationId is always defined
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    returnObj[operation] = async (options: RequestOptions<T['operations'][keyof T['operations']]>) =>
      sendRequest(app, { path, method: method as 'get', ...options });
  }

  return returnObj as RequestSenderObj<Paths, Operations>;
}
