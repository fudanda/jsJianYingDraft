import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createDraftMetaTemplate } from "./assets.js";
import { ScriptFile } from "./script-file.js";

export interface CreateDraftOptions {
  fps?: number;
  maintrackAdsorb?: boolean;
  allowReplace?: boolean;
}

export class DraftFolder {
  readonly folderPath: string;

  constructor(folderPath: string) {
    this.folderPath = resolve(folderPath);
    if (!existsSync(this.folderPath)) {
      throw new Error(`Root folder "${this.folderPath}" does not exist`);
    }
  }

  listDrafts(): string[] {
    return readdirSync(this.folderPath).filter((name) => {
      const full = join(this.folderPath, name);
      return statSync(full).isDirectory();
    });
  }

  /** @deprecated Use listDrafts instead. */
  list_drafts(): string[] {
    return this.listDrafts();
  }

  hasDraft(draftName: string): boolean {
    return this.listDrafts().includes(draftName);
  }

  /** @deprecated Use hasDraft instead. */
  has_draft(draftName: string): boolean {
    return this.hasDraft(draftName);
  }

  remove(draftName: string): void {
    const draftPath = join(this.folderPath, draftName);
    if (!existsSync(draftPath)) {
      throw new Error(`Draft folder "${draftName}" does not exist`);
    }
    rmSync(draftPath, { recursive: true, force: true });
  }

  /** @deprecated Use remove instead. */
  remove_draft(draftName: string): void {
    this.remove(draftName);
  }

  createDraft(draftName: string, width: number, height: number, options: CreateDraftOptions = {}): ScriptFile {
    const draftPath = join(this.folderPath, draftName);
    const allowReplace = options.allowReplace ?? false;

    if (existsSync(draftPath)) {
      if (!allowReplace) {
        throw new Error(`Draft folder "${draftName}" already exists and allowReplace=false`);
      }
      rmSync(draftPath, { recursive: true, force: true });
    }

    mkdirSync(draftPath, { recursive: true });

    const meta = createDraftMetaTemplate();
    (meta as Record<string, unknown>).draft_name = draftName;
    (meta as Record<string, unknown>).draft_root_path = draftPath;
    writeFileSync(join(draftPath, "draft_meta_info.json"), JSON.stringify(meta, null, 2), "utf8");

    const script = new ScriptFile(width, height, options.fps ?? 30, options.maintrackAdsorb ?? true);
    script.savePath = join(draftPath, "draft_content.json");
    return script;
  }

  /** @deprecated Use createDraft instead. */
  create_draft(draftName: string, width: number, height: number, options: CreateDraftOptions = {}): ScriptFile {
    return this.createDraft(draftName, width, height, options);
  }

  loadTemplate(draftName: string): ScriptFile {
    const draftPath = join(this.folderPath, draftName);
    if (!existsSync(draftPath)) {
      throw new Error(`Draft folder "${draftName}" does not exist`);
    }
    return ScriptFile.loadTemplate(join(draftPath, "draft_content.json"));
  }

  /** @deprecated Use loadTemplate instead. */
  load_template(draftName: string): ScriptFile {
    return this.loadTemplate(draftName);
  }

  duplicateAsTemplate(templateName: string, newDraftName: string, allowReplace = false): ScriptFile {
    const templatePath = join(this.folderPath, templateName);
    const newDraftPath = join(this.folderPath, newDraftName);

    if (!existsSync(templatePath)) {
      throw new Error(`Template draft "${templateName}" does not exist`);
    }

    if (existsSync(newDraftPath) && !allowReplace) {
      throw new Error(`Draft "${newDraftName}" already exists and allowReplace=false`);
    }

    cpSync(templatePath, newDraftPath, { recursive: true, force: allowReplace });
    return this.loadTemplate(newDraftName);
  }

  /** @deprecated Use duplicateAsTemplate instead. */
  duplicate_as_template(templateName: string, newDraftName: string, allowReplace = false): ScriptFile {
    return this.duplicateAsTemplate(templateName, newDraftName, allowReplace);
  }

  inspectMaterial(draftName: string): void {
    this.loadTemplate(draftName).inspectMaterial();
  }

  /** @deprecated Use inspectMaterial instead. */
  inspect_material(draftName: string): void {
    this.inspectMaterial(draftName);
  }

  readDraftJson(draftName: string): string {
    const filePath = join(this.folderPath, draftName, "draft_content.json");
    return readFileSync(filePath, "utf8");
  }

  /** @deprecated Use readDraftJson instead. */
  read_draft_json(draftName: string): string {
    return this.readDraftJson(draftName);
  }
}
