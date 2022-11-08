import { Frame, PauseId } from "@replayio/protocol";

import { createUseGetValue } from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import {
  getFramesAsync as getFramesAsyncNew,
  getFramesIfCached,
  getFramesSuspense as getFramesSuspenseNew,
} from "bvaughn-architecture-demo/src/suspense/FrameCache";
import { createFrame } from "devtools/client/debugger/src/client/create";
import { PauseAndFrameId } from "devtools/client/debugger/src/reducers/pause";
import { formatCallStackFrames } from "devtools/client/debugger/src/selectors/getCallStackFrames";
import { replayClient } from "shared/client/ReplayClientContext";
import { SourcesState } from "ui/reducers/sources";

export function getFramesSuspense(pauseId: PauseId) {
  return getFramesSuspenseNew(replayClient, pauseId);
}

export function getFramesAsync(pauseId: PauseId) {
  return getFramesAsyncNew(replayClient, pauseId);
}

export const useGetFrames = createUseGetValue<[pauseId: PauseId | undefined], Frame[] | undefined>(
  async pauseId => (pauseId ? await getFramesAsync(pauseId) : undefined),
  pauseId => (pauseId ? getFramesIfCached(pauseId) : { value: undefined }),
  pauseId => pauseId ?? ""
);

export function getFrameSuspense(pauseAndFrameId: PauseAndFrameId) {
  const frames = getFramesSuspense(pauseAndFrameId.pauseId);
  return frames?.find(frame => frame.frameId === pauseAndFrameId.frameId);
}

export function getPauseFramesSuspense(pauseId: PauseId, sourcesState: SourcesState) {
  const frames = getFramesSuspense(pauseId);
  return frames ? createPauseFrames(pauseId, frames, sourcesState) : undefined;
}

export function getPauseFrameSuspense(
  pauseAndFrameId: PauseAndFrameId,
  sourcesState: SourcesState
) {
  const frame = getFrameSuspense(pauseAndFrameId);
  return frame ? createPauseFrames(pauseAndFrameId.pauseId, [frame], sourcesState)[0] : undefined;
}

export async function getPauseFramesAsync(pauseId: PauseId, sourcesState: SourcesState) {
  const frames = await getFramesAsync(pauseId);
  return frames ? createPauseFrames(pauseId, frames, sourcesState) : undefined;
}

export async function getPauseFrameAsync(
  pauseAndFrameId: PauseAndFrameId,
  sourcesState: SourcesState
) {
  const frame = (await getFramesAsync(pauseAndFrameId.pauseId))?.find(
    frame => frame.frameId === pauseAndFrameId.frameId
  );
  return frame ? createPauseFrames(pauseAndFrameId.pauseId, [frame], sourcesState)[0] : undefined;
}

export function getPauseFramesIfCached(pauseId: PauseId, sourcesState: SourcesState) {
  const frames = getFramesIfCached(pauseId);
  if (!frames?.value) {
    return undefined;
  }
  return createPauseFrames(pauseId, frames.value, sourcesState);
}

function createPauseFrames(pauseId: PauseId, frames: Frame[], sourcesState: SourcesState) {
  return formatCallStackFrames(
    frames.map((frame, index) => createFrame(sourcesState, frame, pauseId, index)),
    sourcesState.sourceDetails.entities
  )!;
}
