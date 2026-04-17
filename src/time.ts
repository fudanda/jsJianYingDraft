export const SEC = 1_000_000;

type TimeInput = string | number;

export function tim(input: TimeInput): number {
  if (typeof input === "number") {
    return Math.round(input);
  }

  const raw = input.trim().toLowerCase();
  if (!raw) {
    throw new Error("Time string cannot be empty");
  }

  let sign = 1;
  let body = raw;
  if (body.startsWith("-")) {
    sign = -1;
    body = body.slice(1);
  } else if (body.startsWith("+")) {
    body = body.slice(1);
  }

  if (!body) {
    throw new Error(`Invalid time string: "${input}"`);
  }

  const unitPattern = /(\d+(?:\.\d+)?)(h|m|s)/g;
  let totalUs = 0;
  let matchedLength = 0;
  let match: RegExpExecArray | null;

  while ((match = unitPattern.exec(body)) !== null) {
    const value = Number(match[1]);
    const unit = match[2];
    matchedLength += match[0].length;

    if (unit === "h") {
      totalUs += value * 3600 * SEC;
    } else if (unit === "m") {
      totalUs += value * 60 * SEC;
    } else if (unit === "s") {
      totalUs += value * SEC;
    }
  }

  if (matchedLength === body.length && matchedLength > 0) {
    return Math.round(totalUs * sign);
  }

  if (/^\d+(?:\.\d+)?$/.test(body)) {
    return Math.round(Number(body) * sign);
  }

  throw new Error(`Invalid time string: "${input}"`);
}

export class Timerange {
  start: number;
  duration: number;

  constructor(start: number, duration: number) {
    this.start = Math.round(start);
    this.duration = Math.round(duration);
  }

  static importJson(json: { start: number | string; duration: number | string }): Timerange {
    return new Timerange(Number(json.start), Number(json.duration));
  }

  get end(): number {
    return this.start + this.duration;
  }

  overlaps(other: Timerange): boolean {
    return !(this.end <= other.start || other.end <= this.start);
  }

  exportJson(): { start: number; duration: number } {
    return { start: this.start, duration: this.duration };
  }

  toString(): string {
    return `[start=${this.start}, end=${this.end}]`;
  }
}

export function trange(start: TimeInput, duration: TimeInput): Timerange {
  return new Timerange(tim(start), tim(duration));
}

export function srtTstamp(value: string): number {
  const [secPart, msPart] = value.split(",");
  if (!secPart || !msPart) {
    throw new Error(`Invalid SRT timestamp: "${value}"`);
  }

  const [hh, mm, ss] = secPart.split(":");
  if (hh === undefined || mm === undefined || ss === undefined) {
    throw new Error(`Invalid SRT timestamp: "${value}"`);
  }

  const totalUs =
    Number(hh) * 3600 * SEC +
    Number(mm) * 60 * SEC +
    Number(ss) * SEC +
    Number(msPart) * 1_000;

  return totalUs;
}
