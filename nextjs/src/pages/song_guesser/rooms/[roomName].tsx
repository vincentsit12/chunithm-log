import axios from "axios";
import { useSession } from "next-auth/react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  SetStateAction,
  Dispatch,
} from "react";
import _, { uniqBy, values } from "lodash";
import YouTube, { YouTubeEvent, YouTubeProps } from "react-youtube";
import Songs, { MaimaiSongs } from "db/model/songs";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { useRouter } from "next/router";
import { Bounce, Id, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaFlag, FaRobot, FaArrowLeft, FaHome } from "react-icons/fa";
import {
  MdMusicNote,
  MdChatBubble,
  MdGamepad,
  MdPeople,
  MdSettings,
  MdShuffle,
  MdReplay,
  MdTimer,
  MdSkipNext,
  MdStar,
  MdVideoLibrary,
  MdNavigateNext,
  MdTune,
  MdChevronLeft,
  MdChevronRight,
  MdPlayArrow,
} from "react-icons/md";

import ListBox from "components/ListBox";
import { MessageDetails } from "types";
import classNames from "classnames";
import {
  CustomSong,
  GuessGameSong,
  GuessSongGameOption,
  PlaylistSummary,
  RoomInfo,
} from "@/games/GuessSongGame/types";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { BackdropScene } from "@/components/ui/BackdropScene";
import { SongGuesserLogo } from "@/components/ui/SongGuesserLogo";
import LoadingView from "@/components/song_guesser/rooms/LoadingView";
import ChatMessageComponent, {
  ChatMessage,
  determineMessageType,
} from "@/components/song_guesser/rooms/ChatMessageComponent";
import HostYouTubeDock from "@/components/song_guesser/rooms/HostYouTubeDock";
import InputAnswerSetModal from "@/components/song_guesser/rooms/InputAnswerSetModal";
import { useSocketClient } from "@/hooks/song_guesser/useSocketClient";
import { useDraggableDock } from "@/hooks/song_guesser/useDraggableDock";
import { useGuessSongGame } from "@/hooks/song_guesser/useGuessSongGame";

type RequestType = "replay" | "longer" | "anotherSection";
type PlaylistMode =
  | "catalog_chunithm"
  | "catalog_maimai"
  | "youtube_playlist"
  | "custom";

const generateLevel = () => {
  let x = [];
  for (let i = 15.4; i >= 13.0; i -= 0.1) {
    let key = (i + 0.00001).toFixed(1);
    x.push({ name: `${key}`, value: parseFloat(key) });
  }
  return x;
};

const generateChoices = () => {
  let x = [];
  for (let i = 10; i >= 0; i -= 1) {
    let key = i;
    x.push({ name: `${key}`, value: i });
  }
  return x;
};

const systemPlaylists = [
  {
    id: "system:chunithm",
    name: "Chunithm (System)",
    creator: "system",
    source_type: "catalog_chunithm",
  },
  {
    id: "system:maimai",
    name: "Maimai (System)",
    creator: "system",
    source_type: "catalog_maimai",
  },
] as PlaylistSummary[];

const level = generateLevel();
const answerChoices = generateChoices();
const chunithmDefaulLevelRange: [number, number] = [14.0, 15.4];
const maimaiDefaulLevelRange: [number, number] = [14.0, 15];

