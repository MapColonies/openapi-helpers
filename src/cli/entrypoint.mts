#!/usr/bin/env node
import { Command } from 'commander';
import { generateTypes } from '../generator/generateTypes.mjs';
import { generateErrors } from '../generator/generateErrors.mjs';
import { SchemaObject, TransformNodeOptions, TransformObject } from 'openapi-typescript';
import { TypeNode } from 'typescript';

const program = new Command();

program.name('openapi-helpers').description('Generate TypeScript types and error classes from OpenAPI specifications').version('3.1.0');

program
  .command('types')
  .description('Generate TypeScript types from OpenAPI spec')
  .argument('<openapiPath>', 'Path to the OpenAPI specification file')
  .argument('<destinationPath>', 'Path where the generated types will be saved')
  .option('-f, --format', 'Format the generated code using Prettier')
  .option('-t, --add-typed-request-handler', 'Add typed request handler types to the generated output')
  .option('-i, --inject', 'Inject additional code into the generated output')
  .option('-tm, --transform', 'Add transformation to the generated output')
  .action(
    async (
      openapiPath: string,
      destinationPath: string,
      options: {
        format?: boolean;
        addTypedRequestHandler?: boolean;
        inject?: string;
        transform?: (schemaObject: SchemaObject, metadata: TransformNodeOptions) => TypeNode | TransformObject | undefined;
      }
    ) => {
      try {
        await generateTypes(
          openapiPath,
          destinationPath,
          options.format === true,
          options.addTypedRequestHandler === true,
          options.inject,
          options.transform
        );
        console.log('Types generated successfully');
      } catch (error) {
        console.error('Error generating types:', error);
        process.exit(1);
      }
    }
  );

program
  .command('errors')
  .description('Generate error classes from OpenAPI spec')
  .argument('<openapiPath>', 'Path to the OpenAPI specification file')
  .argument('<destinationPath>', 'Path where the generated error classes will be saved')
  .option('-f, --format', 'Format the generated code using Prettier')
  .action(async (openapiPath: string, destinationPath: string, options: { format?: boolean }) => {
    try {
      await generateErrors(openapiPath, destinationPath, options.format === true);
      console.log('Errors generated successfully');
    } catch (error) {
      console.error('Error generating errors:', error);
      process.exit(1);
    }
  });

// Add examples to the help
program.addHelpText(
  'after',
  `
Examples:
  $ openapi-helpers types api.yaml types.ts
  $ openapi-helpers errors api.yaml errors.ts --format
  $ openapi-helpers types api.yaml types.ts --add-typed-request-handler --format
  $ openapi-helpers --help
  $ openapi-helpers types --help
`
);

program.parse();
