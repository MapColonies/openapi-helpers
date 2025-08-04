import fs from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { dereference } from '@apidevtools/json-schema-ref-parser';
import { format, resolveConfig } from 'prettier';
import * as changeCase from 'change-case';
import type { OpenAPI3, OperationObject, ResponseObject, SchemaObject } from 'openapi-typescript';

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

if (openapiPath === undefined || destinationPath === undefined) {
  console.error('Usage: generateErrors <openapiPath> <destinationPath>');
  process.exit(1);
}

const openapi = await dereference<OpenAPI3>(openapiPath);

if (openapi.paths === undefined) {
  console.error('No paths found in the OpenAPI document.');
  process.exit(1);
}

const errorCodes = new Set<string>();

function extractCodeFromSchema(schema: SchemaObject): void {
  // Handle direct code property
  if (schema.type === 'object' && schema.properties?.code) {
    const codeProperty = schema.properties.code as SchemaObject;

    // Handle enum values
    if (codeProperty.enum) {
      codeProperty.enum.map(String).forEach((code) => {
        errorCodes.add(code);
      });
    }
  }

  // Handle allOf combinations
  if (schema.allOf) {
    for (const subSchema of schema.allOf) {
      extractCodeFromSchema(subSchema as SchemaObject);
    }
  }

  // Handle oneOf combinations
  if (schema.oneOf) {
    for (const subSchema of schema.oneOf) {
      extractCodeFromSchema(subSchema as SchemaObject);
    }
  }

  // Handle anyOf combinations
  if (schema.anyOf) {
    for (const subSchema of schema.anyOf) {
      extractCodeFromSchema(subSchema as SchemaObject);
    }
  }
}

function createError(code: string): string {
  let className = changeCase.pascalCase(code);

  if (!className.endsWith('Error')) {
    className += 'Error';
  }

  return `export class ${className} extends Error {
  public readonly code = '${code}';
  /**
   * Creates an instance of ${className}.
   * @param message - The error message.
   * @param cause - Optional original error or server response data.
   */
  public constructor(message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
  }
};\n`;
}

for (const [, methods] of Object.entries(openapi.paths)) {
  for (const [key, operation] of Object.entries(methods) as [string, OperationObject][]) {
    if (['servers', 'parameters'].includes(key)) {
      continue;
    }

    for (const [statusCode, response] of Object.entries(operation.responses ?? {}) as [string, ResponseObject][]) {
      if (statusCode.startsWith('2') || statusCode.startsWith('3')) {
        continue; // Skip successful and redirection responses
      }

      const schema = response.content?.['application/json']?.schema as SchemaObject | undefined;
      if (schema) {
        extractCodeFromSchema(schema);
      }
    }
  }
}

if (errorCodes.size === 0) {
  console.warn('No error codes found in the OpenAPI document.');
  process.exit(0);
}

let errorFile = errorCodes.values().map(createError).toArray().join('\n');

if (shouldFormat === true) {
  const prettierOptions = await resolveConfig('./src/index.ts');

  errorFile = await format(errorFile, { ...prettierOptions, parser: 'typescript' });
}

await fs.writeFile(destinationPath, errorFile);
