#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { format, resolveConfig } from 'prettier';
import openapiTS, { astToString } from 'openapi-typescript';

const ARGS_SLICE = 2;

const {
  values: { format: shouldFormat, 'add-typed-request-handler': addTypedRequestHandler },
  positionals,
} = parseArgs({
  args: process.argv.slice(ARGS_SLICE),
  options: {
    format: { type: 'boolean', alias: 'f' },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'add-typed-request-handler': { type: 'boolean', alias: 't' },
  },
  allowPositionals: true,
});

const [openapiPath, destinationPath] = positionals;

const ESLINT_DISABLE = '/* eslint-disable */\n';

const typedRequestHandlerImport =
  "import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';\n";
const exportTypedRequestHandlers = 'export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;\n';

const ast = await openapiTS(await fs.readFile(openapiPath, 'utf-8'), { exportType: true });

let content = astToString(ast);

if (addTypedRequestHandler === true) {
  content = typedRequestHandlerImport + content + exportTypedRequestHandlers;
}

content = ESLINT_DISABLE + content;

if (shouldFormat === true) {
  const prettierOptions = await resolveConfig('./src/index.ts');

  content = await format(content, { ...prettierOptions, parser: 'typescript' });
}

await fs.writeFile(destinationPath, content);

console.log('Types generated successfully');
