import { ExtensionFailedError } from "./errors.js";
import { AudioMaterial, VideoMaterial } from "./materials.js";
import { TRACK_META, TrackType } from "./track.js";
import { Timerange } from "./time.js";

type JsonRecord = Record<string, unknown>;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseTrackType(value: unknown): TrackType {
  if (typeof value !== "string") {
    throw new TypeError(`Invalid track type: ${String(value)}`);
  }

  const all = new Set(Object.values(TrackType));
  if (!all.has(value as TrackType)) {
    throw new TypeError(`Invalid track type: ${value}`);
  }
  return value as TrackType;
}

function asSegmentList(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : [];
}

export enum ShrinkMode {
  cutHead = "cut_head",
  cutTail = "cut_tail",
  cutTailAlign = "cut_tail_align",
  shrink = "shrink"
}

export enum ExtendMode {
  cutMaterialTail = "cut_material_tail",
  extendHead = "extend_head",
  extendTail = "extend_tail",
  pushTail = "push_tail"
}

export class ImportedSegment {
  rawData: JsonRecord;
  materialId: string;
  targetTimerange: Timerange;

  constructor(jsonData: JsonRecord) {
    this.rawData = deepClone(jsonData);
    this.materialId = String(jsonData.material_id ?? "");
    this.targetTimerange = Timerange.importJson((jsonData.target_timerange ?? { start: 0, duration: 0 }) as {
      start: number | string;
      duration: number | string;
    });
  }

  get start(): number {
    return this.targetTimerange.start;
  }

  set start(value: number) {
    this.targetTimerange.start = Math.round(value);
  }

  get duration(): number {
    return this.targetTimerange.duration;
  }

  set duration(value: number) {
    this.targetTimerange.duration = Math.round(value);
  }

  get end(): number {
    return this.targetTimerange.end;
  }

  exportJson(): JsonRecord {
    const jsonData = deepClone(this.rawData);
    jsonData.material_id = this.materialId;
    jsonData.target_timerange = this.targetTimerange.exportJson();
    return jsonData;
  }
}

export class ImportedMediaSegment extends ImportedSegment {
  sourceTimerange: Timerange;

  constructor(jsonData: JsonRecord) {
    super(jsonData);
    this.sourceTimerange = Timerange.importJson((jsonData.source_timerange ?? { start: 0, duration: 0 }) as {
      start: number | string;
      duration: number | string;
    });
  }

  exportJson(): JsonRecord {
    const jsonData = super.exportJson();
    jsonData.source_timerange = this.sourceTimerange.exportJson();
    return jsonData;
  }
}

export class ImportedTrack {
  trackType: TrackType;
  name: string;
  trackId: string;
  renderIndex: number;
  rawData: JsonRecord;

  constructor(jsonData: JsonRecord) {
    this.trackType = parseTrackType(jsonData.type);
    this.name = String(jsonData.name ?? "");
    this.trackId = String(jsonData.id ?? "");
    this.renderIndex = Math.max(
      ...asSegmentList(jsonData.segments).map((segment) => Number(segment.render_index ?? 0)),
      0
    );
    this.rawData = deepClone(jsonData);
  }

  exportJson(): JsonRecord {
    const output = deepClone(this.rawData);
    output.name = this.name;
    output.id = this.trackId;
    return output;
  }
}

export class EditableTrack extends ImportedTrack {
  segments: ImportedSegment[];

  constructor(jsonData: JsonRecord) {
    super(jsonData);
    this.segments = [];
  }

  get length(): number {
    return this.segments.length;
  }

  get startTime(): number {
    if (this.segments.length === 0) {
      return 0;
    }
    return this.segments[0]?.start ?? 0;
  }

  /** @deprecated Use startTime instead. */
  get start_time(): number {
    return this.startTime;
  }

  get endTime(): number {
    if (this.segments.length === 0) {
      return 0;
    }
    return this.segments[this.segments.length - 1]?.end ?? 0;
  }

  /** @deprecated Use endTime instead. */
  get end_time(): number {
    return this.endTime;
  }

  exportJson(): JsonRecord {
    const output = super.exportJson();
    const segmentExports = this.segments.map((segment) => {
      const segmentExport = segment.exportJson();
      segmentExport.render_index = this.renderIndex;
      return segmentExport;
    });
    output.segments = segmentExports;
    return output;
  }
}

