# 蓝豆 LanDou · 最终图像生成提示词组

生成方式：Codex 内置 `image_gen`。三张在线蓝舌石龙子照片只作为动物形态参考，动画状态条统一使用生成后的基础定妆图作为身份参考。

## 基础定妆图

```text
Use case: stylized-concept
Asset type: base identity reference for a Codex-compatible animated desktop pet
Primary request: Create a brand-new chibi anime blue-tongued skink mascot inspired by the anatomy and markings in the three wildlife reference photos. Do not copy any photographic background.
Subject: one compact full-body blue-tongued skink desktop buddy, broad blunt oversized head, low bean-shaped stout body, four very short sturdy legs, thick tapering tail, warm caramel-tan scales with clean dark chocolate cross-bands, large glossy amber-brown anime eyes, tiny friendly smile, a small glimpse of vivid cobalt-blue tongue.
Style: polished Japanese chibi mascot illustration, crisp sticker-like line art, rounded silhouette, soft cel shading, readable at 192x208 pixels.
Composition: single three-quarter side view facing right, entire body visible and centered, generous padding.
Background: perfectly flat solid #00ff00 chroma-key background.
Avoid: clothing, accessories, human hair, scenery, floor, shadows, glow, symbols, detached effects, text, watermark, cropping.
```

## 所有状态条共用身份锁

```text
Using the exact same chibi blue-tongued skink identity from the base reference, create one horizontal sprite strip. Frames are separate full-body poses arranged strictly left to right in one row with equal spacing, no borders or labels. Preserve the broad blunt head, low bean-shaped body, four short sturdy legs, thick tapering banded tail, caramel-tan scales, dark chocolate cross-bands and glossy amber-brown eyes. Soft lively Japanese chibi sticker art, crisp outlines, compact desktop-pet proportions. Every pose complete, centered, uncropped, separated and non-overlapping. Perfectly flat solid #00ff00 background. No shadows, scenery, floor, text, watermark, floating symbols or detached effects.
```

## 状态动作提示

- `idle`，6 帧：放松微笑、轻微弹跳、慢眨眼、歪头、害羞收爪、回到循环起点。
- `running-right`，8 帧：右向准备、四肢交替、压缩通过、身体弹起、腾空、落地、蹬地、回环；无速度线和扬尘。
- `running-left`，8 帧：由右向奔跑镜像生成，保持所有标记与动作节奏。
- `waving`，4 帧：害羞站姿、抬起近侧前爪、闭眼大幅挥爪并短暂吐蓝舌、放下前爪回环。
- `jumping`，5 帧：下蹲蓄力、起跳、四爪收起到达最高点并吐蓝舌、下降、柔软压缩落地。
- `failed`，8 帧：惊讶、紧张合爪、贴脸眼泪、低头、闭眼趴下、偷看、恢复希望、害羞微笑。
- `waiting`，6 帧：仰头等待、向左歪头、抬起前爪询问、吐蓝舌微笑、轻弹、耐心回环。
- `running`，6 帧：正面准备、向画面右侧踏步、向左侧踏步、腾空、向前冲刺吐蓝舌、回环。
- `review`，6 帧：好奇、前爪托腮、前倾检查、慢眨眼思考、满意点头、平静回环。
