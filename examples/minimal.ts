import {
  AudioMaterial,
  AudioSegment,
  DraftFolder,
  TrackType,
  VideoMaterial,
  VideoSegment,
  trange
} from "../src/index.js";

const folder = new DraftFolder("D:/JianYingDrafts");
const script = folder.createDraft("demo-ts", 1920, 1080, { allowReplace: true });

script.addTrack(TrackType.audio).addTrack(TrackType.video);

const video = new VideoMaterial("D:/assets/video.mp4", {
  duration: 8_000_000,
  width: 1920,
  height: 1080
});
const audio = new AudioMaterial("D:/assets/audio.mp3", { duration: 8_000_000 });

script.addSegment(new VideoSegment(video, trange("0s", "8s")));
script.addSegment(new AudioSegment(audio, trange("0s", "8s")));
script.save();
