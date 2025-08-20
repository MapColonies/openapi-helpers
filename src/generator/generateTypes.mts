#!/usr/bin/env node
import fs from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import openapiTS, { astToString, SchemaObject, TransformNodeOptions, TransformObject } from 'openapi-typescript';
import { TypeNode } from 'typescript';

const ESLINT_DISABLE = '/* eslint-disable */\n';

const typedRequestHandlerImport =
  "import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';\n";
const exportTypedRequestHandlers = 'export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;\n';

export async function generateTypes(
  openapiPath: string,
  destinationPath: string,
  shouldFormat: boolean,
  addTypedRequestHandler: boolean,
  inject?: string,
  transform?: (schemaObject: SchemaObject, metadata: TransformNodeOptions) => TypeNode | TransformObject | undefined
): Promise<void> {
  const ast = await openapiTS(await fs.readFile(openapiPath, 'utf-8'), { exportType: true, inject, transform });

  let content = astToString(ast);

  if (addTypedRequestHandler) {
    content = typedRequestHandlerImport + content + exportTypedRequestHandlers;
  }

  content = ESLINT_DISABLE + content;

  if (shouldFormat) {
    const prettierOptions = await resolveConfig('./src/index.ts');

    content = await format(content, { ...prettierOptions, parser: 'typescript' });
  }

  await fs.writeFile(destinationPath, content);
}
