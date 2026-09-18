# @econsignlabs/hey-api-zod-operation-data

A [HeyAPI](https://heyapi.dev/) plugin that composes operation descriptors with Zod schemas for server route handlers.

HeyAPI's Zod plugin generates separate schemas for request bodies, headers, path parameters, query parameters, and responses. This plugin references those generated symbols and emits one `*Data` descriptor per OpenAPI operation:

```ts
export const zPostWidgetData = {
  operationId: "postWidget" as const,
  permissions: ["widgets:write"] as const,
  body: zPostWidgetBody,
  path: zPostWidgetPath,
  query: zPostWidgetQuery,
  response: zPostWidgetResponse,
  responses: z.custom<PostWidgetResponses & PostWidgetErrors>(),
};
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

const routeDescriptor = zPostWidgetData;
```

Every descriptor includes a literal `operationId` and a readonly `permissions` array derived from `x-permissions` (sorted, defaulting to `[]`). Request and response fields remain Zod schemas. The generated `permissions.gen.ts` module remains available for existing consumers.

The generated object can also include:

- `body`
- `headers`
- `path`
- `query`
- `response`
- `responses`, a type-only Zod schema containing the operation's status-indexed success and error contracts

Only request and response fields available for an operation are emitted.

### Migration

`z*Data` exports are now plain objects rather than `z.object()` schemas. Pass `zPostWidgetData` directly instead of `zPostWidgetData.shape`. Read `operationId` directly instead of `operationId.value`, and pass `permissions` directly to authorization middleware. For runtime request validation, use the individual body, headers, path, or query schemas; metadata is not request data. Route wrappers that expect Zod metadata must update their input types to accept a string operation ID and `readonly string[]` permissions.

## Why the existing Zod file?

The plugin registers its declarations through HeyAPI's Zod plugin instance, so HeyAPI writes them alongside its body, path, query, and response schemas. Existing imports from `zod.gen.ts` continue to work without a restore script or a second generated module.

## Development

```bash
npm install
npm run check
```

The test suite runs HeyAPI against a fixture OpenAPI document and asserts that the operation descriptors are included in `zod.gen.ts`.

## Compatibility

HeyAPI documents its custom plugin API as under development. This package therefore pins support to the tested HeyAPI minor line. New HeyAPI releases will be added after their generated output and plugin API pass the integration suite.

## License

MIT
