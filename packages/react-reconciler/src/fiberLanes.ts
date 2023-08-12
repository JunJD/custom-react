export type Lane = number
export type Lanes = number

export const SyncLane = 0b0000
export const NoLane = 0b0001

export function mergeLanes(laneA: Lane, laneB: Lane) {
    return laneA | laneB
}

export function requestUpdateLane() {
    return SyncLane
}