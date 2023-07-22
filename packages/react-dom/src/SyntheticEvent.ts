import { Props } from "shared/ReactTypes";
import { Container } from "./hostConfig";
export const elementPropsKey = "__props";
const validEventTypeList = ["click"];
export interface DOMElement extends Element {
    [elementPropsKey]: Props;
}

type EventCallback = (e: Event) => void;

interface Paths {
    capture: EventCallback[];
    bubble: EventCallback[];
}

interface SyntheticEvent extends Event {
    __stopPropagation: boolean;
}

export function updateFiberProps(node: DOMElement, props: Props) {
    node[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
    if (!validEventTypeList.includes(eventType)) {
        console.warn("当前不支持==>", eventType);
    }
    if (__DEV__) {
        console.log("初始化事件：", eventType);
    }

    container.addEventListener(eventType, (e: Event) => {
        dispatchEvent(container, eventType, e);
    });
}

function createSyntheticEvent(e: Event): SyntheticEvent {
    const syntheticEvent = e as SyntheticEvent;
    syntheticEvent.__stopPropagation = false;
    const originStopPropagation = e.stopPropagation;
    syntheticEvent.stopPropagation = () => {
        syntheticEvent.__stopPropagation = true;
        if (originStopPropagation) {
            originStopPropagation();
        }
    };
    return syntheticEvent;
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
    const targetElement = e.target as unknown;
    if (targetElement === null) {
        return;
    }

    // 1. 收集沿途的事件
    const { capture, bubble } = collectPaths(
        targetElement as DOMElement,
        container,
        eventType
    );
    // 2. 构造合成事件
    const se = createSyntheticEvent(e);
    // 3. 遍历capture 捕获
    triggerEventFlow(capture, se);
    if (!se.__stopPropagation) {
        // 4. 遍历bubble 冒泡
        triggerEventFlow(bubble, se);
    }
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
    for (let i = 0; i < paths.length; i++) {
        const callback = paths[i];
        callback.call(null, se);
        if (se.__stopPropagation) {
            break;
        }
    }
}

function getEventCallbackNameFormEventType(
    eventType: string
): string[] | undefined {
    return {
        // [捕获阶段, 冒泡阶段]
        click: ["onClickCapture", "onClick"],
    }[eventType];
}

function collectPaths(
    targetElement: DOMElement,
    container: Container,
    eventType: string
) {
    const paths: Paths = {
        capture: [],
        bubble: [],
    };
    while (targetElement && targetElement !== container) {
        // 收集的过程
        const elementProps = targetElement[elementPropsKey];
        if (elementProps) {
            const callbackNameList =
                getEventCallbackNameFormEventType(eventType);
            if (callbackNameList) {
                callbackNameList.forEach((callbackName, index) => {
                    const eventCallback = elementProps[callbackName];
                    if (eventCallback) {
                        if (index === 0) {
                            paths.capture.unshift(eventCallback);
                        } else {
                            paths.bubble.push(eventCallback);
                        }
                    }
                });
            }
        }
        targetElement = targetElement.parentElement as unknown as DOMElement;
    }
    return paths;
}
