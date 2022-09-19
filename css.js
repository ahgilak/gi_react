import { toKebabCase } from "https://deno.land/x/deno_gi/src/utils/string.ts";

function parseValue(value){
    if (typeof value === "number") return value + "px";
    if (value === null) return "none";
    return value;
}

export function parseStyle(object) {
  return [
    "* {",
    ...Object.entries(object)
      .map(([key, value]) => `${toKebabCase(key)}: ${parseValue(value)};`),
    "}",
  ].join("\n");
}
