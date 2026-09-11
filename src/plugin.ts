import { $, toCase } from "@hey-api/openapi-ts";

import type { ZodOperationDataPlugin } from "./types.js";

const requestLayers = ["body", "headers", "path", "query"] as const;

type OperationWithPermissions = {
  "x-permissions"?: string | ReadonlyArray<string>;
};

const getPermissions = (operation: OperationWithPermissions) => {
  const permissions = operation["x-permissions"];

  if (typeof permissions === "string") {
    return permissions.trim() ? permissions.trim().split(/\s+/) : [];
  }

  if (!Array.isArray(permissions)) return [];

  return permissions.filter((permission) => typeof permission === "string");
};

export const handler: ZodOperationDataPlugin["Handler"] = ({ plugin }) => {
  const zodPlugin = plugin.getPluginOrThrow("zod");

  plugin.forEach("operation", ({ operation }) => {
    const permissions = getPermissions(
      operation as unknown as OperationWithPermissions,
    );

    const shape = $.object();

    if (permissions.length) {
      shape.prop(
        "permissions",
        $(zodPlugin.imports.z)
          .attr("array")
          .call(
            $(zodPlugin.imports.z)
              .attr("enum")
              .call($.array(...permissions)),
          ),
      );
    }

    for (const layer of requestLayers) {
      const schema = plugin.querySymbol({
        artifact: "zod",
        category: "schema",
        resource: "operation",
        resourceId: operation.id,
        role: `request-${layer}`,
      });
      if (schema) shape.prop(layer, schema);
    }

    const responseSchema = plugin.querySymbol({
      artifact: "zod",
      category: "schema",
      resource: "operation",
      resourceId: operation.id,
      role: "responses",
    });
    if (responseSchema) shape.prop("response", responseSchema);

    const responseTypes = ["responses", "errors"]
      .map((role) =>
        plugin.querySymbol({
          artifact: "types",
          category: "type",
          resource: "operation",
          resourceId: operation.id,
          role,
        }),
      )
      .filter((symbol) => symbol !== undefined);

    if (responseTypes.length) {
      shape.prop(
        "responses",
        $(zodPlugin.imports.z)
          .attr("custom")
          .call()
          .generic($.type.and(...responseTypes)),
      );
    }

    if (shape.isEmpty) return;

    const symbol = zodPlugin.symbol(
      `z${toCase(operation.id, "PascalCase")}Data`,
      {
        meta: {
          category: "schema",
          resource: "operation",
          resourceId: operation.id,
          role: "data",
        },
      },
    );

    zodPlugin.node(
      $.const(symbol)
        .export()
        .assign($(zodPlugin.imports.z).attr("object").call(shape)),
    );
  });
};
