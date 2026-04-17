import draftContentTemplate from "./assets/draft_content_template.json";
import draftMetaTemplate from "./assets/draft_meta_info.json";

export type JsonObject = Record<string, unknown>;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createDraftContentTemplate(): JsonObject {
  return deepClone(draftContentTemplate as JsonObject);
}

export function createDraftMetaTemplate(): JsonObject {
  return deepClone(draftMetaTemplate as JsonObject);
}
