# 蓝豆 LanDou · 桌宠与代码特效

无需构建的纯静态创意网页。下载仓库后，用任意静态服务器指向本目录即可预览。

## 功能

- 9 个动画组、57 个可单独选择的细分姿势。
- 纯手动动作模式，不会随机切换动作。
- 支持播放、暂停、上一帧、下一帧和播放整组。
- 支持拖动桌宠，双击蓝豆可切换到挥爪动作。
- 可折叠的侧边栏与桌宠 / 代码特效双视图。
- “绽放”3D 花体特效：高质感透明花朵由 Canvas 控制盛开、呼吸和景深粒子，可重播并调整速度。
- 适配桌面和手机浏览器，使用任意静态服务器即可运行（例如 `python -m http.server 4173`）。

## 目录结构

- `styles/`：全局设计变量、布局与组件样式。
- `scripts/components/`：侧边栏等通用界面组件。
- `scripts/features/`：桌宠与特效画廊功能入口。
- `scripts/effects/`：每一种代码特效独立一个文件夹。
- `scripts/data/`：桌宠动作数据。

## 图片资源

全部生成图片都保存在 `assets/`：

- `assets/generated-strips/`：基础定妆图和原始动作条。
- `assets/frames/`：57 张透明 PNG 拆分帧。
- `assets/previews/`：9 个 GIF 动画预览。
- `assets/spritesheet.png`：透明 PNG 图集。
- `assets/contact-sheet.png`：全部动画帧接触表。
- `assets/screenshots/`：桌面版与手机版截图。

网页运行时使用根目录中的 `spritesheet.webp`，尺寸为 1536×1872，包含透明通道。
