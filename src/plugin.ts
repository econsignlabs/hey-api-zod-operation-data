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
  const operationPermissionsMap: Record<string, string[]> = {};

  plugin.forEach("operation", ({ operation }) => {
    const rawPermissions = (operation as unknown as OperationWithPermissions)[
      "x-permissions"
    ];

    if (plugin.config.requirePermissions && rawPermissions === undefined) {
      throw new Error(
        `Operation "${operation.id}" is missing required "x-permissions". Use an explicit empty array [] if no permissions are required.`,
      );
    }

    if (rawPermissions !== undefined) {
      if (
        typeof rawPermissions !== "string" &&
        !Array.isArray(rawPermissions)
      ) {
        throw new Error(
          `Operation "${operation.id}" has invalid "x-permissions": expected string[] or string, got ${typeof rawPermissions}.`,
        );
      }
      if (Array.isArray(rawPermissions)) {
        for (const perm of rawPermissions) {
          if (typeof perm !== "string") {
            throw new Error(
              `Operation "${operation.id}" has invalid permission item in "x-permissions": expected string, got ${typeof perm}.`,
            );
          }
        }
      }
    }

    const permissions = getPermissions(
      operation as unknown as OperationWithPermissions,
    );
    const sortedPermissions = [...permissions].sort();
    operationPermissionsMap[operation.id] = sortedPermissions;

    const shape = $.object();

    shape.prop("operationId", $($.literal(operation.id)).as("const"));
    shape.prop("permissions", $($.array(...sortedPermissions)).as("const"));

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

    zodPlugin.node($.const(symbol).export().assign(shape));
  });

  const sortedOpIds = Object.keys(operationPermissionsMap).sort();
  const sortedMap: Record<string, readonly string[]> = {};
  for (const opId of sortedOpIds) {
    sortedMap[opId] = operationPermissionsMap[opId]!;
  }

  const opPermsSymbol = plugin.symbol("operationPermissions", {
    getFilePath: () => "permissions",
  });
  plugin.node(
    $.const(opPermsSymbol)
      .export()
      .assign($($.fromValue(sortedMap, { layout: "pretty" })).as("const")),
  );

  const typeOpPermsSymbol = plugin.symbol("OperationPermissions", {
    getFilePath: () => "permissions",
  });
  plugin.node(
    $.type
      .alias(typeOpPermsSymbol)
      .export()
      .type($.type(opPermsSymbol).typeofType()),
  );

  const typeOpIdSymbol = plugin.symbol("OperationId", {
    getFilePath: () => "permissions",
  });
  plugin.node(
    $.type
      .alias(typeOpIdSymbol)
      .export()
      .type($.type(typeOpPermsSymbol).keyof()),
  );

  const typePermSymbol = plugin.symbol("Permission", {
    getFilePath: () => "permissions",
  });
  plugin.node(
    $.type
      .alias(typePermSymbol)
      .export()
      .type(
        $.type(typeOpPermsSymbol)
          .idx($.type(typeOpIdSymbol))
          .idx($.type("number")),
      ),
  );
};
