# 蓝豆 LanDou · 蓝舌石龙子静态桌宠

无需构建、无需服务器的纯静态桌宠网页。下载仓库后直接打开 `index.html` 即可运行。

## 功能

- 9 个动画组、61 个可单独选择的细分姿势。
- 纯手动动作模式，不会随机切换动作。
- 支持播放、暂停、上一帧、下一帧和播放整组。
- 支持拖动桌宠，双击蓝豆可切换到挥爪动作。
- 适配桌面和手机浏览器，可通过 `file://` 本地运行。

## 图片资源

全部生成图片都保存在 `assets/`：

- `assets/generated-strips/`：基础定妆图和原始动作条。
- `assets/frames/`：57 张透明 PNG 拆分帧。
- `assets/previews/`：9 个 GIF 动画预览。
- `assets/spritesheet.png`：透明 PNG 图集。
- `assets/contact-sheet.png`：全部动画帧接触表。
- `assets/screenshots/`：桌面版与手机版截图。

网页运行时使用根目录中的 `spritesheet.webp`，尺寸为 1536×1872，包含透明通道。
