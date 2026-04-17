export class TrackNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrackNotFoundError";
  }
}

export class AmbiguousTrackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmbiguousTrackError";
  }
}

export class SegmentOverlapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SegmentOverlapError";
  }
}

export class MaterialNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaterialNotFoundError";
  }
}

export class AmbiguousMaterialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmbiguousMaterialError";
  }
}

export class ExtensionFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtensionFailedError";
  }
}
