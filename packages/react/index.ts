/* eslint-disable @typescript-eslint/no-explicit-any */
// react
import { Dispatcher, resolveDispatcher } from "./src/currentDispatcher";
import currentDispatcher from "./src/currentDispatcher";
import { jsxDEV } from "./src/jsx";

export const useState: Dispatcher["useState"] = (initialState) => {
    const dispatcher = resolveDispatcher();
    return dispatcher.useState(initialState);
};

export const __SECRET_INTERNALS_DO_NOT_OR_YOU_BE_FILED = {
    currentDispatcher,
};

export default {
    version: "0.0.0",
    createElement: jsxDEV,
};
