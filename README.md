# openapi-helpers
This package contains scripts, types and functions to help you work with openapi.


## Installation
Run the following commands:

```bash
npm install --save-dev @map-colonies/openapi-helpers supertest prettier openapi-typescript @types/express
```

## types-generator
The package contains a script that wraps the `openapi-typescript` package and generates types for the openapi schema. The script also formats the generated types using `prettier`.

The command structure is as follows:
```bash
npx @map-colonies/openapi-helpers <input-file> <output-file> --format
```

For example:
```bash
npx @map-colonies/openapi-helpers ./openapi3.yaml ./src/openapi.d.ts --format
```

## RequestSender
The package contains a wrapper for the `supertest` package that provides autocomplete for all the requests to the API based on the openapi. The requestSender is initialized with the server's base url and the openapi schema and the types exported by `openapi-typescript`.

```typescript
import { RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { paths, operations } from './src/openapi.d.ts';

const requestSender = await createRequestSender<paths, operations>('path/to/openapi3.yaml', expressApp);
```

The requestSender object contains all the paths and operations defined in the openapi schema. For example, to send a request to the `getUsers` operation with the `/users` path and with the `GET` method, you can use the following code:

```typescript
const response = await requestSender.getUsers();

// or

const response = await requestSender.sendRequest({ 
  method: 'get', 
  path: '/simple-request'
});
```

The package supports all the operations defined in the openapi schema, either by operation name, or by using the `sendRequest` function with the method, path and parameters.


> [!IMPORTANT]
> For the package function properly, you need to make sure that the following values are configured in your  `tsconfig.json` or `jsconfig.json` files under compilerOptions:
> - module: "NodeNext"
> - moduleResolution: "NodeNext"