const GuessSongGame = () => {
  // State to store the messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // State to store the current message
  const [currentMessage, setCurrentMessage] = useState("");

  const { socket, state } = useSocketClient();

  const { data: session, status } = useSession();

  const [answer, setAnswer] = useState<string>();

  const [currentSong, setCurrentSong] = useState<GuessGameSong>();

  const [songList, setSongList] = useState<GuessGameSong[]>([]);
  const [filteredSongList, setFilteredSongList] =
    useState<GuessGameSong[]>(songList);

  const youtubeRef = useRef<YouTubeEvent>();

  const router = useRouter();

  const roomID = router.query.roomName;

  const [isHost, setIsHost] = useState(false);

  const [isJoined, setIsJoined] = useState(false);

  const [shouldSendBufferedSignal, setShouldSendBufferedSignal] =
    useState(true);
  const [shouldGetNewRandomStartTime, setShouldGetNewRandomStartTime] =
    useState(false);
  const [shouldStartNewRound, setShouldStartNewRound] = useState(true);

  const [isYouTubeDockExpanded, setIsYouTubeDockExpanded] = useState(true);
  const [isYouTubeDockVisible, setIsYouTubeDockVisible] = useState(true);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isPlayersPanelOpen, setIsPlayersPanelOpen] = useState(true);
  const [isLoadingSongList, setIsLoadingSongList] = useState(false);
  const [isLoadingNextSong, setIsLoadingNextSong] = useState(false);
  const [isInputAnswerSetModalOpen, setIsInputAnswerSetModalOpen] =
    useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  // Custom youtube link
  const [customYoutubeLink, setCustomYoutubeLink] =
    useState<string>("PvC92bu-PZs");
  const [customSongList, setCustomSongList] = useState<CustomSong[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const {
    dockRef: youtubeDockRef,
    position: youtubeDockPosition,
    clampToViewport: clampYouTubeDockToViewport,
    onPointerDown: startDraggingDock,
    onPointerMove: dragDock,
    onPointerUp: stopDraggingDock,
  } = useDraggableDock();

  useEffect(() => {
    if (!isHost || !isYouTubeDockVisible) return;

    const rafId = window.requestAnimationFrame(() => {
      clampYouTubeDockToViewport();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [
    clampYouTubeDockToViewport,
    isHost,
    isYouTubeDockExpanded,
    isYouTubeDockVisible,
  ]);

  const [playlists, setPlaylists] =
    useState<PlaylistSummary[]>(systemPlaylists);
  const [selectedPlaylist, setSelectedPlaylist] = useState<{
    name: string;
    value: string | number;
  }>({
    name: "Chunithm (System)",
    value: "system:chunithm",
  });
  const [selectedPlaylistMode, setSelectedPlaylistMode] =
    useState<PlaylistMode>("catalog_chunithm");
  const [answerRaceChoicesNumber, setAnswerRaceChoicesNumber] = useState(
    answerChoices[0],
  );

  const [lowerLevelRange, setLowerLevelRange] = useState<{
    name: string;
    value: number;
  }>(level.find((k) => k.value == chunithmDefaulLevelRange[0])!);
  const [upperLevelRange, setUpperLevelRange] = useState<{
    name: string;
    value: number;
  }>(level.find((k) => k.value == chunithmDefaulLevelRange[1])!);

  const [playlist, setPlaylist] = useState<string>("");

  const [gameOption, setGameOption] = useState<GuessSongGameOption>({
    youtubeID: "69plnXaTTnE",
    startTime: "10",
    duration: "2",
    isFixedStartTime: false,
    answerRaceChoices: [],
    answerRaceChoicesNumber: answerRaceChoicesNumber.value,
  });

  const [roomInfo, setRoomInfo] = useState<RoomInfo>();

  const timer = useRef<NodeJS.Timeout>();

  const replayRef = useRef<Id>();
  const longerRef = useRef<Id>();
  const anotherSectionRef = useRef<Id>();

  const cueYouTubeVideo = useCallback((youtubeId: string) => {
    if (!youtubeId) return;
    youtubeRef.current?.target.cueVideoById({
      videoId: youtubeId,
      startSeconds: parseFloat(gameOption.startTime),
      endSeconds:
        parseFloat(gameOption.startTime) + parseFloat(gameOption.duration),
    });
  }, []);

  const loadPlaylists = useCallback(async () => {
    const result = await axios.get<PlaylistSummary[]>("/api/playlists");
    setPlaylists(result.data);
    return result.data;
  }, []);

  const loadPlaylistSongs = useCallback(
    async (playlistId: string, showLoadedMessage: boolean = true) => {
      console.log("loadPlaylistSongs", playlistId);
      if (!playlistId) return;
      setIsLoadingSongList(true);
      try {
        const response = await axios.get<{
          songs: GuessGameSong[];
          mode: PlaylistMode;
          playlistId: string;
        }>(`/api/playlists/${encodeURIComponent(playlistId)}/load`);
        const { songs, mode } = response.data;
        setSelectedPlaylistMode(mode);
        setSongList(songs);
        setFilteredSongList(songs);
        if (mode === "custom") {
          setCustomSongList(songs as CustomSong[]);
          const firstCustomSong = songs[0] as CustomSong | undefined;
          if (firstCustomSong?.youtube_link) {
            setCustomYoutubeLink(firstCustomSong.youtube_link);
            cueYouTubeVideo(firstCustomSong.youtube_link);
          }
          setGameOption((k) => ({
            ...k,
            isFixedStartTime: false,
            youtubeID: firstCustomSong?.youtube_link || k.youtubeID,
          }));
        } else {
          setCustomSongList([]);
        }
        if (showLoadedMessage) {
          showMessage("Playlist loaded");
        }
      } finally {
        setIsLoadingSongList(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (!isHost) return;
    setSongList([]);
    setCurrentSong(undefined);
    if (selectedPlaylist.value === "system:chunithm") {
      setLowerLevelRange(
        level.find((k) => k.value == chunithmDefaulLevelRange[0])!,
      );
      setUpperLevelRange(
        level.find((k) => k.value == chunithmDefaulLevelRange[1])!,
      );
    } else if (selectedPlaylist.value === "system:maimai") {
      setLowerLevelRange(
        level.find((k) => k.value == maimaiDefaulLevelRange[0])!,
      );
      setUpperLevelRange(
        level.find((k) => k.value == maimaiDefaulLevelRange[1])!,
      );
    }
    loadPlaylistSongs(String(selectedPlaylist.value), false);
    socket?.emit(
      "change-playlist",
      { roomID },
      selectedPlaylist.value,
      selectedPlaylist.name,
    );
  }, [
    selectedPlaylist.value,
    selectedPlaylist.name,
    isHost,
    loadPlaylistSongs,
    socket,
    roomID,
  ]);

  useEffect(() => {
    if (!isHost) return;
    if (
      selectedPlaylistMode === "youtube_playlist" ||
      selectedPlaylistMode === "custom"
    ) {
      setFilteredSongList(songList);
      return;
    }
    const isCustomSongs = (x: any): x is CustomSong => x.startTime != undefined;
    const isMaimaiSongs = (x: any): x is MaimaiSongs => true;

    const filteredSongList = songList.filter((k) => {
      let isValid = false;
      if (isCustomSongs(k)) return true;
      if (isMaimaiSongs(k)) {
        if (
          k.remaster?.rate &&
          k.remaster.rate <= upperLevelRange.value &&
          k.remaster.rate >= lowerLevelRange.value
        ) {
          return true;
        }
      } else {
        if (
          k.ultima?.rate &&
          k.ultima.rate <= upperLevelRange.value &&
          k.ultima.rate >= lowerLevelRange.value
        ) {
          return true;
        }
      }
      if (
        k.master?.rate &&
        k.master.rate <= upperLevelRange.value &&
        k.master.rate >= lowerLevelRange.value
      ) {
        return true;
      }

      if (
        k.expert?.rate &&
        k.expert.rate <= upperLevelRange.value &&
        k.expert.rate >= lowerLevelRange.value
      ) {
        return true;
      }
      return isValid;
    });

    setFilteredSongList(filteredSongList);
  }, [
    songList,
    upperLevelRange,
    lowerLevelRange,
    selectedPlaylistMode,
    isHost,
  ]);

  useEffect(() => {
    if (!isHost) return;
    socket?.emit(
      "change-song-list",
      { roomID },
      filteredSongList.map((k) => {
        return { display_name: k.display_name };
      }),
    );
  }, [filteredSongList, isHost]);

  useEffect(() => {
    setGameOption((k) => {
      return {
        ...k,
        answerRaceChoicesNumber: answerRaceChoicesNumber.value,
      };
    });
  }, [answerRaceChoicesNumber]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    setIsAnswered(false);
  }, [gameOption.answerRaceChoices]);

  const showMessage = (message: string, messageDetails?: MessageDetails) => {
    toast(message, {
      position: "top-center",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      type: messageDetails?.type ?? "default",
      progress: undefined,
      theme: "colored",
      className: "",
    });
  };

  const showRequest = (playerName: string, requestType: RequestType) => {
    let message = "";
    switch (requestType) {
      case "replay":
        message = playerName + " requested replay";
        if (replayRef.current) toast.dismiss(replayRef.current);
        break;
      case "anotherSection":
        message = "Players requested another section";
        if (anotherSectionRef.current) toast.dismiss(anotherSectionRef.current);
        break;
      case "longer":
        message = "Players requested longer";
        if (longerRef.current) toast.dismiss(longerRef.current);
        break;
    }
    let id = toast(message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      closeButton: () => {
        switch (requestType) {
          case "replay":
            return (
              <div className="flex items-center">
                <Button
                  className="min-w-0"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    playSong();
                    if (replayRef.current) toast.dismiss(replayRef.current);
                  }}
                >
                  Replay
                </Button>
              </div>
            );
          case "anotherSection":
            return (
              <div className="flex items-center">
                <Button
                  className="min-w-0"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    broadCastConfigWithRandomTime(true);
                    if (anotherSectionRef.current)
                      toast.dismiss(anotherSectionRef.current);
                  }}
                >
                  Start(R)
                </Button>
              </div>
            );
          case "longer":
            return (
              <div className="flex items-center">
                <Button
                  className="min-w-0"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    broadCastConfigWithLongerTime();
                    if (longerRef.current) toast.dismiss(longerRef.current);
                  }}
                >
                  Add 1s
                </Button>
              </div>
            );
        }
      },
      type: "default",
      theme: "light",
      className: "",
    });
    switch (requestType) {
      case "replay":
        replayRef.current = id;
        break;
      case "anotherSection":
        anotherSectionRef.current = id;
        break;
      case "longer":
        longerRef.current = id;
        break;
    }
  };

  const sendMessage = () => {
    // Send the message to the server
    socket?.emit("message", { roomID }, currentMessage);
    // Clear the currentMessage state
    setCurrentMessage("");
  };

  const getNextSong = async () => {
    let song = _.sampleSize<GuessGameSong>(filteredSongList, 1)[0];
    setCurrentSong(song);
    setIsLoadingNextSong(true);
    if (!gameOption.isFixedStartTime) {
      setShouldGetNewRandomStartTime(true);
    }
    try {
      let nextYoutubeId = song.youtube_link;
      if (!nextYoutubeId) {
        const catalogHint =
          selectedPlaylistMode === "catalog_chunithm"
            ? "chunithm"
            : selectedPlaylistMode === "catalog_maimai"
              ? "maimai"
              : "";
        const resolveUrl =
          catalogHint === "chunithm"
            ? `/api/songs/youtubeID?type=chunithm&id=${song.id}`
            : `/api/songs/youtubeID?type=maimai&id=${song.display_name}`;
        const youtubeAPIResult = await axios.get<string>(resolveUrl);
        nextYoutubeId = youtubeAPIResult.data;
      }
      if (!nextYoutubeId) {
        throw new Error("No youtube id");
      }

      if (isHost) {
        socket?.emit("get-player-count", { roomID }, (playerCount: number) => {
          console.log("total player", playerCount);
          if (playerCount <= 1) {
            setShouldSendBufferedSignal(false);
          }
          youtubeRef.current?.target.cueVideoById({
            videoId: nextYoutubeId!,
            startSeconds: parseFloat(gameOption.startTime),
            endSeconds:
              parseFloat(gameOption.startTime) +
              parseFloat(gameOption.duration),
          });
          showMessage("Changed to next song");
        });
      }
      setGameOption((prev) => ({
        ...prev,
        youtubeID: nextYoutubeId ?? prev.youtubeID,
      }));
      setShouldStartNewRound(true);
    } catch (error) {
      showMessage("Cannot get next song", { type: "error" });
    }

    setIsLoadingNextSong(false);
  };

  const youtubeVideoOnReady: YouTubeProps["onReady"] = (e) => {
    console.log("youtube video ready");
    e.target.setVolume(20);
    e.target.pauseVideo();
    e.target.mute();
    if (!youtubeRef.current) {
      youtubeRef.current = e;
    }
    if (selectedPlaylistMode === "custom" && customYoutubeLink) {
      cueYouTubeVideo(customYoutubeLink);
    }
  };

  const youtubeVideoOnError: YouTubeProps["onError"] = (e) => {
    console.log("youtube video error");
    // youtubeRef.current = undefined;
    showMessage(`Cannot load the music, error code ${e.data}`, {
      type: "error",
    });
  };

  const broadCastReplaySong = () => {
    socket?.emit("replay-music", { roomID });
  };

  const broadCastConfig = () => {
    socket?.emit(
      "load-music",
      { roomID },
      gameOption,
      currentSong?.display_name,
      selectedPlaylistMode === "custom" ? true : shouldStartNewRound,
    );
    setShouldStartNewRound(false);
  };

  const broadCastConfigWithRandomTime = (isSameSong: boolean = false) => {
    let [randomTime, song] = getRandomTime(isSameSong);
    socket?.emit(
      "load-music",
      { roomID },
      { ...gameOption, startTime: randomTime?.toString() },
      selectedPlaylistMode === "custom"
        ? song?.display_name
        : currentSong?.display_name,
      selectedPlaylistMode === "custom" ? !isSameSong : shouldStartNewRound,
    );
    setShouldStartNewRound(false);
  };

  const broadCastConfigWithLongerTime = () => {
    setGameOption((k) => {
      return {
        ...k,
        duration: (parseFloat(k.duration) + 1).toString(),
      };
    });
    socket?.emit(
      "load-music",
      { roomID },
      {
        ...gameOption,
        duration: (parseFloat(gameOption.duration) + 1).toString(),
      },
      currentSong?.display_name,
      shouldStartNewRound,
    );
    setShouldStartNewRound(false);
  };

  const testSong = () => {
    if (selectedPlaylistMode !== "custom") {
      youtubeRef.current?.target.loadVideoById({
        videoId: gameOption.youtubeID,
        startSeconds: parseFloat(gameOption.startTime),
        endSeconds:
          parseFloat(gameOption.startTime) + parseFloat(gameOption.duration),
      });
      youtubeRef.current?.target.playVideo();
    } else {
      playSong();
    }
  };

  const playSong = () => {
    if (timer.current) clearTimeout(timer.current);

    console.log("start play music", gameOption.startTime, gameOption.duration);
    if (selectedPlaylistMode === "custom" && isJoined) {
      youtubeRef.current?.target.unMute();
    }
    youtubeRef.current?.target.seekTo(parseFloat(gameOption?.startTime), true);
    youtubeRef.current?.target.playVideo();
  };

  const makeRequest = (request: RequestType) => {
    switch (request) {
      case "replay":
        socket?.emit("request-replay", { roomID, playerID: socket.id });
        break;
      case "anotherSection":
        socket?.emit("request-another-section", {
          roomID,
          playerID: socket.id,
        });
        break;
      case "longer":
        socket?.emit("request-longer", { roomID, playerID: socket.id });
        break;
      default:
        break;
    }
  };

  const joinGame = () => {
    console.log("join-game", socket?.id);
    // youtubeRef.current?.target.seekTo(gameOption?.startTime, true)

    socket?.emit("join-game", { roomID, playerID: socket.id });
    youtubeRef.current?.target.unMute();
    setIsJoined(true);
  };

  const handleOnSelect = (result: GuessGameSong) => {
    setAnswer(result.display_name);
  };

  const handleOnSearch = (string: string, results: GuessGameSong[]) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    setAnswer(string);
  };

  const sendAnswer = () => {
    socket?.emit("send-answer", { roomID, playerID: socket.id }, answer);

    setAnswer("");
  };

  const getRandomTime = (
    isSameSong: boolean = false,
  ): [number, GuessGameSong?] => {
    let randomTime = 0;
    if (selectedPlaylistMode === "custom") {
      let randomSongIndex = isSameSong
        ? _.findIndex(songList, currentSong)
        : _.random(songList.length - 1);
      if (customSongList[randomSongIndex]) {
        let startTime = customSongList[randomSongIndex].startTime;
        let endTime = customSongList[randomSongIndex + 1]
          ? customSongList[randomSongIndex + 1].startTime
          : parseFloat(youtubeRef.current?.target.getDuration());
        randomTime = ~~Math.max(
          startTime,
          startTime +
            _.random(endTime - startTime) -
            parseFloat(gameOption.duration),
        );
        setGameOption((gameOption) => {
          return {
            ...gameOption,
            startTime: randomTime.toString(),
          };
        });

        setShouldStartNewRound(true);
        setCurrentSong(customSongList[randomSongIndex]);
        return [randomTime, customSongList[randomSongIndex]];
      } else {
        setGameOption((gameOption) => {
          return {
            ...gameOption,
            startTime: randomTime.toString(),
          };
        });
        setShouldStartNewRound(true);
        return [randomTime, customSongList[randomSongIndex]];
      }
    } else {
      randomTime = ~~Math.max(
        0,
        _.random(
          parseFloat(youtubeRef.current?.target.getDuration()) -
            parseFloat(gameOption.duration),
        ),
      );
      setGameOption((gameOption) => {
        return {
          ...gameOption,
          startTime: randomTime.toString(),
        };
      });

      return [randomTime, currentSong];
    }
  };

  const showAnswer = () => {
    socket?.emit("show-answer", { roomID, playerID: socket.id });
  };

  const surrender = () => {
    socket?.emit("surrender", { roomID, playerID: socket.id });
  };

  useGuessSongGame({
    socket: socket ?? null,
    state,
    roomID,
    playerName: session?.user.username,
    isHost,
    isJoined,
    onBecomeHost: () => setIsHost(true),
    onRoomDeleted: () => {
      alert("Room has been deleted");
      router.replace("../rooms");
    },
    onRoomLeft: () => {
      alert("You leaved room");
      router.replace("../rooms");
    },
    onMessage: (
      message,
      messageDetails: MessageDetails = {
        onlyPlayer: false,
        withNotification: false,
      },
    ) => {
      if (messageDetails.onlyPlayer && isHost) return;
      const messageType = determineMessageType(message);
      const chatMessage: ChatMessage = {
        content: message,
        type: messageType,
        timestamp: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, chatMessage]);
      if (messageDetails.withNotification) {
        showMessage(message, messageDetails);
      }
    },
    onUpdateRoomInfo: (updatedRoomInfo) => {
      console.log("update", updatedRoomInfo);
      const currentPlaylistId =
        typeof selectedPlaylist.value === "string"
          ? selectedPlaylist.value
          : String(selectedPlaylist.value);
      const isPlaylistChanged =
        updatedRoomInfo.playlistId &&
        updatedRoomInfo.playlistId !== currentPlaylistId;

      if (!isHost && isPlaylistChanged) {
        const targetPlaylist = playlists.find(
          (k) => k.id === updatedRoomInfo.playlistId,
        );
        if (targetPlaylist) {
          setSelectedPlaylist({
            name: targetPlaylist.name,
            value: targetPlaylist.id,
          });
          loadPlaylistSongs(targetPlaylist.id, false);
        } else {
          setSelectedPlaylist({
            name: updatedRoomInfo.playlistId,
            value: updatedRoomInfo.playlistId,
          });
          loadPlaylistSongs(updatedRoomInfo.playlistId, false);
        }
      }
      setRoomInfo(updatedRoomInfo);
    },
    onChangeSongList: (updatedSongList) => {
      if (!isHost) {
        setFilteredSongList(updatedSongList);
      }
    },
    onReplayMusic: () => {
      console.log("replay-music", gameOption);
      playSong();
    },
    onPlayMusic: () => {
      setTimeout(() => {
        playSong();
      }, 1000);
    },
    onBufferMusic: (newGameOption) => {
      console.log("buffer-music", newGameOption, gameOption);
      setGameOption((x) => {
        return { ...x, ...newGameOption };
      });

      if (selectedPlaylistMode !== "custom") {
        youtubeRef.current?.target.cueVideoById({
          videoId: newGameOption.youtubeID,
          startSeconds: parseFloat(newGameOption.startTime),
          endSeconds:
            parseFloat(newGameOption.startTime) +
            parseFloat(newGameOption.duration),
        });
      } else if (gameOption.youtubeID != newGameOption.youtubeID) {
        youtubeRef.current?.target.cueVideoById({
          videoId: newGameOption.youtubeID,
          startSeconds: parseFloat(newGameOption.startTime),
          endSeconds:
            parseFloat(newGameOption.startTime) +
            parseFloat(newGameOption.duration),
        });
      } else {
        socket?.emit("finish-buffer-music", { roomID, playerID: socket.id });
      }
    },
    onRequestReplay: (playerName) => {
      showRequest(playerName, "replay");
    },
    onRequestLonger: (playerName) => {
      showRequest(playerName, "longer");
    },
    onRequestAnotherSection: (playerName) => {
      showRequest(playerName, "anotherSection");
    },
  });

  const canControlGamePanel =
    gameOption.startTime && gameOption.duration && filteredSongList.length > 0;
  const isCustomMode = selectedPlaylistMode === "custom";
  const isCatalogMode =
    selectedPlaylistMode === "catalog_chunithm" ||
    selectedPlaylistMode === "catalog_maimai";
  const playlistOptions = playlists.map((k) => ({ name: k.name, value: k.id }));
  const playerInfo = useMemo(() => {
    return _.find(roomInfo?.players, (k) => {
      return k.id == socket?.id;
    });
  }, [roomInfo, socket, state]);

  return (
    <div className="relative h-screen overflow-hidden flex flex-col">
      <BackdropScene />
      <Head>
        {roomID ? (
          <title>{`So♫Guesser - ${roomID}`}</title>
        ) : (
          <title>So♫Guesser</title>
        )}
      </Head>

      {/* Top Navigation Bar - compact */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 backdrop-blur-xl shrink-0">
        <div
          className="cursor-pointer flex items-center gap-2"
          onClick={() => router.push("/song_guesser/rooms")}
        >
          <SongGuesserLogo compact />
        </div>
        <h1 className="text-lg font-bold tracking-wide text-white">{roomID}</h1>
        <div className="flex items-center gap-2">
          {isHost && (
            <Button
              variant="secondary"
              size="icon-sm"
              className="min-w-0"
              onClick={() => {
                if (!isYouTubeDockVisible) {
                  setIsYouTubeDockVisible(true);
                  setIsYouTubeDockExpanded(true);
                  return;
                }
                setIsYouTubeDockExpanded((prev) => !prev);
              }}
            >
              <MdVideoLibrary className="w-4 h-4" />
            </Button>
          )}
          {isHost && (
            <Button
              variant="secondary"
              size="icon-sm"
              className="min-w-0"
              onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
            >
              <MdTune className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area - fills remaining height */}
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Left Sidebar - Players (collapsible) */}
        <div
          className={classNames(
            "hidden md:flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl shrink-0 transition-all duration-300",
            isPlayersPanelOpen ? "w-[220px] lg:w-[260px]" : "w-0",
          )}
        >
          <div
            className={classNames(
              "flex-1 flex flex-col min-h-0 overflow-hidden",
              !isPlayersPanelOpen && "invisible",
            )}
          >
            <div className="p-3 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MdPeople className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">Players</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                    {roomInfo?.players?.length || 0}
                  </span>
                  <button
                    className="text-slate-400 hover:text-white p-0.5 transition-colors"
                    onClick={() => setIsPlayersPanelOpen(false)}
                  >
                    <MdChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {roomInfo &&
                roomInfo.players.map((k, i) => {
                  const colors = [
                    "from-violet-500 to-purple-600",
                    "from-cyan-500 to-blue-600",
                    "from-emerald-500 to-green-600",
                    "from-amber-500 to-orange-600",
                    "from-rose-500 to-red-600",
                    "from-pink-500 to-fuchsia-600",
                  ];
                  const playerColor = colors[i % colors.length];

                  return (
                    <div
                      key={i}
                      className="px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg bg-gradient-to-br ${playerColor} flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                          >
                            {k.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-white text-sm font-medium truncate max-w-[80px]">
                              {k.name}
                            </span>
                            {k.isHost && (
                              <FaRobot className="text-yellow-300 w-3 h-3" />
                            )}
                            {k.isSurrendered && (
                              <FaFlag className="text-red-300 w-3 h-3" />
                            )}
                          </div>
                        </div>
                        {(!k.isHost || (k.isHost && k.isJoined)) && (
                          <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg">
                            <MdStar className="w-3 h-3 text-amber-400" />
                            <span className="text-white font-semibold text-xs">
                              {k.score}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        {/* Left panel toggle - show when collapsed */}
        {!isPlayersPanelOpen && (
          <button
            className="hidden md:flex items-center justify-center w-6 shrink-0 border-r border-white/10 bg-black/20 hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
            onClick={() => setIsPlayersPanelOpen(true)}
          >
            <MdChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Center - Main Game Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Chat Area - takes available space */}
          <div className="flex-1 flex flex-col min-h-0 p-3 lg:p-4">
            {/* Chat Messages */}
            <div
              ref={chatBoxRef}
              className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl p-3 mb-3"
            >
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <MdChatBubble className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Messages will appear here</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessageComponent key={index} message={message} />
                ))
              )}
            </div>

            {/* Answer Section */}
            {isJoined && (
              <div className="mb-2">
                {gameOption.answerRaceChoices.length <= 0 ? (
                  <div className="flex gap-2">
                    <ReactSearchAutocomplete<GuessGameSong>
                      inputSearchString={answer}
                      items={filteredSongList}
                      onSearch={handleOnSearch}
                      onClear={() => {
                        setAnswer(undefined);
                      }}
                      onSelect={handleOnSelect}
                      fuseOptions={{ keys: ["display_name"] }}
                      resultStringKeyName="display_name"
                      placeholder="Type your answer..."
                      key={"display_name"}
                      showIcon={false}
                      styling={{
                        borderRadius: "12px",
                        height: "auto",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                        backgroundColor: "#1E1E2E",
                        border: "1px solid rgba(75, 85, 99, 0.3)",
                        color: "#ffffff",
                        hoverBackgroundColor: "gray",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        zIndex: 99,
                      }}
                      className="flex-1 auto-search"
                    />
                    <Button
                      disabled={playerInfo?.isSurrendered}
                      className="min-w-0 px-5"
                      size="sm"
                      onClick={sendAnswer}
                    >
                      Answer
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {_.map(gameOption.answerRaceChoices, (k, i) => {
                      return (
                        <Button
                          disabled={
                            isAnswered || playerInfo?.isSurrendered == true
                          }
                          key={i}
                          className="min-w-0 px-3 py-2"
                          size="sm"
                          onClick={() => {
                            setIsAnswered(true);
                            socket?.emit(
                              "send-answer",
                              { roomID, playerID: socket.id },
                              k,
                              true,
                            );
                          }}
                        >
                          {k}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Chat Input */}
            {isJoined && (
              <div className="flex gap-2">
                <input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && currentMessage.length > 0) {
                      sendMessage();
                    }
                  }}
                  className="guess-song-game-input px-4 py-2 flex-1 text-sm"
                  placeholder="Type a message..."
                />
                <Button
                  disabled={currentMessage.length == 0}
                  className="min-w-0 px-4"
                  size="sm"
                  onClick={sendMessage}
                >
                  Send
                </Button>
              </div>
            )}

            {/* Join Game */}
            {!isJoined && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/30 flex items-center justify-center mb-4">
                      <MdMusicNote className="w-10 h-10 text-violet-300" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Ready to play?
                    </h2>
                    <p className="text-sm text-slate-400">
                      Join the game to start guessing songs
                    </p>
                  </div>
                  <Button
                    className="px-12 py-4 text-lg shadow-lg shadow-violet-900/40"
                    onClick={joinGame}
                  >
                    <MdPlayArrow className="w-5 h-5" />
                    Join Game
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Control Bar - Player Actions */}
          {isJoined && !isHost && (
            <div className="shrink-0 border-t border-white/10 bg-black/30 backdrop-blur-xl px-4 py-2">
              <div className="flex items-center justify-between max-w-lg mx-auto">
                <div className="flex gap-2">
                  <Button
                    disabled={playerInfo?.isSurrendered}
                    variant="secondary"
                    size="sm"
                    className="min-w-0 px-3"
                    tooltip="Request host to replay current song"
                    onClick={() => makeRequest("replay")}
                  >
                    <MdReplay className="w-4 h-4" />
                    <span className="hidden sm:inline">Replay</span>
                  </Button>
                  <Button
                    disabled={playerInfo?.isSurrendered}
                    variant="secondary"
                    size="sm"
                    className="min-w-0 px-3"
                    tooltip="Request host to add one second"
                    onClick={() => makeRequest("longer")}
                  >
                    <MdTimer className="w-4 h-4" />
                    <span className="hidden sm:inline">Longer</span>
                  </Button>
                  <Button
                    disabled={playerInfo?.isSurrendered}
                    variant="secondary"
                    size="sm"
                    className="min-w-0 px-3"
                    tooltip="Request a different section of this song"
                    onClick={() => makeRequest("anotherSection")}
                  >
                    <MdSkipNext className="w-4 h-4" />
                    <span className="hidden sm:inline">Section</span>
                  </Button>
                </div>
                <Button
                  disabled={playerInfo?.isSurrendered}
                  variant="danger"
                  size="sm"
                  className="min-w-0 px-3"
                  tooltip="Give up this round"
                  onClick={surrender}
                >
                  <FaFlag className="w-3 h-3" />
                  <span className="hidden sm:inline">Surrender</span>
                </Button>
              </div>
            </div>
          )}

          {/* Bottom Control Bar - Host Controls */}
          {isHost && (
            <div className="shrink-0 border-t border-white/10 bg-black/30 backdrop-blur-xl px-4 py-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  disabled={!canControlGamePanel || !currentSong}
                  size="sm"
                  className="min-w-0 px-3"
                  tooltip="Start current configured round"
                  onClick={broadCastConfig}
                >
                  <MdPlayArrow className="w-4 h-4" />
                  Start
                </Button>
                <Button
                  disabled={
                    !canControlGamePanel || (!isCustomMode && !currentSong)
                  }
                  variant="secondary"
                  size="sm"
                  className="min-w-0 px-3"
                  tooltip="Start with random timestamp"
                  onClick={() => {
                    broadCastConfigWithRandomTime();
                  }}
                >
                  <MdShuffle className="w-4 h-4" />
                  Start(R)
                </Button>
                <Button
                  disabled={!canControlGamePanel || !currentSong}
                  variant="secondary"
                  size="sm"
                  className="min-w-0 px-3"
                  tooltip="Replay current song segment"
                  onClick={broadCastReplaySong}
                >
                  <MdReplay className="w-4 h-4" />
                  Replay
                </Button>
                <Button
                  disabled={!canControlGamePanel || !currentSong}
                  variant="warning"
                  size="sm"
                  className="min-w-0 px-3"
                  tooltip="Reveal the answer to players"
                  onClick={showAnswer}
                >
                  Reveal
                </Button>
                {!isCustomMode && (
                  <Button
                    disabled={!canControlGamePanel}
                    variant="violet"
                    size="sm"
                    className="min-w-0 px-3"
                    tooltip="Load and prepare next song"
                    onClick={getNextSong}
                  >
                    {isLoadingNextSong ? (
                      <LoadingView />
                    ) : (
                      <>
                        <MdNavigateNext className="w-4 h-4" />
                        Next
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-w-0 px-3"
                  tooltip="Play current config locally (host only)"
                  onClick={testSong}
                >
                  Test
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-w-0 px-3"
                  tooltip="Regenerate random start time"
                  onClick={() => getRandomTime()}
                >
                  <MdShuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Host Settings (collapsible) */}
        {isHost && (
          <>
            {/* Right panel toggle - show when collapsed on desktop */}
            {!isSettingsPanelOpen && (
              <button
                className="hidden lg:flex items-center justify-center w-6 shrink-0 border-l border-white/10 bg-black/20 hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                onClick={() => setIsSettingsPanelOpen(true)}
              >
                <MdChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div
              className={classNames(
                "fixed inset-0 z-[999] lg:relative lg:inset-auto border-l border-white/10 bg-black/20 backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300",
                {
                  "w-0 lg:w-0": !isSettingsPanelOpen,
                  "w-full lg:w-[320px]": isSettingsPanelOpen,
                },
              )}
            >
              <div
                className={classNames(
                  "flex-1 flex flex-col min-h-0",
                  !isSettingsPanelOpen && "invisible",
                )}
              >
                <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <MdSettings className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-sm">
                      Game Settings
                    </span>
                  </div>
                  <button
                    className="text-slate-400 hover:text-white p-1 transition-colors"
                    onClick={() => setIsSettingsPanelOpen(false)}
                  >
                    <MdChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Playlist */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Playlist
                    </label>
                    <ListBox
                      className="w-full"
                      source={playlistOptions}
                      selected={selectedPlaylist}
                      setSelected={setSelectedPlaylist}
                    />
                  </div>

                  {/* Level Range */}
                  {isCatalogMode && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">
                        Level Range
                      </label>
                      <div className="flex items-center gap-2">
                        <ListBox
                          className="flex-1"
                          source={level.filter((k) => {
                            return k.value <= upperLevelRange.value;
                          })}
                          selected={lowerLevelRange}
                          setSelected={setLowerLevelRange as any}
                        />
                        <span className="text-slate-400">—</span>
                        <ListBox
                          className="flex-1"
                          source={level.filter((k) => {
                            return k.value >= lowerLevelRange.value;
                          })}
                          selected={upperLevelRange}
                          setSelected={setUpperLevelRange as any}
                        />
                      </div>
                    </div>
                  )}

                  {/* Answer Choices */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Number of Options
                    </label>
                    <ListBox
                      className="w-[4.5rem]"
                      source={answerChoices}
                      selected={answerRaceChoicesNumber}
                      setSelected={setAnswerRaceChoicesNumber as any}
                    />
                  </div>

                  {/* Create From YouTube Playlist */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      New Playlist From YouTube
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={playlist}
                        onChange={(e) => {
                          try {
                            let url = new URL(e.target.value);
                            let id: string;
                            id = url.searchParams.get("list") ?? "";
                            setPlaylist(id);
                          } catch (error) {
                            setPlaylist(e.target.value);
                          }
                        }}
                        className="guess-song-game-input w-full px-3 py-2 text-sm"
                        placeholder="Playlist URL or ID"
                      />
                      <Button
                        disabled={playlist.length <= 0}
                        size="sm"
                        className="min-w-0 px-3"
                        onClick={async () => {
                          if (!newPlaylistName.trim()) {
                            showMessage("Please enter a playlist name", {
                              type: "error",
                            });
                            return;
                          }
                          const created = await axios.post<PlaylistSummary>(
                            "/api/playlists",
                            {
                              name: newPlaylistName,
                              creator: session?.user.username || "anonymous",
                              source_type: "youtube_playlist",
                            },
                          );
                          await axios.post(
                            `/api/playlists/${encodeURIComponent(created.data.id)}/import-youtube`,
                            { playlistUrlOrId: playlist },
                          );
                          const updated = await loadPlaylists();
                          const newTarget =
                            updated.find((k) => k.id === created.data.id) ||
                            created.data;
                          setSelectedPlaylist({
                            name: newTarget.name,
                            value: newTarget.id,
                          });
                        }}
                      >
                        {isLoadingSongList ? <LoadingView /> : "Save"}
                      </Button>
                    </div>
                    <input
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="guess-song-game-input w-full px-3 py-2 text-sm mt-2"
                      placeholder="New playlist name"
                    />
                  </div>

                  {/* Create / Load Custom Video */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Custom YouTube
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={customYoutubeLink}
                        onChange={(e) => {
                          try {
                            let url = new URL(e.target.value);
                            let id: string;
                            if (e.target.value.includes("youtu.be")) {
                              id = url.pathname.split("/")[1];
                            } else {
                              id = url.searchParams.get("v") ?? "";
                            }
                            setCustomYoutubeLink(id);
                          } catch (error) {
                            setCustomYoutubeLink(e.target.value);
                          }
                        }}
                        className="guess-song-game-input w-full px-3 py-2 text-sm"
                        placeholder="YouTube URL or ID"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="min-w-0 px-3"
                        onClick={() => {
                          if (!customYoutubeLink) {
                            showMessage("Please input the link first!", {
                              type: "error",
                            });
                            return;
                          }
                          setIsInputAnswerSetModalOpen(true);
                        }}
                      >
                        Config
                      </Button>
                      <Button
                        disabled={
                          customSongList.length == 0 || !customYoutubeLink
                        }
                        variant="secondary"
                        size="sm"
                        className="min-w-0 px-3"
                        onClick={() => {
                          setShouldSendBufferedSignal(false);
                          setSelectedPlaylistMode("custom");
                          setSongList(customSongList);
                          setFilteredSongList(customSongList);
                          setGameOption((gameOption) => {
                            return {
                              ...gameOption,
                              youtubeID: customYoutubeLink,
                            };
                          });
                          youtubeRef.current?.target.cueVideoById({
                            videoId: customYoutubeLink,
                            startSeconds: parseFloat(gameOption.startTime),
                            endSeconds:
                              parseFloat(gameOption.startTime) +
                              parseFloat(gameOption.duration),
                          });
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        disabled={
                          customSongList.length == 0 ||
                          !customYoutubeLink ||
                          !newPlaylistName.trim()
                        }
                        variant="violet"
                        size="sm"
                        className="min-w-0 px-3"
                        onClick={async () => {
                          const created = await axios.post<PlaylistSummary>(
                            "/api/playlists",
                            {
                              name: newPlaylistName,
                              creator: session?.user.username || "anonymous",
                              source_type: "manual_custom",
                            },
                          );
                          await axios.post(
                            `/api/playlists/${encodeURIComponent(created.data.id)}/custom-video`,
                            {
                              youtube_id: customYoutubeLink,
                              display_name: newPlaylistName,
                              segments: customSongList.map((k) => ({
                                answer_name: k.display_name,
                                start_sec: k.startTime,
                              })),
                            },
                          );
                          const updated = await loadPlaylists();
                          const target =
                            updated.find((k) => k.id === created.data.id) ||
                            created.data;
                          setSelectedPlaylist({
                            name: target.name,
                            value: target.id,
                          });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                    <input
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="guess-song-game-input w-full px-3 py-2 text-sm mt-2"
                      placeholder="New playlist name"
                    />
                  </div>

                  {/* Start Time & Duration */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Start Time
                      </label>
                      {!isCustomMode && (
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            onChange={(e) => {
                              setGameOption((gameOption) => {
                                return {
                                  ...gameOption,
                                  isFixedStartTime: e.target.checked,
                                };
                              });
                            }}
                            checked={gameOption.isFixedStartTime}
                            className="w-3 h-3 text-purple-600 bg-gray-700 border border-gray-600 rounded focus:ring-purple-500"
                            type="checkbox"
                          />
                          <span className="text-xs text-slate-400">Fixed</span>
                        </label>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={gameOption.startTime}
                        onChange={(e) =>
                          setGameOption((gameOption) => {
                            const re = /^(\d*)?(\.\d{0,1})?$/;
                            if (re.test(e.target.value))
                              return {
                                ...gameOption,
                                startTime: e.target.value,
                              };
                            return gameOption;
                          })
                        }
                        className="guess-song-game-input px-3 py-2 w-full text-sm"
                        placeholder="Start Time"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-w-0 px-3"
                        onClick={() => getRandomTime()}
                      >
                        <MdShuffle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Duration
                    </label>
                    <input
                      value={gameOption.duration}
                      onChange={(e) =>
                        setGameOption((gameOption) => {
                          const re = /^(\d*)?(\.\d{0,1})?$/;
                          if (re.test(e.target.value))
                            return {
                              ...gameOption,
                              duration: e.target.value,
                            };
                          return gameOption;
                        })
                      }
                      className="guess-song-game-input px-3 py-2 w-full text-sm"
                      placeholder="Duration"
                    />
                  </div>

                  {/* Song Info */}
                  {currentSong && (
                    <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3">
                      <div className="text-xs text-slate-400 mb-1">
                        Current Song
                      </div>
                      <div className="text-sm text-white font-medium truncate">
                        {currentSong.display_name}
                      </div>
                    </div>
                  )}

                  {/* Song count */}
                  <div className="text-xs text-slate-400">
                    Songs: {filteredSongList.length}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* YouTube Dock - Host Only (always rendered, non-blocking) */}
      {isHost && (
        <HostYouTubeDock
          position={youtubeDockPosition}
          dockRef={youtubeDockRef}
          isVisible={isYouTubeDockVisible}
          isExpanded={isYouTubeDockExpanded}
          onToggleExpanded={() => setIsYouTubeDockExpanded((prev) => !prev)}
          onDismiss={() => setIsYouTubeDockVisible(false)}
          onPointerDown={startDraggingDock}
          onPointerMove={dragDock}
          onPointerUp={stopDraggingDock}
        >
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ aspectRatio: "16 / 9" }}
          >
            <YouTube
              videoId="69plnXaTTnE"
              opts={{
                height: "100%",
                width: "100%",
                playerVars: {
                  controls: 1,
                  disablekb: 1,
                  fs: 0,
                },
              }}
              style={{ aspectRatio: "16 / 9" }}
              onReady={youtubeVideoOnReady}
              onPlay={() => {
                if (isCustomMode) {
                  timer.current = setTimeout(
                    () => {
                      youtubeRef.current?.target.pauseVideo();
                    },
                    parseFloat(gameOption?.duration) * 1000,
                  );
                }
              }}
              onError={youtubeVideoOnError}
              onStateChange={(e: any) => {
                console.log(
                  "video time : ",
                  youtubeRef.current?.target.getCurrentTime(),
                  e.data,
                );
                if (e.data == 5) {
                  console.log("finish buffer");
                  if (shouldSendBufferedSignal) {
                    console.log("finish buffer", "emit");
                    socket?.emit("finish-buffer-music", {
                      roomID,
                      playerID: socket.id,
                    });
                  } else {
                    setShouldSendBufferedSignal(true);
                    if (customYoutubeLink && customSongList.length > 0) {
                      setSongList(customSongList);
                      showMessage("Loaded custom video successfully");
                    }
                  }
                  if (shouldGetNewRandomStartTime) {
                    console.log("shouldGetNewRandomStartTime", "youtube");
                    getRandomTime();
                    setShouldGetNewRandomStartTime(false);
                  }

                  if (isCustomMode) {
                    youtubeRef.current?.target.mute();
                    youtubeRef.current?.target.seekTo(0, true);
                    youtubeRef.current?.target.playVideo();
                  }
                }
              }}
            />
          </div>
        </HostYouTubeDock>
      )}

      {/* Hidden YouTube player for non-host */}
      {!isHost && (
        <div className="absolute -left-[9999px] -top-[9999px]">
          <YouTube
            videoId="69plnXaTTnE"
            opts={{
              height: "100%",
              width: "100%",
              playerVars: {
                controls: 1,
                disablekb: 1,
                fs: 0,
              },
            }}
            style={{ opacity: 0 }}
            onReady={youtubeVideoOnReady}
            onPlay={() => {
              if (isCustomMode) {
                timer.current = setTimeout(
                  () => {
                    youtubeRef.current?.target.pauseVideo();
                  },
                  parseFloat(gameOption?.duration) * 1000,
                );
              }
            }}
            onError={youtubeVideoOnError}
            onStateChange={(e: any) => {
              console.log(
                "video time : ",
                youtubeRef.current?.target.getCurrentTime(),
                e.data,
              );
              if (e.data == 5) {
                console.log("finish buffer");
                if (shouldSendBufferedSignal) {
                  console.log("finish buffer", "emit");
                  socket?.emit("finish-buffer-music", {
                    roomID,
                    playerID: socket.id,
                  });
                } else {
                  setShouldSendBufferedSignal(true);
                }
                if (shouldGetNewRandomStartTime) {
                  console.log("shouldGetNewRandomStartTime", "youtube");
                  getRandomTime();
                  setShouldGetNewRandomStartTime(false);
                }

                if (isCustomMode) {
                  youtubeRef.current?.target.mute();
                  youtubeRef.current?.target.seekTo(0, true);
                  youtubeRef.current?.target.playVideo();
                }
              }
            }}
          />
        </div>
      )}

      {/* Mobile Players Drawer - shown as overlay on small screens */}
      <div className="md:hidden fixed bottom-16 left-3 z-20">
        <details className="group">
          <summary className="list-none cursor-pointer">
            <div className="rounded-full bg-white/10 border border-white/20 backdrop-blur-xl p-2 shadow-lg ring-1 ring-white/10">
              <MdPeople className="w-5 h-5 text-white" />
            </div>
          </summary>
          <div className="absolute bottom-12 left-0 w-[240px] max-h-[300px] overflow-y-auto rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(17,21,43,0.98),rgba(26,33,66,0.95))] backdrop-blur-xl shadow-2xl">
            <div className="p-2">
              {roomInfo &&
                roomInfo.players.map((k, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{k.name}</span>
                      {k.isHost && (
                        <FaRobot className="text-yellow-300 w-3 h-3" />
                      )}
                      {k.isSurrendered && (
                        <FaFlag className="text-red-300 w-3 h-3" />
                      )}
                    </div>
                    {(!k.isHost || (k.isHost && k.isJoined)) && (
                      <div className="flex items-center gap-1">
                        <MdStar className="w-3 h-3 text-amber-400" />
                        <span className="text-white text-xs">{k.score}</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </details>
      </div>

      <InputAnswerSetModal
        youtube_link={customYoutubeLink}
        isOpen={isInputAnswerSetModalOpen}
        setIsOpen={setIsInputAnswerSetModalOpen}
        callBack={(songs: CustomSong[]) => {
          setCustomSongList(songs.sort((a, b) => a.startTime - b.startTime));
          setIsInputAnswerSetModalOpen(false);
        }}
      />
      <ToastContainer />
    </div>
  );
};

export default GuessSongGame;
