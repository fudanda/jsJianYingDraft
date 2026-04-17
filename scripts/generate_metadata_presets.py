from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def collect(enum_cls: Any) -> dict[str, dict[str, Any]]:
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


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    py_repo_root = repo_root.parent / "pyJianYingDraft"
    sys.path.insert(0, str(py_repo_root))

    from pyJianYingDraft.metadata.filter_meta import FilterType
    from pyJianYingDraft.metadata.video_character_effect import VideoCharacterEffectType
    from pyJianYingDraft.metadata.video_scene_effect import VideoSceneEffectType

    scene = collect(VideoSceneEffectType)
    character = collect(VideoCharacterEffectType)
    filters = collect(FilterType)

    out_path = repo_root / "src" / "metadata.generated.ts"
    content = f"""// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: pyJianYingDraft metadata enums.
// Regenerate with: py scripts/generate_metadata_presets.py

import type {{ EffectMeta }} from "./segment.js";

export const GENERATED_VIDEO_SCENE_EFFECT_PRESETS = {json.dumps(scene, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS = {json.dumps(character, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;

export const GENERATED_FILTER_PRESETS = {json.dumps(filters, ensure_ascii=False, indent=2)} as const satisfies Record<string, EffectMeta>;
"""
    out_path.write_text(content, encoding="utf-8")
    print(f"Generated: {out_path}")
    print(f"Scene effects: {len(scene)}")
    print(f"Character effects: {len(character)}")
    print(f"Filters: {len(filters)}")


if __name__ == "__main__":
    main()
