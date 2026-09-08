import type { DefinePlugin, Plugin } from "@hey-api/openapi-ts";

export type UserConfig = Plugin.Name<"zod-operation-data"> &
  Plugin.Hooks &
  Plugin.UserExports;

export type Config = Plugin.Name<"zod-operation-data"> &
  Plugin.Hooks &
  Plugin.Exports;

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
