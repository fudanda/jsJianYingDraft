import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { createDraftContentTemplate, JsonObject } from "./assets.js";
import { AmbiguousTrackError, TrackNotFoundError } from "./errors.js";
import { AudioMaterial, VideoMaterial } from "./materials.js";
import { AudioFade, AudioSegment, Speed, TextSegment, TextStyle, VideoSegment } from "./segment.js";
import { TRACK_META, Track, TrackType } from "./track.js";
import { srtTstamp, tim, Timerange } from "./time.js";

type JsonArrayMap = Record<string, unknown[]>;

interface MaterialStore {
  audios: AudioMaterial[];
  videos: VideoMaterial[];
  stickers: Record<string, unknown>[];
  texts: Record<string, unknown>[];
  audioEffects: Record<string, unknown>[];
  audioFades: AudioFade[];
  animations: Record<string, unknown>[];
  videoEffects: Record<string, unknown>[];
  speeds: Speed[];
  masks: Record<string, unknown>[];
  transitions: Record<string, unknown>[];
  filters: Record<string, unknown>[];
  mixModes: Record<string, unknown>[];
  canvases: Record<string, unknown>[];
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
  importedTracks: Record<string, unknown>[];

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
    script.importedTracks = deepClone(((content.tracks ?? []) as Record<string, unknown>[]));

    return script;
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

  addSegment(segment: VideoSegment | AudioSegment | TextSegment, trackName?: string): this {
    const targetTrack = this.getTrackBySegment(segment.trackType, trackName);
    targetTrack.addSegment(segment);
    this.duration = Math.max(this.duration, segment.end);

    if (segment instanceof VideoSegment) {
      this.addMaterial(segment.materialInstance);
      this.addSpeed(segment.speed);
      if (segment.fade) {
        this.addAudioFade(segment.fade);
      }
      return this;
    }

    if (segment instanceof AudioSegment) {
      this.addMaterial(segment.materialInstance);
      this.addSpeed(segment.speed);
      if (segment.fade) {
        this.addAudioFade(segment.fade);
      }
      return this;
    }

    this.materials.texts.push(segment.exportMaterial());
    this.addSpeed(segment.speed);
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

  private buildMaterialJson(): JsonArrayMap {
    const result = createEmptyMaterialJson();

    result.audios = this.materials.audios.map((item) => item.exportJson());
    result.videos = this.materials.videos.map((item) => item.exportJson());
    result.stickers = deepClone(this.materials.stickers);
    result.texts = deepClone(this.materials.texts);
    result.audio_effects = deepClone(this.materials.audioEffects);
    result.audio_fades = this.materials.audioFades.map((item) => item.exportJson());
    result.material_animations = deepClone(this.materials.animations);
    result.video_effects = deepClone(this.materials.videoEffects);
    result.speeds = this.materials.speeds.map((item) => item.exportJson());
    result.masks = deepClone(this.materials.masks);
    result.transitions = deepClone(this.materials.transitions);
    result.effects = [...deepClone(this.materials.filters), ...deepClone(this.materials.mixModes)];
    result.canvases = deepClone(this.materials.canvases);

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
      ...deepClone(this.importedTracks),
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
}
