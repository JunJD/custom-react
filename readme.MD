<!-- multi-repo -->
每个库有自己独立的仓库


<!-- Mono-repo -->
方便协同管理不同独立库的生命周期


parser 用什么样的规则将ts解析成抽象语法树

eslint做语法检查，prettier做格式检查，husky提交git的
生命周期

prettie做格式检查

husky做git提交检查
0. 安装：pnpm i husky -D -w  / npx husky install; lint配置:    "lint": "eslint --ext .ts,.tsx,.js,.jsx --fix --quiet ./packages"
1. 提交前执行配置：npx husky .husky/pre-commit "pnpm lint"
2. 
### commit提交规范检查配置：pnpm i @commitlint/config-conventional -D -w
### 新建配置文件.commitlintrc.js 【module.exports = { extends: ['@commitlint/config-conventional']}】
### npx husky add .husky/commit-msg "npx --no-install commitlint -e $HUSKY_GIT_PARAMS"
提交的类型：
feat: 添加新功能
fix: 修复bug
chore: 一些不影响功能的修改
docs: 专指文档的修改
perf: 性能优化方面
refactor: 代码重构
test: 添加一些测试代码等

3. ts配置

4. rollup 轻量打包工具
### 插件使用 
rollup-plugin-typescript2 是一个 Rollup 插件，用于将 TypeScript 代码构建为 JavaScript 代码。它允许使用 TypeScript 语法进行编写和类型检查，同时将其转换为 JavaScript 代码。使用该插件可以更加方便地进行模块化开发，提高代码质量和可维护性。

@rollup/plugin-commonjs 是一个 Rollup 插件，用于在 Rollup 中使用 CommonJS 模块加载器。它将 CommonJS 模块转换为 ES6 模块格式，以便在 Rollup 中使用。这个插件特别适用于在 Rollup 中使用一些基于 CommonJS 模块规范编写的模块，例如一些 Node.js 模块等。通过使用 @rollup/plugin-commonjs 插件，可以让这些模块更加容易地在 Rollup 中使用，并且可以获得更好的代码优化和打包结果。


5. 创建script \ rollup





# jsx实现


