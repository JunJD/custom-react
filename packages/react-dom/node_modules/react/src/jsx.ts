/* eslint-disable @typescript-eslint/no-explicit-any */
import { REACT_ELEMNET_TYPE } from "shared/ReactSymbols";
import {
    Ref,
    Type,
    Key,
    Props,
    ReactElementType,
    ElementType,
} from "shared/ReactTypes";
// 定义一下ReactElementType的构造函数

const ReactElement = function (
    type: Type,
    key: Key,
    ref: Ref,
    props: Props
): ReactElementType {
    const element = {
        $$typeof: REACT_ELEMNET_TYPE,
        type,
        key,
        ref,
        props,
        __mark: "junjie",
    };
    return element;
};

export const jsx = (
    type: ElementType,
    config: any,
    ...maybeChildren: any
): ReactElementType => {
    let key: Key = null;
    const props: Props = {};
    let ref: Ref = null;
    for (const prop in config) {
        const val = config[prop];
        if (prop == "key") {
            if (val !== undefined) key = "ding" + val;
            continue;
        }
        if (prop == "ref") {
            if (val !== undefined) ref = val;
            continue;
        }
        if ({}.hasOwnProperty.call(config, prop)) {
            props[prop] = val;
        }
    }

    const length = maybeChildren.length;
    if (length == 1) {
        props.children = maybeChildren[0];
    } else {
        props.children = maybeChildren;
    }

    return ReactElement(type, key, ref, props);
};

export const jsxDEV = (type: ElementType, config: any) => {
    let key: Key = null;
    const props: Props = {};
    let ref: Ref = null;
    for (const prop in config) {
        const val = config[prop];
        if (prop == "key") {
            if (val !== undefined) key = "ding" + val;
            continue;
        }
        if (prop == "ref") {
            if (val !== undefined) ref = val;
            continue;
        }
        if ({}.hasOwnProperty.call(config, prop)) {
            props[prop] = val;
        }
    }

    return ReactElement(type, key, ref, props);
};
