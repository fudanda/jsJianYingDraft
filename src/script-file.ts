import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { createDraftContentTemplate, JsonObject } from "./assets.js";
import {
  AmbiguousMaterialError,
  AmbiguousTrackError,
  MaterialNotFoundError,
  TrackNotFoundError
} from "./errors.js";
import { AudioMaterial, VideoMaterial } from "./materials.js";
import { FilterPresetInput, VideoEffectPresetInput } from "./metadata-lite.js";
import {
  AudioEffect,
  BackgroundFilling,
  AudioFade,
  AudioSegment,
  EffectMeta,
  EffectSegment,
  Filter,
  FilterSegment,
  Mask,
  MixMode,
  SegmentAnimations,
  Speed,
  StickerSegment,
  TextSegment,
  TextStyle,
  TextBubble,
  TextEffect,
  Transition,
  VideoEffect,
  VideoEffectType,
  VideoSegment
} from "./segment.js";
import {
  EditableTrack,
  ExtendMode,
  importTrack as parseImportedTrack,
  ImportedTrack,
  ImportedMediaTrack,
  ImportedTextTrack,
  ShrinkMode
} from "./template-mode.js";
import { TRACK_META, Track, TrackType } from "./track.js";
import { srtTstamp, tim, Timerange } from "./time.js";

type JsonArrayMap = Record<string, unknown[]>;

interface MaterialStore {
  audios: AudioMaterial[];
  videos: VideoMaterial[];
  stickers: Record<string, unknown>[];
  texts: Record<string, unknown>[];
  audioEffects: AudioEffect[];
  audioFades: AudioFade[];
  animations: SegmentAnimations[];
  videoEffects: VideoEffect[];
  speeds: Speed[];
  masks: Mask[];
  transitions: Transition[];
  filters: Array<Filter | TextBubble | TextEffect>;
  mixModes: MixMode[];
  canvases: BackgroundFilling[];
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createMaterialStore(): MaterialStore {
  return {
    audios: [],
    videos: [],
    stickers: [],
    texts: [],
    audioEffects: [],
    audioFades: [],
    animations: [],
    videoEffects: [],
    speeds: [],
    masks: [],
    transitions: [],
    filters: [],
    mixModes: [],
    canvases: []
  };
}

function createEmptyMaterialJson(): JsonArrayMap {
  return {
    ai_translates: [],
    audio_balances: [],
    audio_effects: [],
    audio_fades: [],
    audio_track_indexes: [],
    audios: [],
    beats: [],
    canvases: [],
    chromas: [],
    color_curves: [],
    digital_humans: [],
    drafts: [],
    effects: [],
    flowers: [],
    green_screens: [],
    handwrites: [],
    hsl: [],
    images: [],
    log_color_wheels: [],
    loudnesses: [],
    manual_deformations: [],
    masks: [],
    material_animations: [],
    material_colors: [],
    multi_language_refs: [],
    placeholders: [],
    plugin_effects: [],
    primary_color_wheels: [],
    realtime_denoises: [],
    shapes: [],
    smart_crops: [],
    smart_relights: [],
    sound_channel_mappings: [],
    speeds: [],
    stickers: [],
    tail_leaders: [],
    text_templates: [],
    texts: [],
    time_marks: [],
    transitions: [],
    video_effects: [],
    video_trackings: [],
    videos: [],
    vocal_beautifys: [],
    vocal_separations: []
  };
}

export interface AddTrackOptions {
  mute?: boolean;
  relativeIndex?: number;
  absoluteIndex?: number;
}

export interface ImportSrtOptions {
  timeOffset?: string | number;
  textStyle?: TextStyle;
}

export interface ImportTrackOptions {
  offset?: string | number;
  newName?: string;
  relativeIndex?: number;
}

export interface ReplaceMaterialBySegOptions {
  sourceTimerange?: Timerange;
  handleShrink?: ShrinkMode;
  handleExtend?: ExtendMode | ExtendMode[];
}

export interface AddEffectOptions {
  params?: Array<number | null>;
  effectType?: VideoEffectType;
}

export class ScriptFile {
  savePath: string | null;
  content: JsonObject;
  width: number;
  height: number;
  fps: number;
  duration: number;
  maintrackAdsorb: boolean;
  materials: MaterialStore;
  tracks: Map<string, Track>;
  importedMaterials: JsonArrayMap;
  importedTracks: ImportedTrack[];

