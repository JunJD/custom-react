export type WorkTag =
    | typeof FunctionComponent
    | typeof HostComponent
    | typeof HostRoot
    | typeof HostText
    | typeof Fragment;

export const FunctionComponent = 0;
export const HostRoot = 3;
export const HostComponent = 5;

export const HostText = 6;
export const Fragment = 7;
