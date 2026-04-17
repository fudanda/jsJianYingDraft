# jsJianYingDraft 中文说明

`jsjianyingdraft` 是 `pyJianYingDraft` 的 TypeScript 迁移版本，支持 npm 安装与发布，适合在 Node.js/TS 项目中生成和编辑剪映草稿。

## 项目定位

本包重点是“保持 Python 迁移体验 + 提供 TypeScript 工程能力”：

- 提供完整类型定义（TypeScript 友好）
- 支持 ESM + CJS 双构建产物
- 保留大量 Python 风格 `snake_case` 兼容别名
- 支持从 `pyJianYingDraft` 自动生成的 metadata 预设集

## 功能概览（v0.7.x）

- 草稿目录管理：创建、读取、删除、复制
- 草稿编辑核心：`ScriptFile`、`Track`、各类 `Segment` / `Material`
- 时间工具：`SEC`、`tim`、`Timerange`、`trange`、`srtTstamp`
- 模板编辑流程：`loadTemplate`、`getImportedTrack`、`replaceMaterialByName`、`replaceMaterialBySeg`、`replaceText`、`importTrack`
- 特效与滤镜：全局与片段级 `addEffect` / `addFilter`
- 视频高级能力：关键帧、动画、遮罩、转场、混合模式、背景填充
- 元数据子路径导出：`jsjianyingdraft/metadata`
- Python 风格 metadata 枚举对象与 `from_name` 查找
- Windows 自动化导出控制器：`JianyingController`
- 媒体信息自动探测（可用时自动识别时长/宽高）

## 安装

```bash
npm install jsjianyingdraft
```

## 快速开始

```ts
import {
  AudioMaterial,
  AudioSegment,
  DraftFolder,
  TrackType,
  VideoMaterial,
  VideoSegment,
  trange
} from "jsjianyingdraft";

const folder = new DraftFolder("D:/JianYingDrafts");
const script = folder.createDraft("demo-ts", 1920, 1080, { allowReplace: true });

script.addTrack(TrackType.video).addTrack(TrackType.audio).addTrack(TrackType.text, "subtitle");

const video = new VideoMaterial("D:/assets/video.mp4", {
  duration: 8_000_000,
  width: 1920,
  height: 1080
});
const audio = new AudioMaterial("D:/assets/audio.mp3", { duration: 8_000_000 });

script
  .addSegment(new VideoSegment(video, trange("0s", "8s")))
  .addSegment(new AudioSegment(audio, trange("0s", "8s")))
  .importSrt("D:/assets/subtitle.srt", "subtitle")
  .save();
```

## 从 pyJianYingDraft 迁移（速查）

| Python 风格 | 推荐 TS API | 当前兼容别名 |
| --- | --- | --- |
| `Draft_folder` | `DraftFolder` | `Draft_folder` |
| `Script_file` | `ScriptFile` | `Script_file` |
| `Video_segment` | `VideoSegment` | `Video_segment` |
| `Audio_segment` | `AudioSegment` | `Audio_segment` |
| `Text_segment` | `TextSegment` | `Text_segment` |
| `Track_type` | `TrackType` | `Track_type` |
| `add_track` | `addTrack` | `add_track` |
| `add_segment` | `addSegment` | `add_segment` |
| `import_srt` | `importSrt` | `import_srt` |
| `replace_material_by_seg` | `replaceMaterialBySeg` | `replace_material_by_seg` |

详细迁移说明可查看同目录文档：`migration-from-py.md`。

## 常见用法

### 1) 直接用文件路径构造 Segment

```ts
import { AudioSegment, Timerange, VideoSegment } from "jsjianyingdraft";

const videoSeg = new VideoSegment("D:/assets/clip.mp4", new Timerange(0, 3_000_000), {
  materialOptions: { duration: 3_000_000, width: 1920, height: 1080 }
});

const audioSeg = new AudioSegment("D:/assets/music.mp3", new Timerange(0, 3_000_000), {
  materialOptions: { duration: 3_000_000 }
});
```

说明：

- 推荐使用 `materialOptions`
- `material_options` 仍可用（兼容别名，已标记为废弃）

### 2) `importSrt` 的 `styleReference` 语义

```ts
import { ClipSettings, ScriptFile, TextSegment, TextStyle, Timerange } from "jsjianyingdraft";

const script = new ScriptFile(1920, 1080);
const styleRef = new TextSegment("template", new Timerange(0, 1_000_000), {
  style: new TextStyle({ bold: true }),
  clipSettings: new ClipSettings({ transformY: 0.66 })
});

script.importSrt("D:/assets/subtitle.srt", "subtitle", {
  styleReference: styleRef,
  clipSettings: null
});
```

与 py 行为对齐：

- 设置了 `styleReference` 且未传 `clipSettings`：`clipSettings` 重置为默认值
- 显式传 `clipSettings: null`：继承 `styleReference` 的 `clipSettings`
- 兼容别名：`style_reference`、`clip_settings`、`text_style`、`time_offset`

### 3) metadata 预设与 `from_name`

```ts
import { ScriptFile, Timerange, TrackType } from "jsjianyingdraft";
import { FilterType, VideoSceneEffectType } from "jsjianyingdraft/metadata";

const script = new ScriptFile(1920, 1080);
script.addTrack(TrackType.effect).addTrack(TrackType.filter);

const vcr = VideoSceneEffectType.from_name("v c r");
const lofi2 = FilterType.fromName("LOFI_2");

script.addEffect(vcr, new Timerange(0, 1_000_000));
script.addFilter(lofi2, new Timerange(0, 1_000_000));
```

说明：

- metadata 枚举对象支持 `from_name` / `fromName`
- metadata 查找会忽略大小写、空格、下划线
- `TrackType.from_name` 更严格，要求精确 track 名（例如 `video`、`audio`）

### 4) Windows 自动化导出与超时错误

```ts
import {
  DraftNotFoundError,
  ExportFramerate,
  ExportResolution,
  ExportTimeoutError,
  JianyingController
} from "jsjianyingdraft";

const ctrl = new JianyingController();

try {
  ctrl.exportDraft("demo-ts", {
    outputPath: "D:/exports/demo-ts.mp4",
    resolution: ExportResolution.RES_1080P,
    framerate: ExportFramerate.FR_30,
    timeout: 1200
  });
} catch (error) {
  if (error instanceof DraftNotFoundError) {
    // 草稿不存在
  } else if (error instanceof ExportTimeoutError) {
    // 导出超时
  } else {
    // 其他自动化错误
  }
}
```

## 媒体自动探测

`VideoMaterial` / `AudioMaterial` 会尝试自动探测媒体信息：

- 优先使用 `ffprobe`（若环境可用）
- 回退解析：
  - 图片尺寸（PNG/JPEG/GIF/BMP）
  - WAV 时长
- 若仍无法探测，请在构造时手动传入 `duration`（以及视频的 `width`/`height`）

## 已知限制

- `JianyingController` 依赖 Windows UI 自动化，仅支持 Windows。
- 自动化导出流程当前主要面向剪映 6.x 及以下版本。
- 某些媒体格式的自动探测结果依赖本机 `ffprobe` 可用性。

## 开发与发布

开发常用命令：

```bash
npm install
npm run build
npm run typecheck
npm run test
```

版本与发布：

```bash
npm run changeset
npm run version-packages
npm run release
```

发布前校验（包含 `tsdown`、`Vitest`、`publint`、`Are the types wrong?`）：

```bash
npm run check:release
```