  constructor(width: number, height: number, fps = 30, maintrackAdsorb = true) {
    this.savePath = null;
    this.content = createDraftContentTemplate();
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.duration = 0;
    this.maintrackAdsorb = maintrackAdsorb;
    this.materials = createMaterialStore();
    this.tracks = new Map();
    this.importedMaterials = {};
    this.importedTracks = [];
  }

  static loadTemplate(jsonPath: string): ScriptFile {
    const raw = readFileSync(jsonPath, "utf8");
    const content = JSON.parse(raw) as Record<string, unknown>;

    const canvas = (content.canvas_config ?? {}) as Record<string, unknown>;
    const config = (content.config ?? {}) as Record<string, unknown>;

    const script = new ScriptFile(
      Number(canvas.width ?? 1920),
      Number(canvas.height ?? 1080),
      Number(content.fps ?? 30),
      Boolean(config.maintrack_adsorb ?? true)
    );

    script.savePath = jsonPath;
    script.content = deepClone(content);
    script.duration = Number(content.duration ?? 0);
    script.importedMaterials = deepClone((content.materials ?? {}) as JsonArrayMap);
    script.importedTracks = deepClone((content.tracks ?? []) as Record<string, unknown>[]).map((track) =>
      parseImportedTrack(track)
    );

    return script;
  }

  /** @deprecated Use loadTemplate instead. */
  static load_template(jsonPath: string): ScriptFile {
    return ScriptFile.loadTemplate(jsonPath);
  }

  addMaterial(material: VideoMaterial | AudioMaterial): this {
    if (material instanceof VideoMaterial) {
      if (!this.materials.videos.some((item) => item.materialId === material.materialId)) {
        this.materials.videos.push(material);
      }
      return this;
    }

    if (!this.materials.audios.some((item) => item.materialId === material.materialId)) {
      this.materials.audios.push(material);
    }
    return this;
  }

  addTrack(trackType: TrackType, trackName?: string, options: AddTrackOptions = {}): this {
    const sameTypeTracks = [...this.tracks.values()].filter((track) => track.trackType === trackType);
    if (trackName === undefined) {
      if (sameTypeTracks.length > 0) {
        throw new Error(`Track type "${trackType}" already exists. Please specify trackName.`);
      }
      trackName = trackType;
    }

    if (this.tracks.has(trackName)) {
      throw new Error(`Track "${trackName}" already exists`);
    }

    const relativeIndex = options.relativeIndex ?? 0;
    const renderIndex = options.absoluteIndex ?? (TRACK_META[trackType].renderIndex + relativeIndex);

    this.tracks.set(trackName, new Track(trackType, trackName, renderIndex, options.mute ?? false));
    return this;
  }

  private getTrackBySegment(segmentTrackType: TrackType, trackName?: string): Track {
    if (trackName) {
      const namedTrack = this.tracks.get(trackName);
      if (!namedTrack) {
        throw new TrackNotFoundError(`Track "${trackName}" does not exist`);
      }
      if (namedTrack.trackType !== segmentTrackType) {
        throw new TypeError(`Track "${trackName}" is "${namedTrack.trackType}", expected "${segmentTrackType}"`);
      }
      return namedTrack;
    }

    const candidates = [...this.tracks.values()].filter((track) => track.trackType === segmentTrackType);
    if (candidates.length === 0) {
      throw new TrackNotFoundError(`No track accepts segment type "${segmentTrackType}"`);
    }
    if (candidates.length > 1) {
      throw new AmbiguousTrackError(
        `Multiple "${segmentTrackType}" tracks exist. Please provide trackName explicitly.`
      );
    }
    return candidates[0] as Track;
  }

