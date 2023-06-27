/* eslint-disable @typescript-eslint/no-explicit-any */
export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
    $$typeof: symbol | number;
    type: ElementType;
    key: Key;
    ref: Ref;
    props: Props;
    __mark: string;
}

// 更新结构

export type Action<State> = State | ((prev: State) => State);
