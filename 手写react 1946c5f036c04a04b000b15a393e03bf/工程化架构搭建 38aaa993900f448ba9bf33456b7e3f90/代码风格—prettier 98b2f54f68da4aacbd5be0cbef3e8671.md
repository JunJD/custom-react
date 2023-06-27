# 代码风格—prettier

1. 安装prettier

```
pnpm i -D -w prettier
```

1. 初始化.prettierrc.json(规则可以根据需求修改)

```json
{
    "tabWidth": 4
}
```

1. 将prettier集成到eslint中

先安装两个插件

```
pnpm i -D -w eslint-config-prettier eslint-plugin-prettier
```