  private addSpeed(speed: Speed): void {
    if (!this.materials.speeds.some((item) => item.globalId === speed.globalId)) {
      this.materials.speeds.push(speed);
    }
  }

  private addAudioFade(fade: AudioFade): void {
    if (!this.materials.audioFades.some((item) => item.fadeId === fade.fadeId)) {
      this.materials.audioFades.push(fade);
    }
  }

  private addVideoEffect(effect: VideoEffect): void {
    if (!this.materials.videoEffects.some((item) => item.globalId === effect.globalId)) {
      this.materials.videoEffects.push(effect);
    }
  }

  private addAudioEffect(effect: AudioEffect): void {
    if (!this.materials.audioEffects.some((item) => item.effectId === effect.effectId)) {
      this.materials.audioEffects.push(effect);
    }
  }

  private addFilterMaterial(filter: Filter | TextBubble | TextEffect): void {
    if (!this.materials.filters.some((item) => item.globalId === filter.globalId)) {
      this.materials.filters.push(filter);
    }
  }

  private addAnimationMaterial(animation: SegmentAnimations): void {
    if (!this.materials.animations.some((item) => item.animationId === animation.animationId)) {
      this.materials.animations.push(animation);
    }
  }

  private addMaskMaterial(mask: Mask): void {
    if (!this.materials.masks.some((item) => item.globalId === mask.globalId)) {
      this.materials.masks.push(mask);
    }
  }

  private addTransitionMaterial(transition: Transition): void {
    if (!this.materials.transitions.some((item) => item.globalId === transition.globalId)) {
      this.materials.transitions.push(transition);
    }
  }

  private addMixModeMaterial(mixMode: MixMode): void {
    if (!this.materials.mixModes.some((item) => item.globalId === mixMode.globalId)) {
      this.materials.mixModes.push(mixMode);
    }
  }

  private addCanvasMaterial(canvas: BackgroundFilling): void {
    if (!this.materials.canvases.some((item) => item.globalId === canvas.globalId)) {
      this.materials.canvases.push(canvas);
    }
  }

  addSegment(
    segment: VideoSegment | AudioSegment | TextSegment | StickerSegment | EffectSegment | FilterSegment,
    trackName?: string
  ): this {
    const targetTrack = this.getTrackBySegment(segment.trackType, trackName);
    targetTrack.addSegment(segment);
    this.duration = Math.max(this.duration, segment.end);

    if (segment instanceof VideoSegment) {
      this.addMaterial(segment.materialInstance);
      this.addSpeed(segment.speed);
      if (segment.animationsInstance) {
        this.addAnimationMaterial(segment.animationsInstance);
      }
      if (segment.fade) {
        this.addAudioFade(segment.fade);
      }
      for (const effect of segment.effects) {
        this.addVideoEffect(effect);
      }
      for (const filter of segment.filters) {
        this.addFilterMaterial(filter);
      }
      for (const mixMode of segment.mixModes) {
        this.addMixModeMaterial(mixMode);
      }
      if (segment.mask) {
        this.addMaskMaterial(segment.mask);
      }
      if (segment.transition) {
        this.addTransitionMaterial(segment.transition);
      }
      if (segment.backgroundFilling) {
        this.addCanvasMaterial(segment.backgroundFilling);
      }
      return this;
    }

    if (segment instanceof AudioSegment) {
      this.addMaterial(segment.materialInstance);
      this.addSpeed(segment.speed);
      if (segment.fade) {
        this.addAudioFade(segment.fade);
      }
      for (const effect of segment.effects) {
        this.addAudioEffect(effect);
      }
      return this;
    }

    if (segment instanceof StickerSegment) {
      this.materials.stickers.push(segment.exportMaterial());
      this.addSpeed(segment.speed);
      return this;
    }

    if (segment instanceof EffectSegment) {
      this.addVideoEffect(segment.effectInst);
      return this;
    }

    if (segment instanceof FilterSegment) {
      this.addFilterMaterial(segment.material);
      return this;
    }

    this.materials.texts.push(segment.exportMaterial());
    this.addSpeed(segment.speed);
    if (segment.animationsInstance) {
      this.addAnimationMaterial(segment.animationsInstance);
    }
    if (segment.bubble) {
      this.addFilterMaterial(segment.bubble);
    }
    if (segment.effect) {
      this.addFilterMaterial(segment.effect);
    }
    return this;
  }

