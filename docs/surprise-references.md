# 心动宇宙：设计与运行说明

入口：`workspace.html#surprise`，工作台侧边栏第 04 栏。欢迎首页不增加导航。

## 设计参考

- [Pinterest Predicts 2025](https://newsroom.pinterest.com/news/pinterest-predicts-20-bold-trends-for-2025/)：光晕美学、海洋幻想等趋势，作为珠光、粉紫和极光配色的灵感。该报告不是对所有女性审美偏好的证明。
- [Pinterest Palette 2025](https://newsroom.pinterest.com/en-gb/news/from-butter-yellow-to-cherry-red-meet-the-2025-pinterest-palette/)：Aura 紫色的配色参考。
- [HelloEnjoy](https://helloenjoy.com/home)：HelloFlower 的旋转探索、触碰反馈，以及 Lights 的沉浸式体验作为交互参考。
- [teamLab Floating Flower Garden](https://prd-art.team-lab.cn/en/w/ffgarden/)：观众参与改变空间体验的思路。

## 壮观星空升级参考

- [Google 100,000 Stars](https://experiments.withgoogle.com/100000-stars)：参考其从银河到恒星的空间尺度和缩放交互。该作品包含真实近邻恒星位置，而本项目是艺术化程序星系，不使用科学星表。
- [NASA Cosmic Cliffs](https://science.nasa.gov/asset/webb/cosmic-cliffs-in-the-carina-nebula-nircam-and-miri-composite-image/)：参考星云的疏密层次和冷暖对比。
- [Gaia’s View of the Milky Way / ESO](https://www.eso.org/public/images/eso1908e/)：参考密集星带、亮度变化与银河空间尺度。

当前场景为原创程序化 WebGL 旋涡银河：桌面 64,000 颗银河星点，手机 26,000 颗，另有云雾粒子和远景星海。使用本地 Three.js 0.160.1，许可保存在 `scripts/vendor/THREE-LICENSE.txt`，打开后不依赖外部 CDN。没有复制参考网站模型、图片或星表。

## 交互

- 拖动旋转、点击释放星光；键盘方向键旋转，空格释放星光。
- 滚轮或键盘 +/- 缩放；「穿越星河」执行约 5.5 秒的镜头推进和星光拖尾，再返回原来的缩放距离。减少动态效果模式下以星光反馈替代穿越。
- 三种配色可切换，支持暂停；系统减少动态效果偏好默认暂停。
- 输入名字打开信笺，名字使用 textContent 展示，不解析为 HTML。不上传或存储名字。
- 离开栏目或切到后台会停止渲染；再次进入恢复。
- WebGL 不可用时显示说明，信笺仍可使用。

## 检查范围

完成 JavaScript 语法、静态资源与模块路径、四个侧边栏路由和初始深链接的检查。银河升级使用真实 Three.js 场景对象和替代渲染器检查了 64,000 星点坐标有效性、配色切换、缩放边界、穿越结束及镜头复位、暂停、星光结束、隐藏栏目停止渲染，并确认预览 HTTP 200。该检查不涵盖 GPU 着色器编译或浏览器视觉效果；实际 GPU 表现需要在目标设备确认。
