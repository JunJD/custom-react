import { Props } from "shared/ReactTypes";

import { DOMElement, updateFiberProps } from "./SyntheticEvent";

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export function createInstance(type: string, props: Props) {
    // todo 处理props
    const element = document.createElement(type) as unknown;
    // 将事件回调保存在DOM中，创建DOM时
    updateFiberProps(element as DOMElement, props);
    return element as DOMElement;
}

export function createTestInstance(content: string) {
    return document.createTextNode(content);
}

export function appendInitialChild(parent: Instance, child: Instance) {
    parent.appendChild(child);
}

export function removeChild(
    container: Container,
    child: Instance | TextInstance
) {
    container.removeChild(child);
}

export const appendChildToContainer = appendInitialChild;