# react包中实现

reactElement函数接受type、ref、props、key，返回一个element对象

element对象

```tsx
export interface ReactElementType {
    $$typeof: symbol | number;
    type: ElementType;
    key: Key;
    ref: Ref;
    props: Props;
		// react中没有，
    __mark: string;
}
```

jsx函数接受type、config和…mabychildren, 其中type是elementType，而config是key、ref、proptest、proptest，对于key和ref需要取出来单独处理，其余只有是非原型上的都可以赋值都props上，可以用hasOwnproperty判断，mabychildren是个数组，但可能值是一个也能是多个，需要分支判断

```tsx
import React from "react"
export ()=>{
	const ref = React.useRef(null)
	return (
		<div key='id' ref={ref} proptest proptest={2}>aa</div>
	)
}

```