  addEffect(
    effectMeta: EffectMeta | VideoEffectPresetInput,
    tRange: Timerange,
    trackName?: string,
    options: AddEffectOptions = {}
  ): this {
    const targetTrack = this.getTrackBySegment(TrackType.effect, trackName);
    const segment = new EffectSegment(effectMeta, tRange, options);
    targetTrack.addSegment(segment);
    this.duration = Math.max(this.duration, segment.end);
    this.addVideoEffect(segment.effectInst);
    return this;
  }

  addFilter(filterMeta: EffectMeta | FilterPresetInput, tRange: Timerange, trackName?: string, intensity = 100): this {
    if (intensity < 0 || intensity > 100) {
      throw new RangeError(`Filter intensity should be in [0, 100], got ${intensity}`);
    }
    const targetTrack = this.getTrackBySegment(TrackType.filter, trackName);
    const segment = new FilterSegment(filterMeta, tRange, intensity / 100);
    targetTrack.addSegment(segment);
    this.duration = Math.max(this.duration, segment.end);
    this.addFilterMaterial(segment.material);
    return this;
  }

  importSrt(srtPath: string, trackName: string, options: ImportSrtOptions = {}): this {
    const timeOffset = tim(options.timeOffset ?? 0);
    const textStyle = options.textStyle ?? new TextStyle({ size: 5, align: 1, autoWrapping: true });

    if (!this.tracks.has(trackName)) {
      this.addTrack(TrackType.text, trackName, { relativeIndex: 999 });
    }

    const content = readFileSync(srtPath, "utf8").replaceAll("\r", "");
    const blocks = content.split("\n\n").map((item) => item.trim()).filter((item) => item.length > 0);

    for (const block of blocks) {
      const lines = block.split("\n");
      if (lines.length < 2) {
        continue;
      }

      const firstLine = lines[0] ?? "";
      let timestampLine = firstLine;
      let textLines = lines.slice(1);
      if (/^\d+$/.test(firstLine) && (lines[1] ?? "").includes(" --> ")) {
        timestampLine = lines[1] ?? "";
        textLines = lines.slice(2);
      }
      if (!timestampLine.includes(" --> ")) {
        continue;
      }

      const [startText, endText] = timestampLine.split(" --> ");
      if (!startText || !endText) {
        continue;
      }

      const start = Math.max(0, srtTstamp(startText) + timeOffset);
      const end = Math.max(start, srtTstamp(endText) + timeOffset);
      const text = textLines.join("\n").trim();
      if (!text) {
        continue;
      }

      const segment = new TextSegment(text, new Timerange(start, end - start), { style: textStyle });
      this.addSegment(segment, trackName);
    }

    return this;
  }

  private getImportedMaterialList(materialType: string): Record<string, unknown>[] {
    const materialList = this.importedMaterials[materialType];
    if (Array.isArray(materialList)) {
      return materialList as Record<string, unknown>[];
    }

    const empty: Record<string, unknown>[] = [];
    this.importedMaterials[materialType] = empty;
    return empty;
  }

