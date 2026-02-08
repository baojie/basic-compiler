# BASIC 编译器 · 网页版

在浏览器中运行 BASIC 编译器，可编辑源码并运行，内置**城市管理游戏**示例。

## 运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 使用

1. 点击 **「加载城市管理游戏」** 加载 `city_game.bas` 到编辑器。
2. 点击 **「运行」** 编译并执行。
3. 程序需要输入时，在下方输入框输入数字后点击 **「提交」** 或按回车继续。

## 技术

- **React** + **TypeScript** + **Vite**
- 编译器为 TypeScript 实现：词法 → 语法 → AST → 转译为 JavaScript（支持 `PRINT`、`INPUT`、`GOTO`/`GOSUB`、`FOR`、`IF` 等）
- `INPUT` 通过异步 Promise 实现，在网页中暂停等待用户输入

## 构建

```bash
npm run build
```

产物在 `dist/`，可部署到任意静态托管。
