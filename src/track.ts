import { randomUUID } from "node:crypto";

import { SegmentOverlapError } from "./errors.js";
import { Timerange } from "./time.js";

export interface TrackMeta {
  renderIndex: number;
  allowModify: boolean;
}

export enum TrackType {
  video = "video",
  audio = "audio",
  effect = "effect",
  filter = "filter",
  sticker = "sticker",
  text = "text",
  adjust = "adjust"
}

function isTrackTypeName(name: string): name is TrackType {
  return (
    name === TrackType.video ||
    name === TrackType.audio ||
    name === TrackType.effect ||
    name === TrackType.filter ||
    name === TrackType.sticker ||
    name === TrackType.text ||
    name === TrackType.adjust
  );
}

export namespace TrackType {
  export function fromName(name: string): TrackType {
    if (isTrackTypeName(name)) {
      return name;
    }
    throw new Error(`Invalid track type: ${name}`);
  }

  export const from_name = fromName;
}

export const TRACK_META: Record<TrackType, TrackMeta> = {
  [TrackType.video]: { renderIndex: 0, allowModify: true },
  [TrackType.audio]: { renderIndex: 0, allowModify: true },
  [TrackType.effect]: { renderIndex: 10_000, allowModify: false },
  [TrackType.filter]: { renderIndex: 11_000, allowModify: false },
  [TrackType.sticker]: { renderIndex: 14_000, allowModify: false },
  [TrackType.text]: { renderIndex: 15_000, allowModify: true },
  [TrackType.adjust]: { renderIndex: 0, allowModify: false }
};

export interface SegmentLike {
  readonly trackType: TrackType;
  readonly targetTimerange: Timerange;
  exportJson(): Record<string, unknown>;
}

export class Track {
  readonly trackType: TrackType;
  readonly name: string;
  readonly trackId: string;
  readonly renderIndex: number;
  readonly mute: boolean;
  readonly segments: SegmentLike[];

  constructor(trackType: TrackType, name: string, renderIndex: number, mute = false) {
    this.trackType = trackType;
    this.name = name;
    this.trackId = randomUUID().replaceAll("-", "");
    this.renderIndex = renderIndex;
    this.mute = mute;
    this.segments = [];
  }

  get endTime(): number {
    if (this.segments.length === 0) {
      return 0;
    }
    const last = this.segments[this.segments.length - 1];
    if (!last) {
      return 0;
    }
    return last.targetTimerange.end;
  }

  addSegment(segment: SegmentLike): this {
    if (segment.trackType !== this.trackType) {
      throw new TypeError(`Segment type ${segment.trackType} does not match track type ${this.trackType}`);
    }

    for (const existing of this.segments) {
      if (existing.targetTimerange.overlaps(segment.targetTimerange)) {
        throw new SegmentOverlapError(
          `New segment overlaps with existing segment [start: ${segment.targetTimerange.start}, end: ${segment.targetTimerange.end}]`
        );
      }
    }

    this.segments.push(segment);
    return this;
  }

  exportJson(): Record<string, unknown> {
    const segmentExports = this.segments.map((segment) => {
      const exported = segment.exportJson();
      exported.render_index = this.renderIndex;
      return exported;
    });

    return {
      attribute: Number(this.mute),
      flag: 0,
      id: this.trackId,
      is_default_name: this.name.length === 0,
      name: this.name,
      segments: segmentExports,
      type: this.trackType
    };
  }
}
