import { DefinePlugin, Plugin } from "@hey-api/openapi-ts";
import * as _hey_api_shared0 from "@hey-api/shared";

type UserConfig = Plugin.Name<"zod-operation-data"> & Plugin.Hooks & Plugin.UserExports & {
  requirePermissions?: boolean;
  metadataFields?: string[];
};
type Config = Plugin.Name<"zod-operation-data"> & Plugin.Hooks & Plugin.Exports & {
  requirePermissions: boolean;
  metadataFields: string[];
};
type ZodOperationDataPlugin = DefinePlugin<UserConfig, Config, never, never>;

declare module "@hey-api/shared" {
  interface PluginConfigMap {
    "zod-operation-data": ZodOperationDataPlugin;
  }
}

declare const defaultConfig: ZodOperationDataPlugin["Config"];
declare const defineConfig: (userConfig?: Omit<UserConfig, "name"> | undefined) => {
  config: _hey_api_shared0.ConfigTable<Omit<UserConfig, "name">, Config>;
  name: any;
  api?: { [x: string]: unknown } | undefined;
  dependencies?: ReadonlyArray<_hey_api_shared0.AnyPluginName>;
  handler: (args: {
    plugin: _hey_api_shared0.PluginInstance<_hey_api_shared0.Plugin.Types<UserConfig, Config, never, never>>;
  }) => void;
  imports?: ((plugin: _hey_api_shared0.PluginInstance<_hey_api_shared0.Plugin.Types<UserConfig, Config, never, never>>) => never) | undefined;
  symbolMeta?: (symbol: Omit<log, "name">) => log;
  tags?: ReadonlyArray<_hey_api_shared0.PluginTag>;
};

export { type Config, type UserConfig, type ZodOperationDataPlugin, defaultConfig, defineConfig };
