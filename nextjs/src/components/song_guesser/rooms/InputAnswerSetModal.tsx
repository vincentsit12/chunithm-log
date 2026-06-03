import { useState } from "react";
import Modal, { ModalProps } from "components/Modal";
import { CustomSong } from "@/games/GuessSongGame/types";

const InputAnswerSetModal: React.FC<
  Omit<ModalProps, "children"> & {
    youtube_link: string;
    callBack: (songs: CustomSong[]) => void;
  }
> = ({ isOpen, setIsOpen, callBack, youtube_link }) => {
  const [answerSetText, setAnswerSetText] = useState(
    `Season 1
            00:00 - Hishoku no Sora「Mami Kawada」
            04:15 - Yoake Umarekuru Shoujo「Youko Takahashi」
            08:27 - being「KOTOKO」
            13:14 - Aka no Seijaku「Yoko Ishida」
            __________________________________
            Season 2
            18:25 - JOINT「Mami Kawada」
            22:25 - triangle「Mami Kawada」
            27:14 - BLAZE「KOTOKO」
            32:19 - Sociometry「KOTOKO」
            37:03 - sense「Mami Kawada」
            __________________________________
            Season 3
            41:16 - Light My Fire「KOTOKO」
            45:02 - I'll believe「Altima」- Rest in peace Maon Kurosaki
            50:42 - Serment「Mami Kawada」
            54:50 - ONE「Altima」
            59:58 - u/n「Mami Kawada」
            1:04:06 - Koubou「Mami Kawada`,
  );

  return (
    <Modal
      title={"Please Input the answer set"}
      positiveBtnText={"Convert"}
      rightBtnCallBack={() => {
        let answerSetTextArray = answerSetText.split("\n");
        const re = /([0-9]?[0-9]:)?([0-5][0-9])(:[0-5][0-9])/;
        let songList: CustomSong[] = [];
        answerSetTextArray.map((k, i) => {
          let test = re.exec(k);
          if (test) {
            let time = test[0].split(":");
            let duration = 0;
            time.forEach((z, i) => {
              duration += parseInt(z) * Math.pow(60, time.length - 1 - i);
            });
            let songName = k.replaceAll(test[0], "");
            songList.push({
              id: i,
              youtube_link,
              display_name: songName,
              startTime: duration,
            });
          }
        });
        if (songList.length == 0) {
          callBack([{ id: 0, youtube_link, display_name: answerSetText, startTime: 0 }]);
          return;
        }
        callBack(songList);
      }}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <div className="px-5">
        <textarea
          value={answerSetText}
          onChange={(e) => setAnswerSetText(e.target.value)}
          placeholder={`Song Name - [mm:ss]\nSong Name - [mm:ss]\nSong Name - [mm:ss]\nSong Name - [mm:ss]\nSong Name - [mm:ss]\n`}
          className="guess-song-game-input h-[300px] w-full p-4"
        ></textarea>
      </div>
    </Modal>
  );
};

export default InputAnswerSetModal;
