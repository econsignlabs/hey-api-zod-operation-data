import { definePluginConfig } from "@hey-api/openapi-ts";

import { handler } from "./plugin.js";
import type { ZodOperationDataPlugin } from "./types.js";

export const defaultConfig: ZodOperationDataPlugin["Config"] = {
  config: {
    includeInEntry: false,
  },
  dependencies: ["@hey-api/typescript", "zod"],
  handler,
  name: "zod-operation-data",
  symbolMeta() {
    return { artifact: "zod-operation-data" };
  },
};

export const defineConfig = definePluginConfig(defaultConfig);