  getImportedTrack(
    trackType: TrackType.video | TrackType.audio | TrackType.text,
    name?: string,
    index?: number
  ): EditableTrack {
    const tracksOfSameType = this.importedTracks.filter(
      (track) => track.trackType === trackType && track instanceof EditableTrack
    ) as EditableTrack[];

    const matchedTracks: EditableTrack[] = [];
    for (let i = 0; i < tracksOfSameType.length; i += 1) {
      const track = tracksOfSameType[i];
      if (!track) {
        continue;
      }
      if (name !== undefined && track.name !== name) {
        continue;
      }
      if (index !== undefined && i !== index) {
        continue;
      }
      matchedTracks.push(track);
    }

    if (matchedTracks.length === 0) {
      throw new TrackNotFoundError(
        `No imported track matches: trackType=${trackType}, name=${String(name)}, index=${String(index)}`
      );
    }
    if (matchedTracks.length > 1) {
      throw new AmbiguousTrackError(
        `Multiple imported tracks match: trackType=${trackType}, name=${String(name)}, index=${String(index)}`
      );
    }

    return matchedTracks[0] as EditableTrack;
  }

  importTrack(sourceFile: ScriptFile, track: EditableTrack, options: ImportTrackOptions = {}): this {
    const importedTrack = parseImportedTrack(track.exportJson() as Record<string, unknown>);
    if (options.relativeIndex !== undefined) {
      importedTrack.renderIndex = TRACK_META[track.trackType].renderIndex + options.relativeIndex;
    }
    if (options.newName !== undefined) {
      importedTrack.name = options.newName;
    }

    const offsetUs = tim(options.offset ?? 0);
    if (offsetUs !== 0 && importedTrack instanceof EditableTrack) {
      for (const segment of importedTrack.segments) {
        segment.start = Math.max(0, segment.start + offsetUs);
      }
    }
    this.importedTracks.push(importedTrack);

    const trackJson = importedTrack.exportJson();
    const segments = (trackJson.segments ?? []) as Record<string, unknown>[];
    const requiredMaterialIds = new Set<string>();
    for (const segment of segments) {
      const materialId = segment.material_id;
      if (typeof materialId === "string" && materialId.length > 0) {
        requiredMaterialIds.add(materialId);
      }

      const extraRefs = segment.extra_material_refs;
      if (Array.isArray(extraRefs)) {
        for (const ref of extraRefs) {
          if (typeof ref === "string" && ref.length > 0) {
            requiredMaterialIds.add(ref);
          }
        }
      }
    }

    for (const [materialType, materialList] of Object.entries(sourceFile.importedMaterials)) {
      if (!Array.isArray(materialList)) {
        continue;
      }

      for (const material of materialList as Record<string, unknown>[]) {
        const materialId = material.id;
        if (typeof materialId === "string" && requiredMaterialIds.has(materialId)) {
          this.getImportedMaterialList(materialType).push(deepClone(material));
          requiredMaterialIds.delete(materialId);
        }
      }
    }

    if (requiredMaterialIds.size > 0) {
      throw new MaterialNotFoundError(`Missing imported material ids: ${[...requiredMaterialIds].join(", ")}`);
    }

    if (importedTrack instanceof EditableTrack) {
      this.duration = Math.max(this.duration, importedTrack.endTime);
    }

    return this;
  }

  replaceMaterialByName(materialName: string, material: VideoMaterial | AudioMaterial, replaceCrop = false): this {
    const videoMode = material instanceof VideoMaterial;
    const targetMaterialList = this.getImportedMaterialList(videoMode ? "videos" : "audios");
    const nameKey = videoMode ? "material_name" : "name";

    let targetJsonObj: Record<string, unknown> | null = null;
    for (const item of targetMaterialList) {
      if (item[nameKey] === materialName) {
        if (targetJsonObj !== null) {
          throw new AmbiguousMaterialError(
            `Found multiple materials with name "${materialName}" for type "${videoMode ? "video" : "audio"}"`
          );
        }
        targetJsonObj = item;
      }
    }

    if (targetJsonObj === null) {
      throw new MaterialNotFoundError(
        `Cannot find material "${materialName}" for type "${videoMode ? "video" : "audio"}"`
      );
    }

    targetJsonObj[nameKey] = material.materialName;
    targetJsonObj.path = material.path;
    targetJsonObj.duration = material.duration;

    if (videoMode) {
      targetJsonObj.width = material.width;
      targetJsonObj.height = material.height;
      targetJsonObj.material_type = material.materialType;
      if (replaceCrop) {
        targetJsonObj.crop = material.cropSettings.exportJson();
      }
    }

    return this;
  }

