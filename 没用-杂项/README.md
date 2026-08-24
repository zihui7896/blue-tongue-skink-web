# 蓝豆 LanDou

卡通蓝舌石龙子 Codex 桌宠，包含 9 个状态、61 个有效帧、逐状态 GIF 预览与可编辑中间帧。

## 使用方式

- Codex：宠物包已安装到 `C:\Users\Administrator\.codex\pets\lan-dou-skink`，在 Codex 的桌宠选择器中选择“蓝豆 LanDou”。
- 独立网页：双击 `打开蓝豆桌宠.bat`，或直接打开 `web\index.html`。静态版采用手动动作模式，不会随机切换；可选择 9 个动画组、61 个细分姿势，并支持播放/暂停、上一帧和下一帧。
- 项目页面：运行 `npm run dev` 后访问 `http://localhost:3000/blue-tongue-skink`。

## 主要产物

- `final/spritesheet.webp`：Codex 使用的透明动画图集。
- `qa/contact-sheet.png`：全部动画帧接触表。
- `qa/previews/*.gif`：逐状态动画预览。
- `intermediate/frames/`：可继续编辑的透明单帧。
- `intermediate/generated-strips/`：图像生成阶段的原始动作条。
- `web/index.html`：无需构建即可运行的静态桌宠页面。
- `web/assets/`：静态网页配套的全部生成图片，包括动作条、拆分帧、GIF、PNG 图集、接触表和页面截图。

角色设计以在线自然观察图中的蓝舌石龙子为形态参考：宽钝头、粗短身体、短肢、深浅横纹、厚尾和钴蓝色舌头。
