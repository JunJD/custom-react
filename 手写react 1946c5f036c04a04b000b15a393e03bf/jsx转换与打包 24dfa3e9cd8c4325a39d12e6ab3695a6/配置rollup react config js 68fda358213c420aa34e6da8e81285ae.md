# 配置rollup/react.config.js

1. 打包目标

react文件夹

1. 脚本获取react文件的package.json文件夹并解析

```tsx
// 借助node的path模块、fs模块、以及两个插件作为rollup的plugin
pnpm i -D -w rollup-plugin-typescript2
pnpm i -D -w @rollup/plugin-commonjs
```

```tsx
// 为了每次打包都可以把上一次的删除，可以安装一下库
pnpm i -D -w rimraf 
```

1. 打包后的文件也需要有package.json文件夹

```tsx
//  借助插件
pnpm i -D -w rollup-plugin-generate-package-json
```

<aside>
📌 以上插件具体使用需要用的时候百度

</aside>