export class ImportedTextTrack extends EditableTrack {
  constructor(jsonData: JsonRecord) {
    super(jsonData);
    this.segments = asSegmentList(jsonData.segments).map((segment) => new ImportedSegment(segment));
  }
}

export class ImportedMediaTrack extends EditableTrack {
  declare segments: ImportedMediaSegment[];

  constructor(jsonData: JsonRecord) {
    super(jsonData);
    this.segments = asSegmentList(jsonData.segments).map((segment) => new ImportedMediaSegment(segment));
  }

  checkMaterialType(material: VideoMaterial | AudioMaterial): boolean {
    if (this.trackType === TrackType.video && material instanceof VideoMaterial) {
      return true;
    }
    if (this.trackType === TrackType.audio && material instanceof AudioMaterial) {
      return true;
    }
    return false;
  }

  /** @deprecated Use checkMaterialType instead. */
  check_material_type(material: VideoMaterial | AudioMaterial): boolean {
    return this.checkMaterialType(material);
  }

  processTimerange(segIndex: number, sourceTimerange: Timerange, shrink: ShrinkMode, extend: ExtendMode[]): void {
    const segment = this.segments[segIndex];
    if (!segment) {
      throw new RangeError(`Segment index ${segIndex} out of range`);
    }

    const newDuration = sourceTimerange.duration;
    const deltaDuration = Math.abs(newDuration - segment.duration);

    if (newDuration < segment.duration) {
      if (shrink === ShrinkMode.cutHead) {
        segment.start += deltaDuration;
      } else if (shrink === ShrinkMode.cutTail) {
        segment.duration -= deltaDuration;
      } else if (shrink === ShrinkMode.cutTailAlign) {
        segment.duration -= deltaDuration;
        for (let i = segIndex + 1; i < this.segments.length; i += 1) {
          const next = this.segments[i];
          if (next) {
            next.start -= deltaDuration;
          }
        }
      } else if (shrink === ShrinkMode.shrink) {
        segment.duration -= deltaDuration;
        segment.start += Math.floor(deltaDuration / 2);
      } else {
        throw new Error(`Unsupported shrink mode: ${String(shrink)}`);
      }
    } else if (newDuration > segment.duration) {
      let success = false;
      const prevSegment = segIndex === 0 ? null : this.segments[segIndex - 1];
      const nextSegment = segIndex === this.segments.length - 1 ? null : this.segments[segIndex + 1];
      const prevSegmentEnd = prevSegment ? prevSegment.end : 0;
      const nextSegmentStart = nextSegment ? nextSegment.start : Number.POSITIVE_INFINITY;

      for (const mode of extend) {
        if (mode === ExtendMode.extendHead) {
          if (segment.start - deltaDuration >= prevSegmentEnd) {
            segment.start -= deltaDuration;
            success = true;
          }
        } else if (mode === ExtendMode.extendTail) {
          if (segment.end + deltaDuration <= nextSegmentStart) {
            segment.duration += deltaDuration;
            success = true;
          }
        } else if (mode === ExtendMode.pushTail) {
          const shiftDuration = Math.max(0, segment.end + deltaDuration - nextSegmentStart);
          segment.duration += deltaDuration;
          if (shiftDuration > 0) {
            for (let i = segIndex + 1; i < this.segments.length; i += 1) {
              const next = this.segments[i];
              if (next) {
                next.start += shiftDuration;
              }
            }
          }
          success = true;
        } else if (mode === ExtendMode.cutMaterialTail) {
          sourceTimerange.duration = segment.duration;
          success = true;
        } else {
          throw new Error(`Unsupported extend mode: ${String(mode)}`);
        }

        if (success) {
          break;
        }
      }

      if (!success) {
        throw new ExtensionFailedError(`Failed to extend segment to ${newDuration}us with modes: ${extend.join(", ")}`);
      }
    }

    segment.sourceTimerange = sourceTimerange;
  }

  /** @deprecated Use processTimerange instead. */
  process_timerange(segIndex: number, sourceTimerange: Timerange, shrink: ShrinkMode, extend: ExtendMode[]): void {
    this.processTimerange(segIndex, sourceTimerange, shrink, extend);
  }
}

export function importTrack(jsonData: JsonRecord): ImportedTrack {
  const trackType = parseTrackType(jsonData.type);
  if (!TRACK_META[trackType].allowModify) {
    return new ImportedTrack(jsonData);
  }
  if (trackType === TrackType.text) {
    return new ImportedTextTrack(jsonData);
  }
  return new ImportedMediaTrack(jsonData);
}
