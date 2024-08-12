import { readFileSync } from 'node:fs';
import supertest from 'supertest';
import type express from 'express';
import OASNormalize from 'oas-normalize';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  PathsTemplate,
  PathRequestOptions,
  PathRequestReturn,
  Methods,
  OperationsNames,
  OperationsTemplate,
  RequestSenderObj,
  OperationRequestOptions,
} from './types';

// eslint-disable-next-line @typescript-eslint/promise-function-async
function sendRequest<Paths extends PathsTemplate, Path extends keyof Paths, Method extends keyof Paths[Path]>(
  app: express.Application,
  options: PathRequestOptions<Paths, Path, Method>
): PathRequestReturn<Paths, Path, Method> {
  const method = options.method as Methods;

  let actualPath = options.path as string;

  if (options.pathParams !== undefined) {
    actualPath = Object.entries(options.pathParams).reduce((acc, [key, value]) => acc.replace(`{${key}}`, value as string), actualPath);
  }

  if (actualPath.includes('{') || actualPath.includes('}')) {
    throw new Error('Path params are not provided');
  }

  let request = supertest.agent(app)[method](actualPath);

  if (options.queryParams !== undefined) {
    request = request.query(options.queryParams);
  }

  if (options.requestBody !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    request = request.send(options.requestBody);
  }

  return request.set('Content-Type', 'application/json');
}

const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'] as const;

function getOperationsPathAndMethod<Paths extends PathsTemplate, Operations extends OperationsTemplate>(
  openapi: Awaited<ReturnType<OASNormalize['deref']>>
): Record<OperationsNames<Operations>, { path: keyof Paths; method: Methods }> {
  const result = {} as Record<OperationsNames<Operations>, { path: string; method: string }>;

  if (openapi.paths === undefined) {
    throw new Error('No paths found in the OpenAPI file');
  }

  for (const [path, pathValue] of Object.entries(openapi.paths)) {
    if (pathValue === undefined) {
      continue;
    }

    const pathObject = pathValue as OpenAPIV3.PathItemObject;

    for (const method of methods) {
      if (pathObject[method] !== undefined) {
        const operationId = pathObject[method]?.operationId;

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

export async function requestSender<T extends { operations: OperationsTemplate; paths: PathsTemplate }>(
  openapiFilePath: string,
  app: express.Application
): Promise<RequestSenderObj<T['paths'], T['operations']>> {
  const fileContent = readFileSync(openapiFilePath, 'utf-8');
  const normalized = new OASNormalize(fileContent);
  const derefed = await normalized.deref();
  const operationsPathAndMethod = getOperationsPathAndMethod(derefed);

  // const openapi = await parse(fileContent);
  const returnObj = {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    sendRequest: <Path extends keyof T['paths'], Method extends keyof T['paths'][Path]>(options: PathRequestOptions<T['paths'], Path, Method>) =>
      sendRequest(app, options),
  };

  for (const [operation, { path, method }] of Object.entries(operationsPathAndMethod)) {
    // @ts-expect-error as we iterate over all the operations, the operationId is always defined
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    returnObj[operation] = async (options: OperationRequestOptions<T['operations'], keyof T['operations']>) =>
      sendRequest(app, { path, method: method as 'get', ...options });
  }

  return returnObj as RequestSenderObj<T['paths'], T['operations']>;
}
