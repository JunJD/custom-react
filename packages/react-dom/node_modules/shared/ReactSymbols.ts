const supportSymbol = typeof Symbol === "function" && Symbol.for;

export const REACT_ELEMNET_TYPE = supportSymbol
    ? Symbol.for("react.element")
    : 0xeac7;
