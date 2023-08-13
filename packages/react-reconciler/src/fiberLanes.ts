import { FiberRootNode } from "./fiber"

export type Lane = number
export type Lanes = number

export const SyncLane = 0b0001
export const NoLane = 0b0000
export const NoLanes = 0b0000

// 合并lane
export function mergeLanes(laneA: Lane, laneB: Lane) {
    // console.log('mergeLanes测试: (0b0001 | 0b0001) === 0b0001', (0b0001 | 0b0001) === 0b0001)
    return laneA | laneB
}

export function requestUpdateLane() {
    return SyncLane
}

export function getHighestPriorityLane(lanes: Lanes) {
    return lanes & -lanes
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {

    // return root.finishedLane &= ~lane
    return root.pendingLanes &= ~lane
}