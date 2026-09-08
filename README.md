# @econsignlabs/hey-api-zod-operation-data

A [HeyAPI](https://heyapi.dev/) plugin that composes operation-level Zod schemas for server route handlers.

HeyAPI's Zod plugin generates separate schemas for request bodies, headers, path parameters, query parameters, and responses. This plugin references those generated symbols and emits one `*Data` schema per OpenAPI operation:

```ts
export const zPostWidgetData = z.object({
  body: zPostWidgetBody,
  path: zPostWidgetPath,
  query: zPostWidgetQuery,
  response: zPostWidgetResponse,
  responses: z.custom<PostWidgetResponses & PostWidgetErrors>(),
});
```

The plugin uses HeyAPI's public plugin and TypeScript DSL APIs. It contributes nodes to the Zod plugin's output during generation; it does not parse or post-process generated files.

## Installation

```bash
npm install --save-dev @econsignlabs/hey-api-zod-operation-data
```

The initial release supports HeyAPI 0.99 and Zod 4.

## Usage

Add the plugin after configuring HeyAPI's Zod plugin:

```ts
import { defineConfig as defineOperationData } from "@econsignlabs/hey-api-zod-operation-data";
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.json",
  output: "./generated/api",
  plugins: [
    "@hey-api/typescript",
    {
      name: "zod",
      requests: { shouldExtract: true },
      responses: true,
    },
    defineOperationData(),
  ],
});
```

The generated schemas are added to HeyAPI's existing `zod.gen.ts` file:

```ts
import { zPostWidgetData } from "./generated/api/zod.gen";

const routeSchema = zPostWidgetData.shape;
```

The generated object can include:

- `body`
- `headers`
- `path`
- `query`
- `response`
- `responses`, a type-only Zod schema containing the operation's status-indexed success and error contracts

Only fields available for an operation are emitted.

## Why the existing Zod file?

The plugin registers its declarations through HeyAPI's Zod plugin instance, so HeyAPI writes them alongside its body, path, query, and response schemas. Existing imports from `zod.gen.ts` continue to work without a restore script or a second generated module.

## Development

```bash
npm install
npm run check
```

The test suite runs HeyAPI against a fixture OpenAPI document and asserts that the operation schemas are included in `zod.gen.ts`.

## Compatibility

HeyAPI documents its custom plugin API as under development. This package therefore pins support to the tested HeyAPI minor line. New HeyAPI releases will be added after their generated output and plugin API pass the integration suite.

## License

MIT
