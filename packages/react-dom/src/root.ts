// ReactDom.createRoot(root).render(jsx)

import {
    createContainer,
    updateContainer,
} from "react-reconciler/src/fiberReconciler";
import { ReactElementType } from "shared/ReactTypes";
import { Container } from "./hostConfig";
import { initEvent } from "./SyntheticEvent";

export function createRoot(container?: Container) {
    if (!container) {
        throw new Error("container不能为null");
    }
    const root = createContainer(container);

    return {
        render(element: ReactElementType) {
            // 代理click事件
            initEvent(container, "click");
            updateContainer(element, root);
        },
    };
}

export const $$mark = "dingjunjie";
