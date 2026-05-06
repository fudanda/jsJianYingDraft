from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def collect_effect(enum_cls: Any) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for member in enum_cls:
        meta = member.value
        item: dict[str, Any] = {
            "name": str(meta.name),
            "resourceId": str(meta.resource_id),
            "effectId": str(meta.effect_id),
        }
        params = []
        for param in getattr(meta, "params", []) or []:
            params.append(
                {
                    "name": str(param.name),
                    "defaultValue": float(param.default_value),
                    "minValue": float(param.min_value),
                    "maxValue": float(param.max_value),
                }
            )
        if params:
            item["params"] = params
        result[member.name] = item
    return result


def collect_animation(enum_cls: Any) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for member in enum_cls:
        meta = member.value
        result[member.name] = {
            "title": str(meta.title),
            "duration": int(meta.duration),
            "resourceId": str(meta.resource_id),
            "effectId": str(meta.effect_id),
        }
    return result


def collect_transition(enum_cls: Any) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for member in enum_cls:
        meta = member.value
        result[member.name] = {
            "name": str(meta.name),
            "resourceId": str(meta.resource_id),
            "effectId": str(meta.effect_id),
            "defaultDuration": int(meta.default_duration),
            "isOverlap": bool(meta.is_overlap),
        }
    return result


def collect_mask(enum_cls: Any) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for member in enum_cls:
        meta = member.value
        result[member.name] = {
            "name": str(meta.name),
            "resourceType": str(meta.resource_type),
            "resourceId": str(meta.resource_id),
            "effectId": str(meta.effect_id),
            "defaultAspectRatio": float(meta.default_aspect_ratio),
        }
    return result


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    py_repo_root = repo_root.parent / "pyJianYingDraft"
    py_metadata_root = py_repo_root / "pyJianYingDraft"
    sys.path.insert(0, str(py_metadata_root))

    from metadata.audio_scene_effect import AudioSceneEffectType
    from metadata.filter_meta import FilterType
    from metadata.font_meta import FontType
    from metadata.mask_meta import MaskType
    from metadata.mix_mode_meta import MixModeType
    from metadata.speech_to_song import SpeechToSongType
    from metadata.text_intro import TextIntro
    from metadata.text_loop import TextLoopAnim
    from metadata.text_outro import TextOutro
    from metadata.tone_effect import ToneEffectType
    from metadata.transition_meta import TransitionType
    from metadata.video_character_effect import VideoCharacterEffectType
    from metadata.video_group_animation import GroupAnimationType
    from metadata.video_intro import IntroType
    from metadata.video_outro import OutroType
    from metadata.video_scene_effect import VideoSceneEffectType

    scene = collect_effect(VideoSceneEffectType)
    character = collect_effect(VideoCharacterEffectType)
    filters = collect_effect(FilterType)
    fonts = collect_effect(FontType)
    audio_scene = collect_effect(AudioSceneEffectType)
    tone = collect_effect(ToneEffectType)
    speech_to_song = collect_effect(SpeechToSongType)
    video_intro = collect_animation(IntroType)
    video_outro = collect_animation(OutroType)
    video_group_animation = collect_animation(GroupAnimationType)
    text_intro = collect_animation(TextIntro)
    text_outro = collect_animation(TextOutro)
    text_loop = collect_animation(TextLoopAnim)
    transitions = collect_transition(TransitionType)
    masks = collect_mask(MaskType)
    mix_modes = collect_effect(MixModeType)

    out_path = repo_root / "src" / "metadata.generated.ts"
    content = f"""// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: pyJianYingDraft metadata enums.
// Regenerate with: py scripts/generate_metadata_presets.py

import type {{ AnimationMeta, EffectMeta, FontMeta, MaskMeta, TransitionMeta }} from "./segment.js";

export const GENERATED_VIDEO_SCENE_EFFECT_PRESETS = {json.dumps(scene, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS = {json.dumps(character, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_FILTER_PRESETS = {json.dumps(filters, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_FONT_PRESETS = {json.dumps(fonts, ensure_ascii=False, indent=2)} as const satisfies Record<string, FontMeta>;

export const GENERATED_AUDIO_SCENE_EFFECT_PRESETS = {json.dumps(audio_scene, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_TONE_EFFECT_PRESETS = {json.dumps(tone, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_SPEECH_TO_SONG_PRESETS = {json.dumps(speech_to_song, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_VIDEO_INTRO_PRESETS = {json.dumps(video_intro, ensure_ascii=False, indent=2)} as const satisfies Record<string, AnimationMeta>;

export const GENERATED_VIDEO_OUTRO_PRESETS = {json.dumps(video_outro, ensure_ascii=False, indent=2)} as const satisfies Record<string, AnimationMeta>;

export const GENERATED_VIDEO_GROUP_ANIMATION_PRESETS = {json.dumps(video_group_animation, ensure_ascii=False, indent=2)} as const satisfies Record<string, AnimationMeta>;

export const GENERATED_TEXT_INTRO_PRESETS = {json.dumps(text_intro, ensure_ascii=False, indent=2)} as const satisfies Record<string, AnimationMeta>;

export const GENERATED_TEXT_OUTRO_PRESETS = {json.dumps(text_outro, ensure_ascii=False, indent=2)} as const satisfies Record<string, AnimationMeta>;

export const GENERATED_TEXT_LOOP_ANIMATION_PRESETS = {json.dumps(text_loop, ensure_ascii=False, indent=2)} as const satisfies Record<string, AnimationMeta>;

export const GENERATED_TRANSITION_PRESETS = {json.dumps(transitions, ensure_ascii=False, indent=2)} as const satisfies Record<string, TransitionMeta>;

export const GENERATED_MASK_PRESETS = {json.dumps(masks, ensure_ascii=False, indent=2)} as const satisfies Record<string, MaskMeta>;

export const GENERATED_MIX_MODE_PRESETS = {json.dumps(mix_modes, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;
"""
    out_path.write_text(content, encoding="utf-8")
    print(f"Generated: {out_path}")
    print(f"Scene effects: {len(scene)}")
    print(f"Character effects: {len(character)}")
    print(f"Filters: {len(filters)}")
    print(f"Fonts: {len(fonts)}")
    print(f"Audio scene effects: {len(audio_scene)}")
    print(f"Tone effects: {len(tone)}")
    print(f"Speech to song effects: {len(speech_to_song)}")
    print(f"Video intro animations: {len(video_intro)}")
    print(f"Video outro animations: {len(video_outro)}")
    print(f"Video group animations: {len(video_group_animation)}")
    print(f"Text intro animations: {len(text_intro)}")
    print(f"Text outro animations: {len(text_outro)}")
    print(f"Text loop animations: {len(text_loop)}")
    print(f"Transitions: {len(transitions)}")
    print(f"Masks: {len(masks)}")
    print(f"Mix modes: {len(mix_modes)}")


if __name__ == "__main__":
    main()
