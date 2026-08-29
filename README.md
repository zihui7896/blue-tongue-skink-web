# 蓝豆 LanDou · 桌宠与代码特效

无需构建的纯静态创意网页。下载仓库后，用任意静态服务器指向本目录即可预览。

## 页面入口

- `index.html`：独立欢迎首页，可选择进入桌宠或代码特效。
- `workspace.html#playground`：蓝豆桌宠工作台。
- `workspace.html#cat`：橘团桌宠工作台，是侧边栏中的独立栏目。
- `workspace.html#otter`：小獭桌宠工作台，使用 SVG 与 CSS 绘制和动画。
- `workspace.html#effects`：代码特效画廊。
- 工作台内的视图切换会写入浏览器历史，可使用前进、后退返回上一视图。

## 功能

- 蓝豆和橘团两个精灵图桌宠栏目，每只都有 9 个动画组、57 个可单独选择的细分姿势。
- 小獭是独立的 SVG 桌宠，支持打招呼、送小鱼、午睡、拖动与方向键移动。
- 纯手动动作模式，不会随机切换动作。
- 支持播放、暂停、上一帧、下一帧和播放整组。
- 支持拖动桌宠，双击蓝豆可切换到挥爪动作。
- 可折叠的侧边栏与桌宠 / 代码特效双视图，并可随时返回欢迎首页。
- “绽放”3D 花体特效：高质感透明花朵由 Canvas 控制盛开、呼吸和景深粒子，可重播并调整速度。
- 适配桌面和手机浏览器，使用任意静态服务器即可运行（例如 `python -m http.server 4173`）。

## 目录结构

- `styles/`：全局设计变量、布局与组件样式。
- `scripts/components/`：侧边栏等通用界面组件。
- `scripts/features/`：桌宠与特效画廊功能入口。
- `scripts/effects/`：每一种代码特效独立一个文件夹。
- `scripts/data/`：桌宠动作数据。
- `ju-tuan-cat/`：橘团的 Codex 桌宠包、网页图集与完整生成工作目录。

## 图片资源

全部生成图片都保存在 `assets/`：

- `assets/generated-strips/`：基础定妆图和原始动作条。
- `assets/frames/`：57 张透明 PNG 拆分帧。
- `assets/previews/`：9 个 GIF 动画预览。
- `assets/spritesheet.png`：透明 PNG 图集。
- `assets/contact-sheet.png`：全部动画帧接触表。
- `assets/screenshots/`：桌面版与手机版截图。

网页运行时使用根目录中的 `spritesheet.webp`，尺寸为 1536×1872，包含透明通道。

橘团网页运行时使用 `ju-tuan-cat/spritesheet.webp`；可编辑源动作条、透明拆分帧、GIF 预览、接触表和校验结果保存在 `ju-tuan-cat/work/`。同一套桌宠包也安装在 Codex 的 `pets/ju-tuan-cat/` 目录中。

小獭不依赖外部图片，角色造型直接写在 `workspace.html` 的内联 SVG 中，互动状态与动画分别位于 `scripts/features/otter-pet.js` 和 `styles/components/otter-pet.css`。

## 测试

项目使用 Node 内置测试运行器，无需安装依赖：

```bash
npm test
```