  replaceMaterialBySeg(
    track: EditableTrack,
    segmentIndex: number,
    material: VideoMaterial | AudioMaterial,
    options: ReplaceMaterialBySegOptions = {}
  ): this {
    if (!(track instanceof ImportedMediaTrack)) {
      throw new TypeError(`Track "${track.name}" of type "${track.trackType}" does not support material replacement`);
    }
    if (segmentIndex < 0 || segmentIndex >= track.length) {
      throw new RangeError(`Segment index ${segmentIndex} out of range [0, ${track.length})`);
    }
    if (!track.checkMaterialType(material)) {
      throw new TypeError(`Material type does not match track type "${track.trackType}"`);
    }

    const segment = track.segments[segmentIndex];
    if (!segment) {
      throw new RangeError(`Segment index ${segmentIndex} out of range`);
    }

    const handleShrink = options.handleShrink ?? ShrinkMode.cutTail;
    const handleExtend = Array.isArray(options.handleExtend)
      ? options.handleExtend
      : [options.handleExtend ?? ExtendMode.cutMaterialTail];

    let sourceTimerange = options.sourceTimerange;
    if (!sourceTimerange) {
      if (material instanceof VideoMaterial && material.materialType === "photo") {
        sourceTimerange = new Timerange(0, segment.duration);
      } else {
        sourceTimerange = new Timerange(0, material.duration);
      }
    }

    track.processTimerange(segmentIndex, sourceTimerange, handleShrink, handleExtend);
    segment.materialId = material.materialId;
    this.addMaterial(material);

    return this;
  }

  private static recalcStyleRange(
    oldLength: number,
    newLength: number,
    styles: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    if (oldLength <= 0) {
      return styles;
    }

    const newStyles: Record<string, unknown>[] = [];
    for (const style of styles) {
      const range = style.range;
      if (!Array.isArray(range) || range.length < 2) {
        newStyles.push(style);
        continue;
      }

      const start = Math.ceil((Number(range[0]) / oldLength) * newLength);
      const end = Math.ceil((Number(range[1]) / oldLength) * newLength);
      style.range = [start, end];
      if (start !== end) {
        newStyles.push(style);
      }
    }
    return newStyles;
  }

  private static patchTextMaterialContent(
    material: Record<string, unknown>,
    newText: string,
    recalcStyle: boolean
  ): void {
    try {
      const parsed = JSON.parse(String(material.content ?? "")) as Record<string, unknown>;
      const oldText = typeof parsed.text === "string" ? parsed.text : "";
      const styles = Array.isArray(parsed.styles) ? (parsed.styles as Record<string, unknown>[]) : [];
      if (recalcStyle) {
        parsed.styles = ScriptFile.recalcStyleRange(oldText.length, newText.length, styles);
      }
      parsed.text = newText;
      material.content = JSON.stringify(parsed);
    } catch {
      material.content = newText;
    }
  }

