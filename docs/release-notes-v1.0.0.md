# jsjianyingdraft v1.0.0 Release Notes

## Summary

`v1.0.0` 是一次 **major** 升级，核心目标是让 `jsjianyingdraft` 的 metadata 能力与 `pyJianYingDraft` 严格 1:1 对齐。

- metadata 枚举成员键全面切换为 py 原生成员名
- 主入口字符串 preset 解析与 metadata 子路径行为统一
- 扩展并固化全量 metadata 生成链路（以 `pyJianYingDraft/metadata` 为唯一源）

## Breaking Changes

1. 旧英文枚举成员键已移除
2. 主入口字符串解析不再接受旧英文快捷键
3. `jsjianyingdraft/metadata` 与主入口都只接受 py 成员名风格

示例：

- `MaskType.circle` -> `MaskType.圆形`
- `TransitionType.dissolve` -> `TransitionType.叠化`
- `IntroType.fadeIn` -> `IntroType.渐显`
- `AudioSceneEffectType.echo` -> `AudioSceneEffectType.回音`

## Migration Map (Old -> New)

| Removed key | New key |
| --- | --- |
| `VideoSceneEffectType.vcr` | `VideoSceneEffectType.VCR` |
| `VideoCharacterEffectType.boom` | `VideoCharacterEffectType.BOOM` |
| `FilterType.lofi2` | `FilterType.Lofi_II` |
| `AudioSceneEffectType.echo` | `AudioSceneEffectType.回音` |
| `ToneEffectType.maleTone` | `ToneEffectType.男生` |
| `SpeechToSongType.lofiSong` | `SpeechToSongType.Lofi` |
| `IntroType.fadeIn` | `IntroType.渐显` |
| `OutroType.fadeOut` | `OutroType.渐隐` |
| `GroupAnimationType.split3` | `GroupAnimationType.三分割` |
| `TextIntro.textFadeIn` | `TextIntro.渐显` |
| `TextLoopAnim.textGlitchLoop` | `TextLoopAnim.色差故障` |
| `TransitionType.dissolve` | `TransitionType.叠化` |
| `MaskType.circle` | `MaskType.圆形` |
| `MixModeType.screen` | `MixModeType.滤色` |

## Metadata Coverage (Strict 1:1 Counts)

- `VideoSceneEffectType=1097`
- `VideoCharacterEffectType=240`
- `FilterType=1052`
- `FontType=798`
- `AudioSceneEffectType=85`
- `ToneEffectType=57`
- `SpeechToSongType=6`
- `IntroType=155`
- `OutroType=124`
- `GroupAnimationType=123`
- `TextIntro=145`
- `TextOutro=97`
- `TextLoopAnim=93`
- `TransitionType=453`
- `MaskType=6`
- `MixModeType=10`

## Still Compatible

- `from_name` / `fromName` 归一化查找语义保留（忽略大小写、空格、下划线）
- `snake_case` 类型别名导出保留（例如 `Video_scene_effect_type`）

## Upgrade Checklist

1. 全局搜索并替换旧英文 metadata 键为 py 成员名键
2. 检查字符串 preset 入参（`addEffect/addAnimation/addTransition/addMask/setMixMode`）是否仍使用旧英文键
3. 执行 `npm run generate:metadata && npm run typecheck && npm run test`

## References

- [Changelog](../CHANGELOG.md)
- [Migration Guide](./migration-from-py.md)

