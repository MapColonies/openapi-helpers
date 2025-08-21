#!/usr/bin/env node
import { setTimeout as sleep } from 'node:timers/promises';
import { program } from '@commander-js/extra-typings';
import { generateTypes } from '../generator/generateTypes.mjs';
import { generateErrors } from '../generator/generateErrors.mjs';
import ora from 'ora';

const SECOND = 1000;
program.name('openapi-helpers').description('Generate TypeScript types and error classes from OpenAPI specifications').version('3.1.0');

const command = program.command('generate').description('Generate code artifacts (types, error classes) from OpenAPI specifications');

command
  .command('types')
  .description('Generate TypeScript types from OpenAPI spec')
  .argument('<openapiPath>', 'Path to the OpenAPI specification file')
  .argument('<destinationPath>', 'Path where the generated types will be saved')
  .option('-f, --format', 'Format the generated code using Prettier')
  .option('-t, --add-typed-request-handler', 'Add typed request handler types to the generated output')
  .action(
    async (
      openapiPath: string,
      destinationPath: string,
      options: {
        format?: boolean;
        addTypedRequestHandler?: boolean;
      }
    ) => {
      try {
        const spinner = ora('Generating types').start();
        await generateTypes(openapiPath, destinationPath, options.format === true, options.addTypedRequestHandler === true);
        await sleep(SECOND);
        spinner.stop();
        console.log('Types generated successfully');
      } catch (error) {
        console.error('Error generating types:', error);
        process.exit(1);
      }
    }
  );

command
  .command('errors')
  .description('Generate error classes from OpenAPI spec')
  .argument('<openapiPath>', 'Path to the OpenAPI specification file')
  .argument('<destinationPath>', 'Path where the generated error classes will be saved')
  .option('-f, --format', 'Format the generated code using Prettier')
  .option('-m, --no-mapping', 'Disable the generation of error code mappings')
  .option('-e, --no-error-classes', 'Disable the generation of error classes')
  .action(async (openapiPath: string, destinationPath: string, options) => {
    try {
      const spinner = ora('Generating errors').start();
      await generateErrors(openapiPath, destinationPath, options.format === true, options.mapping, options.errorClasses);
      await sleep(SECOND);
      spinner.stop();
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
  $ openapi-helpers generate types api.yaml types.ts
  $ openapi-helpers generate types api.yaml types.ts --format
  $ openapi-helpers generate types api.yaml types.ts --add-typed-request-handler
  $ openapi-helpers generate types api.yaml types.ts --add-typed-request-handler --format
  $ openapi-helpers generate errors api.yaml errors.ts
  $ openapi-helpers generate errors api.yaml errors.ts --format
  $ openapi-helpers generate errors api.yaml errors.ts --no-mapping
  $ openapi-helpers generate errors api.yaml errors.ts --no-error-classes
  $ openapi-helpers generate errors api.yaml errors.ts --no-mapping --no-error-classes
  $ openapi-helpers --help
  $ openapi-helpers generate --help
  $ openapi-helpers generate types --help
  $ openapi-helpers generate errors --help
`
);

program.parse();