  replaceText(track: EditableTrack, segmentIndex: number, text: string | string[], recalcStyle = true): this {
    if (!(track instanceof ImportedTextTrack)) {
      throw new TypeError(`Track "${track.name}" of type "${track.trackType}" does not support text replacement`);
    }
    if (segmentIndex < 0 || segmentIndex >= track.length) {
      throw new RangeError(`Segment index ${segmentIndex} out of range [0, ${track.length})`);
    }

    const targetSegment = track.segments[segmentIndex];
    if (!targetSegment) {
      throw new RangeError(`Segment index ${segmentIndex} out of range`);
    }
    const materialId = targetSegment.materialId;

    const textMaterialList = this.getImportedMaterialList("texts");
    for (const material of textMaterialList) {
      if (material.id !== materialId) {
        continue;
      }

      if (Array.isArray(text)) {
        if (text.length !== 1) {
          throw new Error(`Plain text segment requires exactly 1 replacement text, got ${text.length}`);
        }
        ScriptFile.patchTextMaterialContent(material, text[0] as string, recalcStyle);
      } else {
        ScriptFile.patchTextMaterialContent(material, text, recalcStyle);
      }
      return this;
    }

    const templates = this.getImportedMaterialList("text_templates");
    for (const template of templates) {
      if (template.id !== materialId) {
        continue;
      }

      const resources = (template.text_info_resources ?? []) as Record<string, unknown>[];
      const textList = Array.isArray(text) ? text : [text];
      if (textList.length > resources.length) {
        throw new Error(
          `Template "${String(template.name ?? "")}" has ${resources.length} text slots but received ${textList.length}`
        );
      }

      for (let i = 0; i < textList.length; i += 1) {
        const resource = resources[i];
        if (!resource) {
          break;
        }
        const subMaterialId = resource.text_material_id;
        if (typeof subMaterialId !== "string") {
          continue;
        }

        const targetMaterial = textMaterialList.find((material) => material.id === subMaterialId);
        if (!targetMaterial) {
          continue;
        }
        ScriptFile.patchTextMaterialContent(targetMaterial, textList[i] as string, recalcStyle);
      }

      return this;
    }

    throw new MaterialNotFoundError(`Cannot find text material for segment material id "${materialId}"`);
  }

  inspectMaterial(): void {
    const stickers = this.getImportedMaterialList("stickers");
    const effects = this.getImportedMaterialList("effects");

    // Keep the same style as pyJianYingDraft for easier migration.
    process.stdout.write("Stickers:\n");
    for (const sticker of stickers) {
      process.stdout.write(`\tResource id: ${String(sticker.resource_id ?? "")} '${String(sticker.name ?? "")}'\n`);
    }

    process.stdout.write("Text bubble effects:\n");
    for (const effect of effects) {
      if (effect.type === "text_shape") {
        process.stdout.write(
          `\tEffect id: ${String(effect.effect_id ?? "")}, Resource id: ${String(effect.resource_id ?? "")} '${String(effect.name ?? "")}'\n`
        );
      }
    }

    process.stdout.write("Text effects:\n");
    for (const effect of effects) {
      if (effect.type === "text_effect") {
        process.stdout.write(`\tResource id: ${String(effect.resource_id ?? "")} '${String(effect.name ?? "")}'\n`);
      }
    }
  }

  private buildMaterialJson(): JsonArrayMap {
    const result = createEmptyMaterialJson();

    result.audios = this.materials.audios.map((item) => item.exportJson());
    result.videos = this.materials.videos.map((item) => item.exportJson());
    result.stickers = deepClone(this.materials.stickers);
    result.texts = deepClone(this.materials.texts);
    result.audio_effects = this.materials.audioEffects.map((item) => item.exportJson());
    result.audio_fades = this.materials.audioFades.map((item) => item.exportJson());
    result.material_animations = this.materials.animations.map((item) => item.exportJson());
    result.video_effects = this.materials.videoEffects.map((item) => item.exportJson());
    result.speeds = this.materials.speeds.map((item) => item.exportJson());
    result.masks = this.materials.masks.map((item) => item.exportJson());
    result.transitions = this.materials.transitions.map((item) => item.exportJson());
    result.effects = [
      ...this.materials.filters.map((item) => item.exportJson()),
      ...this.materials.mixModes.map((item) => item.exportJson())
    ];
    result.canvases = this.materials.canvases.map((item) => item.exportJson());

    for (const [materialType, materialList] of Object.entries(this.importedMaterials)) {
      if (!Array.isArray(materialList)) {
        continue;
      }
      if (!result[materialType]) {
        result[materialType] = [];
      }
      result[materialType].push(...deepClone(materialList));
    }

    return result;
  }

  private static extractTrackRenderIndex(track: Record<string, unknown>): number {
    const segments = (track.segments ?? []) as Record<string, unknown>[];
    if (!Array.isArray(segments) || segments.length === 0) {
      return 0;
    }

    let maxRenderIndex = 0;
    for (const segment of segments) {
      const value = Number(segment.render_index ?? 0);
      if (value > maxRenderIndex) {
        maxRenderIndex = value;
      }
    }
    return maxRenderIndex;
  }

