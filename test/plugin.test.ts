import { readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@hey-api/openapi-ts";
import { afterEach, describe, expect, it } from "vitest";

import { defineConfig } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, "generated");

afterEach(() => rm(output, { force: true, recursive: true }));

describe("zod-operation-data", () => {
  it("generates a combined operation schema and permissions module", async () => {
    await createClient({
      input: resolve(here, "fixtures/openapi.json"),
      logs: { level: "silent" },
      output,
      plugins: [
        "@hey-api/typescript",
        {
          name: "zod",
          requests: { shouldExtract: true },
          responses: true,
        },
        defineConfig({ requirePermissions: true }),
      ],
    });

    const generated = await readFile(resolve(output, "zod.gen.ts"), "utf8");
    expect(generated).toContain("export const zPostWidgetData = z.object({");
    expect(generated).toContain("operationId: z.literal('postWidget')");
    expect(generated).toContain("body: zPostWidgetBody");
    expect(generated).toContain("path: zPostWidgetPath");
    expect(generated).toContain("query: zPostWidgetQuery");
    expect(generated).toContain("response: zPostWidgetResponse");
    expect(generated).toContain(
      "responses: z.custom<PostWidgetResponses & PostWidgetErrors>()",
    );
    expect(generated).toContain(
      "permissions: z.array(z.enum(['shipments:read', 'users:write']))",
    );

    const permissionsGen = await readFile(
      resolve(output, "permissions.gen.ts"),
      "utf8",
    );
    expect(permissionsGen).toContain("export const operationPermissions = {");
    expect(permissionsGen).toContain("postWidget: [");
    expect(permissionsGen).toContain("'shipments:read'");
    expect(permissionsGen).toContain("'users:write'");
    expect(permissionsGen).toContain(
      "export type OperationPermissions = typeof operationPermissions;",
    );
    expect(permissionsGen).toContain(
      "export type OperationId = keyof OperationPermissions;",
    );
    expect(permissionsGen).toContain(
      "export type Permission = OperationPermissions[OperationId][number];",
    );
  });

  it("throws when requirePermissions is enabled and x-permissions is missing", async () => {
    const invalidSpec = {
      openapi: "3.1.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };
    const invalidSpecPath = resolve(here, "fixtures/missing-permissions.json");
    await writeFile(invalidSpecPath, JSON.stringify(invalidSpec), "utf8");

    let caughtError: unknown;
    try {
      await createClient({
        input: invalidSpecPath,
        logs: { level: "silent" },
        output,
        plugins: [
          "@hey-api/typescript",
          { name: "zod" },
          defineConfig({ requirePermissions: true }),
        ],
      });
    } catch (err: unknown) {
      const anyErr = err as { originalError?: { error?: Error } };
      caughtError = anyErr?.originalError?.error ?? err;
    } finally {
      await rm(invalidSpecPath, { force: true });
    }
    expect((caughtError as Error)?.message).toMatch(
      /missing required "x-permissions"/,
    );
  });
});
