
import { Video, FormatGroup, AskFormatModel, DownloadItem } from "./types";



const findAudioFmt = (container: "mp4" | "webm", requiredFmts: AskFormatModel[]) => {
  for (const element of requiredFmts) {
    for (const fmt of element.formatGroup) {
      if (container === "mp4" && fmt.itag === 140) return fmt;
      if (container === "webm" && fmt.itag === 251) return fmt;
    }
  }
  return null;
};

// 🔹 STEP 1: Extract the video/audio selection logic
export function getSelectedFormats(selectedItag: number, requiredFmts: AskFormatModel[]) {
  let selectedVideoFmt: any = null;
  let selectedAudioFmt: any = null;
  
  requiredFmts.forEach((element) => {
    const fmts = element.formatGroup;
    fmts.forEach((fmt) => {
      if (fmt.itag === selectedItag) {
        selectedVideoFmt = fmt;

        if (fmt.url.includes("mime=video%2Fmp4")) {
          selectedAudioFmt = findAudioFmt("mp4", requiredFmts);
        } else if (fmt.url.includes("mime=video%2Fwebm")) {
          selectedAudioFmt = findAudioFmt("webm", requiredFmts);
        } else {
          selectedAudioFmt = fmt;
        }
      }
    });
  });

  return { selectedVideoFmt, selectedAudioFmt };
}



