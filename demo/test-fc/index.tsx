import React, { useState } from "react";
import ReactDom from "react-dom";

function Child() {
    return <span>big react</span>;
}

function APP() {
    const [num, setNum] = useState(100);
    return (
        <div
            onClick={() => {
                setNum(num + 1);
            }}
        >
            {num}
        </div>
    );
}

// console.log(Child());
// console.log(APP());
ReactDom.createRoot(document.querySelector("#root")).render(<APP />);
