import type {ArtifactHistory, Position, WorkbenchEvent} from './types.js';

export function comparePosition(a: Position, b: Position): number {
  return a.elapsedMs - b.elapsedMs || a.order - b.order;
}

/** Never interpolate artifact contents across an unobserved interval. */
export function versionAt<T>(history: ArtifactHistory<T>, cursor: Position) {
  return history.versions.filter(v => comparePosition(v.visibleFrom, cursor) <= 0)
    .sort((a, b) => comparePosition(a.visibleFrom, b.visibleFrom)).at(-1) ?? null;
}

export function eventAt(events: WorkbenchEvent[], cursor: Position) {
  return events.filter(e => comparePosition(e.position, cursor) <= 0)
    .sort((a, b) => comparePosition(a.position, b.position)).at(-1) ?? null;
}
