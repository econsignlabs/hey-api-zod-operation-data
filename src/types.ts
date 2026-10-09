import type { DefinePlugin, Plugin } from "@hey-api/openapi-ts";

export type UserConfig = Plugin.Name<"zod-operation-data"> &
  Plugin.Hooks &
  Plugin.UserExports & {
    /**
     * If true, requires every operation to declare `x-permissions`.
     * Missing or invalid `x-permissions` will throw an error.
     *
     * @default false
     */
    requirePermissions?: boolean;
    /**
     * OpenAPI operation extension fields to emit in `operationMetadata`.
     * Use the full extension name, such as `x-enterprise`.
     *
     * @default []
     */
    metadataFields?: string[];
  };

export type Config = Plugin.Name<"zod-operation-data"> &
  Plugin.Hooks &
  Plugin.Exports & {
    requirePermissions: boolean;
    metadataFields: string[];
  };

export type ZodOperationDataPlugin = DefinePlugin<
  UserConfig,
  Config,
  never,
  never
>;

declare module "@hey-api/shared" {
  interface PluginConfigMap {
    "zod-operation-data": ZodOperationDataPlugin;
  }
}
