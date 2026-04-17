import { DraftFolder } from "./draft-folder.js";
import { AudioMaterial, CropSettings, VideoMaterial } from "./materials.js";
import {
  AudioSegment,
  ClipSettings,
  EffectSegment,
  FilterSegment,
  KeyframeProperty,
  StickerSegment,
  TextBackground,
  TextBorder,
  TextSegment,
  TextShadow,
  TextStyle,
  VideoSegment
} from "./segment.js";
import { ScriptFile } from "./script-file.js";
import { ExtendMode, ShrinkMode } from "./template-mode.js";
import { TrackType } from "./track.js";

/** @deprecated Use DraftFolder instead. */
export const Draft_folder = DraftFolder;
/** @deprecated Use ScriptFile instead. */
export const Script_file = ScriptFile;

/** @deprecated Use CropSettings instead. */
export const Crop_settings = CropSettings;
/** @deprecated Use VideoMaterial instead. */
export const Video_material = VideoMaterial;
/** @deprecated Use AudioMaterial instead. */
export const Audio_material = AudioMaterial;

/** @deprecated Use ClipSettings instead. */
export const Clip_settings = ClipSettings;
/** @deprecated Use TextStyle instead. */
export const Text_style = TextStyle;
/** @deprecated Use TextBorder instead. */
export const Text_border = TextBorder;
/** @deprecated Use TextBackground instead. */
export const Text_background = TextBackground;
/** @deprecated Use TextShadow instead. */
export const Text_shadow = TextShadow;

/** @deprecated Use VideoSegment instead. */
export const Video_segment = VideoSegment;
/** @deprecated Use AudioSegment instead. */
export const Audio_segment = AudioSegment;
/** @deprecated Use TextSegment instead. */
export const Text_segment = TextSegment;
/** @deprecated Use StickerSegment instead. */
export const Sticker_segment = StickerSegment;
/** @deprecated Use EffectSegment instead. */
export const Effect_segment = EffectSegment;
/** @deprecated Use FilterSegment instead. */
export const Filter_segment = FilterSegment;

/** @deprecated Use TrackType instead. */
export const Track_type = TrackType;
/** @deprecated Use KeyframeProperty instead. */
export const Keyframe_property = KeyframeProperty;
/** @deprecated Use ShrinkMode instead. */
export const Shrink_mode = ShrinkMode;
/** @deprecated Use ExtendMode instead. */
export const Extend_mode = ExtendMode;
