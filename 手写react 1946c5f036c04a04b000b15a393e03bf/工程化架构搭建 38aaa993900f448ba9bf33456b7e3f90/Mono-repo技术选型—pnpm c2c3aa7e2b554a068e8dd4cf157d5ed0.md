# Mono-repo技术选型—pnpm

- 简介
    
    它的名称 pnpm 意为 "pinned npm"，也就是锁定 npm 的功能，并确保安装相同的依赖项只需要一份复制，从而减少了磁盘空间的使用和安装时间。
    
    pnpm 支持多个项目之间共享依赖项，这意味着即使你在多个项目中使用同样的依赖项，这些依赖项只需要安装一次到磁盘上即可，而不是对于每个项目都进行一次重复的安装，从而可以大大节省磁盘空间和时间。
    
    pnpm 还提供了一些额外的功能，例如本地缓存机制、并发安装、安装过程可中断等。它的使用方式与 npm 和 yarn 相似，并且可以轻松地与现有的项目集成。
    
    总的来说，pnpm 是一个优秀的 JavaScript 包管理工具，它能够显著提高依赖项的安装速度和磁盘空间的使用效率。
    
1. 安装pnpm工具

```
npm i -g pnpm 
```

1. pnpm 初始化，生成pacnage.json

```
pnpm init
```

1. 初始化[pnpm-workspace.yaml](https://pnpm.io/zh/pnpm-workspace_yaml)

```yaml
packages:
  # 包的直接子目录中的所有包/
  - 'packages/*'
```

<aside>
📌 Mono-repo中，pnpm i -D -w xxx为安装命令，其中-w指的是安装在根目录的package中

</aside>