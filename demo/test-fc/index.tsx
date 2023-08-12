import React, { useState } from "react";
import ReactDom from "react-dom";

function APP() {
    const [num, setNum] = useState(1);

    const arr =
        num % 2 !== 0
            ? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
            : [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

    return (
        <>
            <ul
                onClick={() => {
                    setNum(num + 1);
                    setNum(num + 1);
                    setNum(num + 1);
                    console.log('同步', document.querySelector('li')?.innerText);
                    Promise.resolve().then(() => {
                        console.log('micro', document.querySelector('li')?.innerText)
                    })
                    setTimeout(() => {
                        console.log('宏任务', document.querySelector('li')?.innerText)
                    }, 0);
                    console.log('start');
                    // for (const item of new Array(100).fill(null)) {
                    //     setNum(num + item);
                    // }

                }}
            >
                {arr}
            </ul>
            <li>{num}</li>
        </>
    );
}

// console.log(Child());
// console.log(APP());
ReactDom.createRoot(document.querySelector("#root") as HTMLElement).render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (<APP />) as any
);