  dumps(): string {
    const draft = deepClone(this.content) as Record<string, unknown>;

    const config = (draft.config ?? {}) as Record<string, unknown>;
    config.maintrack_adsorb = this.maintrackAdsorb;

    draft.fps = this.fps;
    draft.duration = this.duration;
    draft.config = config;
    draft.canvas_config = { width: this.width, height: this.height, ratio: "original" };
    draft.materials = this.buildMaterialJson();

    const trackList = [
      ...this.importedTracks.map((track) => track.exportJson()),
      ...[...this.tracks.values()].map((track) => track.exportJson())
    ] as Record<string, unknown>[];

    trackList.sort((a, b) => ScriptFile.extractTrackRenderIndex(a) - ScriptFile.extractTrackRenderIndex(b));
    draft.tracks = trackList;

    return JSON.stringify(draft, null, 4);
  }

  dump(filePath: string): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, this.dumps(), "utf8");
  }

  save(): void {
    if (!this.savePath) {
      throw new Error("savePath is not set. This usually means you are not in template mode.");
    }
    this.dump(this.savePath);
  }

  /** @deprecated Use addMaterial instead. */
  add_material(material: VideoMaterial | AudioMaterial): this {
    return this.addMaterial(material);
  }

  /** @deprecated Use addTrack instead. */
  add_track(trackType: TrackType, trackName?: string, options: AddTrackOptions = {}): this {
    return this.addTrack(trackType, trackName, options);
  }

  /** @deprecated Use addSegment instead. */
  add_segment(
    segment: VideoSegment | AudioSegment | TextSegment | StickerSegment | EffectSegment | FilterSegment,
    trackName?: string
  ): this {
    return this.addSegment(segment, trackName);
  }

  /** @deprecated Use addEffect instead. */
  add_effect(
    effectMeta: EffectMeta | VideoEffectPresetInput,
    tRange: Timerange,
    trackName?: string,
    options: AddEffectOptions = {}
  ): this {
    return this.addEffect(effectMeta, tRange, trackName, options);
  }

  /** @deprecated Use addFilter instead. */
  add_filter(filterMeta: EffectMeta | FilterPresetInput, tRange: Timerange, trackName?: string, intensity = 100): this {
    return this.addFilter(filterMeta, tRange, trackName, intensity);
  }

  /** @deprecated Use importSrt instead. */
  import_srt(srtPath: string, trackName: string, options: ImportSrtOptions = {}): this {
    return this.importSrt(srtPath, trackName, options);
  }

  /** @deprecated Use getImportedTrack instead. */
  get_imported_track(trackType: TrackType.video | TrackType.audio | TrackType.text, name?: string, index?: number): EditableTrack {
    return this.getImportedTrack(trackType, name, index);
  }

  /** @deprecated Use importTrack instead. */
  import_track(sourceFile: ScriptFile, track: EditableTrack, options: ImportTrackOptions = {}): this {
    return this.importTrack(sourceFile, track, options);
  }

  /** @deprecated Use replaceMaterialByName instead. */
  replace_material_by_name(materialName: string, material: VideoMaterial | AudioMaterial, replaceCrop = false): this {
    return this.replaceMaterialByName(materialName, material, replaceCrop);
  }

  /** @deprecated Use replaceMaterialBySeg instead. */
  replace_material_by_seg(
    track: EditableTrack,
    segmentIndex: number,
    material: VideoMaterial | AudioMaterial,
    options: ReplaceMaterialBySegOptions = {}
  ): this {
    return this.replaceMaterialBySeg(track, segmentIndex, material, options);
  }

  /** @deprecated Use replaceText instead. */
  replace_text(track: EditableTrack, segmentIndex: number, text: string | string[], recalcStyle = true): this {
    return this.replaceText(track, segmentIndex, text, recalcStyle);
  }
}
