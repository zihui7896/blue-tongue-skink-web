# 蓝豆静态网页图片资源

本目录包含静态网页对应的全部生成图片，共 81 个文件；不包含在线搜索得到的动物参考照片。

- `generated-strips/`：基础定妆图和 8 张原始动作条。
- `frames/`：按 9 个状态拆分的 57 张透明 PNG 帧；左向跑由右向跑镜像生成。
- `previews/`：9 个状态的 GIF 动画预览。
- `spritesheet.png`：1536×1872 透明 PNG 图集。
- `contact-sheet.png`：全部状态与帧的接触表。
- `screenshots/`：桌面版、手机版和手动动作模式页面截图。

网页运行时使用上一级目录中的 `spritesheet.webp`，以减少加载体积。该 WebP 与最终 Codex 宠物包中的图集内容一致。
