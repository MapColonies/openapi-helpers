#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { format, resolveConfig } from 'prettier';
import openapiTS, { astToString } from 'openapi-typescript';

const ARGS_SLICE = 2;

const {
  values: { format: shouldFormat },
  positionals,
} = parseArgs({
  args: process.argv.slice(ARGS_SLICE),
  options: {
    format: { type: 'boolean', alias: 'f' },
  },
  allowPositionals: true,
});

const [openapiPath, destinationPath] = positionals;

const ESLINT_DISABLE = '/* eslint-disable */\n';

const ast = await openapiTS(await fs.readFile(openapiPath, 'utf-8'), { exportType: true });

let content = ESLINT_DISABLE + astToString(ast);

if (shouldFormat === true) {
  const prettierOptions = await resolveConfig('./src/index.ts');

  content = await format(content, { ...prettierOptions, parser: 'typescript' });
}

await fs.writeFile(destinationPath, content);

console.log('Types generated successfully');
