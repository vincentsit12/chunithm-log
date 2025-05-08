import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo, SetStateAction, Dispatch } from 'react';
import { Socket, io } from "socket.io-client"
import _, { uniqBy, values } from 'lodash'
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import Songs, { MaimaiSongs } from 'db/model/songs';
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import LayoutWrapper from 'components/LayoutWrapper';
import { useRouter } from 'next/router';
import { Bounce, Id, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFlag, FaRobot } from "react-icons/fa6";

import ListBox from 'components/ListBox';
import { MessageDetails } from 'types';
import classNames from 'classnames';
import Modal, { ModalProps } from 'components/Modal';
import { CustomSong, GuessGameSong, GuessSongGameOption, RoomInfo } from 'Games/GuessSongGame/guessSongGameTypes';
enum GuessSongGameType {
    chunithm = 1,
    maimai,
    playlist,
    custom,
}

type RequestType = "replay" | "longer" | "anotherSection"

function useSocketClient() {
    const [state, setState] = useState(false)
    const socket = useRef<Socket>()
    useEffect(() => {

        fetch('/api/socket').then(res => {
            let socketRef = io();
            
    
            socketRef.on("connect", () => {
                console.log("connected", socketRef.id);
                setState(true)
            })
    
            socketRef.on("disconnect", () => {
                console.log("Disconnected")
                setState(false)
            })
    
            socketRef.on("connect_error", async (err: any) => {
                console.log(`connect_error due to ${err.description}`);
                // await fetch('/api/socket');
            });
    
            socket.current = socketRef
        })
       
        return () => {
            socket.current?.disconnect()
        }
    }, [])


    return { socket: socket.current, state }
}

const LoadingView = () => {
    return <div role="status">
        <svg aria-hidden="true" className="mx-auto w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
        </svg>
        <span className="sr-only">Loading...</span>
    </div>
}

const generateLevel = () => {
    let x = []
    for (let i = 15.4; i >= 13.0; i -= 0.1) {
        let key = (i + 0.00001).toFixed(1)
        x.push({ "name": `${key}`, "value": parseFloat(key) })
    }
    return x
}

const generateChoices = () => {
    let x = []
    for (let i = 10; i >= 0; i -= 1) {
        let key = i
        x.push({ "name": `${key}`, "value": i })
    }
    return x
}

const guessSongGameType: {
    name: string,
    value: GuessSongGameType
}[] =
    [{ "name": "chunithm", "value": GuessSongGameType.chunithm },
    { "name": "maimai", "value": GuessSongGameType.maimai },
    { "name": "playlist", "value": GuessSongGameType.playlist },
    { "name": "custom", "value": GuessSongGameType.custom },
    ]

const level = generateLevel()
const answerChoices = generateChoices()
const chunithmDefaulLevelRange: [number, number] = [14.0, 15.4]
const maimaiDefaulLevelRange: [number, number] = [14.0, 15]

const GuessSongGame = () => {

    // State to store the messages
    const [messages, setMessages] = useState<string[]>([]);
    // State to store the current message
    const [currentMessage, setCurrentMessage] = useState('');

    const { socket, state } = useSocketClient();

    const { data: session, status } = useSession()

    const [answer, setAnswer] = useState<string>();

    const [currentSong, setCurrentSong] = useState<GuessGameSong>()

    const [songList, setSongList] = useState<GuessGameSong[]>([])
    const [filteredSongList, setFilteredSongList] = useState<GuessGameSong[]>(songList)

    const youtubeRef = useRef<YouTubeEvent>()

    const router = useRouter()

    const roomID = router.query.roomName



    const [isHost, setIsHost] = useState(false)

    const [isJoined, setIsJoined] = useState(false)

    const [shouldSendBufferedSignal, setShouldSendBufferedSignal] = useState(true)
    const [shouldGetNewRandomStartTime, setShouldGetNewRandomStartTime] = useState(false)
    const [shouldStartNewRound, setShouldStartNewRound] = useState(true)

    const [isShowVideo, setIsShowVideo] = useState(true)
    const [isLoadingSongList, setIsLoadingSongList] = useState(false)
    const [isLoadingNextSong, setIsLoadingNextSong] = useState(false)
    const [isInputAnswerSetModalOpen, setIsInputAnswerSetModalOpen] = useState(false)
    const [isAnswered, setIsAnswered] = useState(false)

    // Custom youtube link
    const [customYoutubeLink, setCustomYoutubeLink] = useState<string>("PvC92bu-PZs")
    const [customSongList, setCustomSongList] = useState<CustomSong[]>([])
    const [customMusicPlayerInitialized, setCustomMusicPlayerInitialized] = useState(false)


    const chatBoxRef = useRef<HTMLDivElement>(null)

    const [selectedGameType, setSelectedGameType] = useState(guessSongGameType[0])
    const [answerRaceChoicesNumber, setAnswerRaceChoicesNumber] = useState(answerChoices[0])

    const [lowerLevelRange, setLowerLevelRange] = useState<{ name: string; value: number }>(level.find(k => k.value == chunithmDefaulLevelRange[0])!)
    const [upperLevelRange, setUpperLevelRange] = useState<{ name: string; value: number }>(level.find(k => k.value == chunithmDefaulLevelRange[1])!)

    const [playlist, setPlaylist] = useState<string>("")

    const [gameOption, setGameOption] = useState<GuessSongGameOption>({
        youtubeID: "69plnXaTTnE",
        startTime: "10",
        duration: "2",
        isFixedStartTime: false,
        answerRaceChoices: [],
        answerRaceChoicesNumber: answerRaceChoicesNumber.value,
    })

    const [roomInfo, setRoomInfo] = useState<RoomInfo>()

    const timer = useRef<NodeJS.Timeout>()

    const replayRef = useRef<Id>()
    const longerRef = useRef<Id>()
    const anotherSectionRef = useRef<Id>()

    useEffect(() => {
        if (!state && !isHost && isJoined) {
            alert("You leaved room")
            router.replace("../rooms")
        }
    }, [isHost, isJoined, state])

    useEffect(() => {
        if (socket) {
            socket.emit('create-room', { roomID, playerName: session?.user.username }, (isHost: boolean) => {
                if (isHost) {
                    setIsHost(true)
                }
            });
        }

        socket?.on('delete-room', (message) => {
            alert("Room has been deleted")
            router.replace("../rooms")
        });


        // Clean up the socket connection on unmount
        return () => {
            console.log("clean")
            socket?.disconnect();
        };
    }, [state]);

    useEffect(() => {
        if (!isHost) return
        setSongList([])
        setCurrentSong(undefined)
        if (selectedGameType.value == GuessSongGameType.chunithm) {
            setPlaylist("")
            setLowerLevelRange(level.find(k => k.value == chunithmDefaulLevelRange[0])!)
            setUpperLevelRange(level.find(k => k.value == chunithmDefaulLevelRange[1])!)
            getSongList()
        } else if (selectedGameType.value == GuessSongGameType.maimai) {
            setPlaylist("")
            setLowerLevelRange(level.find(k => k.value == maimaiDefaulLevelRange[0])!)
            setUpperLevelRange(level.find(k => k.value == maimaiDefaulLevelRange[1])!)
            getMaimaiSongList()
        } else if (selectedGameType.value == GuessSongGameType.custom) {
            setPlaylist("")
            setGameOption(k => { return { ...k, isFixedStartTime: false } })
        }
        socket?.emit('change-game-type', { roomID }, selectedGameType.value, selectedGameType.name)
    }, [selectedGameType, isHost])

    useEffect(() => {
        if (!isHost) return
        if (selectedGameType.value == GuessSongGameType.playlist || selectedGameType.value == GuessSongGameType.custom) {
            setFilteredSongList(songList)
            return
        }
        const isCustomSongs = (x: any): x is CustomSong => x.startTime != undefined;
        const isMaimaiSongs = (x: any): x is MaimaiSongs => true;

        let filteredSongList = songList.filter(k => {
            let isValid = false
            if (isCustomSongs(k)) return true
            if (isMaimaiSongs(k)) {
                if (k.remaster?.rate && k.remaster.rate <= upperLevelRange.value && k.remaster.rate >= lowerLevelRange.value) {
                    return true
                }
            } else {
                if (k.ultima?.rate && k.ultima.rate <= upperLevelRange.value && k.ultima.rate >= lowerLevelRange.value) {
                    return true
                }
            }
            if (k.master?.rate && k.master.rate <= upperLevelRange.value && k.master.rate >= lowerLevelRange.value) {
                return true
            }

            if (k.expert?.rate && k.expert.rate <= upperLevelRange.value && k.expert.rate >= lowerLevelRange.value) {
                return true
            }
            return isValid
        })

        setFilteredSongList(filteredSongList)
    }, [songList, upperLevelRange, lowerLevelRange, selectedGameType, isHost])

    // Player Request 
    useEffect(() => {
        if (!isHost) return
        socket?.on('request-replay', (playerName: string) => {
            showRequest(playerName, 'replay')
        })
        socket?.on('request-longer', (playerName: string) => {
            showRequest(playerName, 'longer')
        })
        socket?.on('request-another-section', (playerName: string) => {
            showRequest(playerName, 'anotherSection')
        })

        return () => {
            socket?.removeListener('request-replay')
            socket?.removeListener('request-longer')
            socket?.removeListener('request-another-section')
        };
    }, [gameOption, isHost, state, selectedGameType, currentSong, shouldStartNewRound])

    useEffect(() => {
        // Listen for incoming messages
        socket?.on('message', (message, messageDetails: MessageDetails = {
            onlyPlayer: false, withNotification: false
        }) => {
            if (messageDetails.onlyPlayer && isHost) { return }
            setMessages((prevMessages) => [...prevMessages, message]);
            if (messageDetails.withNotification) {
                showMessage(message, messageDetails)
            }
        });

        socket?.on('update-room-info', (roomInfo: RoomInfo) => {
            console.log("update", roomInfo)
            if (!isHost && selectedGameType.value != roomInfo.gameType) {
                setSelectedGameType(guessSongGameType[roomInfo.gameType - 1])
            }
            setRoomInfo(roomInfo)
        });


        socket?.on('change-song-list', (songList: GuessGameSong[]) => {
            if (!isHost) {
                setFilteredSongList(songList)
            }
        })

        socket?.on('replay-music', (message) => {
            console.log('replay-music', gameOption)
            playSong()
        });

        socket?.on('play-music', (message) => {
            setTimeout(() => {
                playSong()
            }, 1000)
        });

        socket?.on('buffer-music', (newGameOption: GuessSongGameOption) => {

            console.log('buffer-music', newGameOption, gameOption)
            setGameOption((x) => {
                return { ...x, ...newGameOption }
            })

            if (selectedGameType.value != GuessSongGameType.custom) {
                youtubeRef.current?.target.cueVideoById({
                    'videoId': newGameOption.youtubeID,
                    'startSeconds': parseFloat(newGameOption.startTime),
                    'endSeconds': parseFloat(newGameOption.startTime) + parseFloat(newGameOption.duration)
                })
            } else {
                if (gameOption.youtubeID != newGameOption.youtubeID) {
                    youtubeRef.current?.target.cueVideoById({
                        'videoId': newGameOption.youtubeID,
                        'startSeconds': parseFloat(newGameOption.startTime),
                        'endSeconds': parseFloat(newGameOption.startTime) + parseFloat(newGameOption.duration)
                    })
                } else {
                    socket?.emit('finish-buffer-music', { roomID, playerID: socket.id });
                }
            }
        });

        return () => {
            socket?.removeListener('message')
            socket?.removeListener('update-room-info')
            socket?.removeListener('buffer-music')
            socket?.removeListener('change-song-list')
            socket?.removeListener('play-music')
            socket?.removeListener('replay-music')
        };
    }, [isHost, state, selectedGameType, gameOption])


    useEffect(() => {
        if (!isHost) return
        socket?.emit("change-song-list", { roomID }, filteredSongList.map((k) => {
            return { display_name: k.display_name }
        }))
    }, [filteredSongList, isHost])

    useEffect(() => {
        setGameOption((k) => {
            return {
                ...k,
                answerRaceChoicesNumber: answerRaceChoicesNumber.value
            }
        })
    }, [answerRaceChoicesNumber])

    useEffect(() => {
        chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight })
    }, [messages])

    useEffect(() => {
        setIsAnswered(false)
    }, [gameOption.answerRaceChoices])


    const showMessage = (message: string, messageDetails?: MessageDetails) => {
        toast(message, {
            position: "top-center",
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: messageDetails?.type ?? 'default',
            progress: undefined,
            theme: 'colored',
            className: "",
        })

    }

    const showRequest = (playerName: string, requestType: RequestType) => {
        let message = ""
        switch (requestType) {
            case "replay":
                message = playerName + " requested replay"
                if (replayRef.current)
                    toast.dismiss(replayRef.current)
                break;
            case "anotherSection":
                message = "Players requested another section"
                if (anotherSectionRef.current)
                    toast.dismiss(anotherSectionRef.current)
                break;
            case "longer":
                message = "Players requested longer"
                if (longerRef.current)
                    toast.dismiss(longerRef.current)
                break;
        }
        let id = toast(message, {
            position: 'bottom-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            closeButton: () => {
                switch (requestType) {
                    case "replay":
                        return <div className='flex items-center'>
                            <button className='btn bg-red txt-white !min-w-min' onClick={() => {
                                playSong()
                                if (replayRef.current)
                                    toast.dismiss(replayRef.current)
                            }
                            }>Replay</button>
                        </div >
                    case "anotherSection":
                        return <div className='flex items-center'>
                            <button className='btn bg-red txt-white !min-w-min' onClick={() => {
                                broadCastConfigWithRandomTime(true)
                                if (anotherSectionRef.current)
                                    toast.dismiss(anotherSectionRef.current)
                            }}>Start(R)</button>
                        </div >
                    case "longer":
                        return <div className='flex items-center'>
                            <button className='btn bg-red txt-white !min-w-min' onClick={() => {
                                broadCastConfigWithLongerTime()
                                if (longerRef.current)
                                    toast.dismiss(longerRef.current)
                            }
                            }>Add 1s</button>
                        </div >
                }
            },
            type: 'default',
            theme: 'light',
            className: "",
        })
        switch (requestType) {
            case "replay":
                replayRef.current = id
                break;
            case "anotherSection":
                anotherSectionRef.current = id
                break;
            case "longer":
                longerRef.current = id
                break;
        }
    }

    const sendMessage = () => {
        // Send the message to the server
        socket?.emit('message', { roomID }, currentMessage);
        // Clear the currentMessage state
        setCurrentMessage('');
    };

    const getSongList = useCallback(async () => {
        // Send the message to the server
        let result = await axios.get<Songs[]>("/api/songs")
        if (selectedGameType.value == GuessSongGameType.chunithm)
            setSongList(result.data)
        console.log(result)
    }, [selectedGameType])

    const getMaimaiSongList = useCallback(async () => {
        // Send the message to the server
        let result = await axios.get<MaimaiSongs[]>("/api/songs/maimaiSongList")
        if (selectedGameType.value == GuessSongGameType.maimai)
            setSongList(result.data)
        console.log(result)
    }, [selectedGameType])

    const getPlaylist = useCallback(async () => {
        // Send the message to the server
        try {
            setIsLoadingSongList(true)
            let result = await axios.get<Songs[]>(`/api/songs/playlist?id=${playlist}`)
            if (selectedGameType.value == GuessSongGameType.playlist) {
                setSongList(result.data)
                showMessage("Loaded youtube playlist successfully, press `Next` to change the song!")
            }
            console.log(result)
        } catch (error) {
        }
        setIsLoadingSongList(false)
    }, [selectedGameType, playlist]);

    const getNextSong = async () => {
        let song = _.sampleSize<GuessGameSong>(filteredSongList, 1)[0]
        console.log(song)
        setCurrentSong(song)
        setCustomSongList([])
        setCustomYoutubeLink("")
        setIsLoadingNextSong(true)
        if (!gameOption.isFixedStartTime) {
            setShouldGetNewRandomStartTime(true)
        }
        try {
            if (selectedGameType.value == GuessSongGameType.playlist && song.youtube_link) {
                if (isHost) {
                    socket?.emit("get-player-count", { roomID }, (playerCount: number) => {
                        console.log("total player", playerCount)
                        if (playerCount <= 1) {
                            setShouldSendBufferedSignal(false)
                        }
                        youtubeRef.current?.target.cueVideoById({
                            'videoId': song.youtube_link,
                            'startSeconds': parseFloat(gameOption.startTime),
                            'endSeconds': parseFloat(gameOption.startTime) + parseFloat(gameOption.duration)
                        })
                        showMessage("Changed to next song")
                    })
                }
                setGameOption((gameOption) => {
                    return {
                        ...gameOption,
                        youtubeID: song.youtube_link ?? gameOption.youtubeID
                    }
                })
                setShouldStartNewRound(true)
            }
            else {
                let url = selectedGameType.value == GuessSongGameType.chunithm ? `/api/songs/youtubeID?type=chunithm&id=${song.id}` : `/api/songs/youtubeID?type=maimai&id=${song.display_name}`
                let youtubeAPIResult = await axios.get(url)
                console.log(youtubeAPIResult)
                if (isHost) {
                    socket?.emit("get-player-count", { roomID }, (playerCount: number) => {
                        console.log("total player", playerCount)
                        if (playerCount <= 1) {
                            setShouldSendBufferedSignal(false)
                        }
                        youtubeRef.current?.target.cueVideoById({
                            'videoId': youtubeAPIResult.data,
                            'startSeconds': parseFloat(gameOption.startTime),
                            'endSeconds': parseFloat(gameOption.startTime) + parseFloat(gameOption.duration)
                        })
                        showMessage("Changed to next song")
                    })
                }
                setGameOption((gameOption) => {
                    return {
                        ...gameOption,
                        youtubeID: youtubeAPIResult.data
                    }
                })
                setShouldStartNewRound(true)
            }
        } catch (error) {
            showMessage("Cannot get next song", { type: "error" })
        }

        setIsLoadingNextSong(false)
    }

    const youtubeVideoOnReady: YouTubeProps['onReady'] = (e) => {
        console.log('youtube video ready')
        e.target.setVolume(20)
        e.target.pauseVideo()
        e.target.mute()
        if (!youtubeRef.current) {
            youtubeRef.current = e;
        }
    }

    const youtubeVideoOnError: YouTubeProps['onError'] = (e) => {
        console.log('youtube video error')
        // youtubeRef.current = undefined;
        showMessage(`Cannot load the music, error code ${e.data}`, { type: 'error' })
    }

    const broadCastReplaySong = () => {
        socket?.emit('replay-music', { roomID });
    }

    const broadCastConfig = () => {
        if (selectedGameType.value == GuessSongGameType.custom) {
            socket?.emit('load-music', { roomID }, gameOption, currentSong?.display_name, true);
        } else {
            socket?.emit('load-music', { roomID }, gameOption, currentSong?.display_name, shouldStartNewRound);
        }
        setShouldStartNewRound(false)
    }

    const broadCastConfigWithRandomTime = (isSameSong: boolean = false) => {
        let [randomTime, song] = getRandomTime(isSameSong)
        if (selectedGameType.value == GuessSongGameType.custom) {
            socket?.emit('load-music', { roomID }, { ...gameOption, startTime: randomTime?.toString() }, song?.display_name, !isSameSong);
        } else {
            socket?.emit('load-music', { roomID }, { ...gameOption, startTime: randomTime?.toString() }, currentSong?.display_name, shouldStartNewRound);
        }
        setShouldStartNewRound(false)
    }

    const broadCastConfigWithLongerTime = () => {
        setGameOption((k) => {
            return {
                ...k,
                duration: (parseFloat(k.duration) + 1).toString()
            }
        })
        if (selectedGameType.value == GuessSongGameType.custom) {
            socket?.emit('load-music', { roomID }, { ...gameOption, duration: (parseFloat(gameOption.duration) + 1).toString() }, currentSong?.display_name, shouldStartNewRound);
        } else {
            socket?.emit('load-music', { roomID }, { ...gameOption, duration: (parseFloat(gameOption.duration) + 1).toString() }, currentSong?.display_name, shouldStartNewRound);
        }
        setShouldStartNewRound(false)
    }

    const testSong = () => {
        if (selectedGameType.value != GuessSongGameType.custom) {
            youtubeRef.current?.target.loadVideoById({
                'videoId': gameOption.youtubeID,
                'startSeconds': parseFloat(gameOption.startTime),
                'endSeconds': parseFloat(gameOption.startTime) + parseFloat(gameOption.duration)
            })
            youtubeRef.current?.target.playVideo()
        } else {
            playSong()
        }
    }

    const playSong = () => {
        if (timer.current)
            clearTimeout(timer.current)

        console.log("start play music", gameOption.startTime, gameOption.duration)
        if (selectedGameType.value == GuessSongGameType.custom && isJoined) {
            youtubeRef.current?.target.unMute()
        }
        youtubeRef.current?.target.seekTo(parseFloat(gameOption?.startTime), true)
        youtubeRef.current?.target.playVideo()
    }

    const makeRequest = (request: RequestType) => {
        switch (request) {
            case "replay":
                socket?.emit('request-replay', { roomID, playerID: socket.id });
                break;
            case "anotherSection":
                socket?.emit('request-another-section', { roomID, playerID: socket.id });
                break;
            case "longer":
                socket?.emit('request-longer', { roomID, playerID: socket.id });
                break;
            default:
                break;
        }

    }

    const joinGame = () => {
        console.log("join-game", socket?.id)
        // youtubeRef.current?.target.seekTo(gameOption?.startTime, true)

        socket?.emit('join-game', { roomID, playerID: socket.id });
        youtubeRef.current?.target.unMute()
        setIsJoined(true)
    }

    const handleOnSelect = (result: GuessGameSong) => {
        setAnswer(result.display_name)
    }

    const handleOnSearch = (string: string, results: GuessGameSong[]) => {
        // onSearch will have as the first callback parameter
        // the string searched and for the second the results.
        setAnswer(string)
    }

    const sendAnswer = () => {


        socket?.emit('send-answer', { roomID, playerID: socket.id }, answer);

        setAnswer("")
    }

    const getRandomTime = (isSameSong: boolean = false): [number, GuessGameSong?] => {
        let randomTime = 0
        if (selectedGameType.value == GuessSongGameType.custom) {
            let randomSongIndex = isSameSong ? _.findIndex(songList, currentSong) : _.random(songList.length - 1)
            if (customSongList[randomSongIndex]) {
                let startTime = customSongList[randomSongIndex].startTime
                let endTime = customSongList[randomSongIndex + 1] ? customSongList[randomSongIndex + 1].startTime : parseFloat(youtubeRef.current?.target.getDuration())
                randomTime = ~~Math.max(startTime, startTime + _.random(endTime - startTime) - parseFloat(gameOption.duration))
                setGameOption((gameOption) => {
                    return {
                        ...gameOption,
                        startTime: randomTime.toString()
                    }
                })

                setShouldStartNewRound(true)
                setCurrentSong(customSongList[randomSongIndex])
                return [randomTime, customSongList[randomSongIndex]]
            } else {
                setGameOption((gameOption) => {
                    return {
                        ...gameOption,
                        startTime: randomTime.toString()
                    }
                })
                setShouldStartNewRound(true)
                return [randomTime, customSongList[randomSongIndex]]
            }

        } else {
            randomTime = ~~Math.max(0, _.random(parseFloat(youtubeRef.current?.target.getDuration()) - parseFloat(gameOption.duration)))
            setGameOption((gameOption) => {
                return {
                    ...gameOption,
                    startTime: randomTime.toString()
                }
            })

            return [randomTime, currentSong]
        }
    }

    const showAnswer = () => {
        socket?.emit('show-answer', { roomID, playerID: socket.id });
    }

    const surrender = () => {
        socket?.emit('surrender', { roomID, playerID: socket.id });
    }

    const canControlGamePanel = gameOption.startTime && gameOption.duration && filteredSongList.length > 0
    const playerInfo = useMemo(() => {
        return _.find(roomInfo?.players, k => { return k.id == socket?.id })
    }, [roomInfo, socket, state])

    return (
        <LayoutWrapper>
            <div className='flex flex-wrap justify-center'>
                <div id={`guess-song-game-${isHost ? 'host' : 'player'}-space`} className={classNames({ 'min-h-[800px]': !isHost })}>
                    <h1 className='tc mb-5'>{roomID}</h1>
                    <div id={`guess-song-game-${isHost ? 'host' : 'player'}-chatbox`}>
                        <div className='flex-1'>
                            {/* Display the messages */}
                            <div ref={chatBoxRef} className="box box-shadow p-2 h-[300px] overflow-y-scroll">
                                {messages.map((message, index) => (
                                    <p key={index}>{message}</p>
                                ))}
                            </div>

                            {/* Input field for sending new messages */}
                            {isJoined && <><div className='flex my-5'>
                                <input value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)}
                                    className='px-4 py-2 box box-shadow w-full' placeholder='Chat'></input>
                                <button disabled={currentMessage.length == 0} className='btn btn-secondary ml-2' onClick={sendMessage}>Send</button>
                            </div>
                                {gameOption.answerRaceChoices.length <= 0 ? <div className='flex my-5'>
                                    <ReactSearchAutocomplete<GuessGameSong>
                                        inputSearchString={answer}
                                        items={filteredSongList}
                                        onSearch={handleOnSearch}
                                        onClear={() => { setAnswer(undefined) }}
                                        // onHover={handleOnHover}
                                        onSelect={handleOnSelect}
                                        // onFocus={handleOnFocus}
                                        fuseOptions={{ keys: ["display_name"] }}
                                        resultStringKeyName='display_name'
                                        placeholder='Answer'
                                        key={"display_name"}
                                        // formatResult={formatResult}
                                        showIcon={false}
                                        styling={{
                                            borderRadius: '10px',
                                            height: "auto",
                                            boxShadow: "0 1px 5px rgba(0, 0, 0, 0.3)",
                                            backgroundColor: "#d9e9ee",
                                            fontFamily: "inherit",
                                            fontSize: 'inherit',
                                            zIndex: 99
                                        }}
                                        className='flex-1 auto-search'
                                    />
                                    <button disabled={playerInfo?.isSurrendered} className='btn btn-secondary ml-2' onClick={sendAnswer}>Answer</button>
                                </div>
                                    : <div className='my-5 box box-shadow w-full flex p-4 flex-wrap'>
                                        {_.map(gameOption.answerRaceChoices, (k, i) => {
                                            return <button disabled={isAnswered || playerInfo?.isSurrendered == true} key={i} className='btn m-1 answer-race bg-master' onClick={
                                                () => {
                                                    setIsAnswered(true)
                                                    socket?.emit('send-answer', { roomID, playerID: socket.id }, k, true);
                                                }
                                            }>{k}</button>
                                        })}
                                    </div>}
                                <div className='my-5 flex justify-between flex-wrap items-center'>
                                    <div className='flex flex-wrap items-center'>
                                        <span className='bold'>Request: </span>
                                        <button disabled={playerInfo?.isSurrendered} className='btn btn-secondary ml-2 my-1 !min-w-fit' onClick={() => makeRequest("replay")}>Replay</button>
                                        <button disabled={playerInfo?.isSurrendered} className='btn btn-secondary ml-2 my-1 !min-w-fit' onClick={() => makeRequest("longer")}>Longer</button>
                                        <button disabled={playerInfo?.isSurrendered} className='btn btn-secondary mx-2 my-1 !min-w-fit' onClick={() => makeRequest("anotherSection")}>Section</button>
                                    </div>
                                    <button disabled={playerInfo?.isSurrendered} className='btn bg-red text-white my-1' onClick={surrender}>Surrender</button>
                                </div>
                            </>}
                            {!isJoined && <button className='btn btn-secondary my-5' onClick={joinGame}>Join</button>}
                        </div>
                        <div id={`guess-song-game-${isHost ? 'host' : 'player'}-scorebox`} className='box box-shadow'>
                            {roomInfo && roomInfo.players.map((k, i) => {
                                return <ul key={i} className='even:bg-[#eab058] odd:bg-[#ea8b58]'>
                                    <li className='px-5 py-3 text-white'>
                                        <div className='flex justify-between'>
                                            <div className='flex items-center'>
                                                <div className='mr-1'>{k.name}</div>
                                                {k.isHost && <FaRobot className='mr-1' />}
                                                {k.isSurrendered && <FaFlag />}
                                            </div>
                                            {(!k.isHost || (k.isHost && k.isJoined)) && <span>{`score: ${k.score}`}</span>}
                                        </div>
                                    </li>
                                </ul>
                            })}
                        </div>
                    </div>
                </div>
                {isHost &&
                    <div id="guess-song-game-host" className=''>
                        <h1 className='tc mb-5'>Host</h1>
                        <div className="flex items-center justify-between px-4">
                            <div className=''>
                                <div className='ml-2 mb-2'>Game Type: </div>
                                <ListBox className="w-[7.5rem]" source={guessSongGameType} selected={selectedGameType} setSelected={setSelectedGameType} />
                            </div>
                            {selectedGameType.value != GuessSongGameType.playlist && selectedGameType.value != GuessSongGameType.custom &&
                                <div className=''>
                                    <div className='ml-2 mb-2'>Level: </div>
                                    <div className="flex justify-between items-center">
                                        <ListBox className="w-[5.5rem]" source={level.filter(k => {
                                            return k.value <= upperLevelRange.value
                                        })} selected={lowerLevelRange} setSelected={setLowerLevelRange} />
                                        <span className="text-lg mx-2 bold"> ー </span>
                                        <ListBox className="w-[5.5rem]" source={level.filter(k => {
                                            return k.value >= lowerLevelRange.value
                                        })} selected={upperLevelRange} setSelected={setUpperLevelRange} />
                                    </div>
                                </div>}
                        </div>
                        <div className='flex items-center ml-2 my-5'>
                            <div className='mr-2 bold'>Number of options: </div>
                            <ListBox className="w-[4.25rem]" source={answerChoices} selected={answerRaceChoicesNumber} setSelected={setAnswerRaceChoicesNumber} />
                        </div>

                        {selectedGameType.value == GuessSongGameType.playlist && <div className='flex my-5'>
                            <input value={playlist} onChange={(e) => {
                                try {
                                    let url = new URL(e.target.value)
                                    let id: string
                                    id = url.searchParams.get('list') ?? ""
                                    setPlaylist(id)
                                } catch (error) {
                                    setPlaylist(e.target.value)
                                }

                            }}
                                className='px-4 py-2 mr-2 box box-shadow w-full' placeholder='Youtube link'></input>
                            <button disabled={(playlist.length <= 0)} className='btn btn-secondary ml-2' onClick={() => {
                                getPlaylist()
                            }
                            }>{isLoadingSongList ? <LoadingView /> : "Load"}</button>
                        </div>}
                        {selectedGameType.value == GuessSongGameType.custom && <div className='flex my-5'>
                            <input value={customYoutubeLink} onChange={(e) => {
                                try {
                                    let url = new URL(e.target.value)
                                    let id: string
                                    if (e.target.value.includes("youtu.be")) {
                                        id = url.pathname.split("/")[1]
                                    }
                                    else {
                                        id = url.searchParams.get('v') ?? ""
                                    }
                                    setCustomYoutubeLink(id)
                                } catch (error) {
                                    setCustomYoutubeLink(e.target.value)
                                }

                            }}
                                className='px-4 py-2 mr-2 box box-shadow w-full' placeholder='Youtube link'></input>
                            <button className='btn btn-secondary ml-2 ' onClick={() => {
                                if (!customYoutubeLink) {
                                    showMessage("Please input the link first!", {
                                        type: "error"
                                    })
                                    return
                                }
                                setIsInputAnswerSetModalOpen(true)
                            }
                            }>Config</button>
                            <button disabled={customSongList.length == 0 || !customYoutubeLink} className='btn btn-secondary ml-2' onClick={() => {

                                setShouldSendBufferedSignal(false)
                                setGameOption((gameOption) => {
                                    return {
                                        ...gameOption,
                                        youtubeID: customYoutubeLink,
                                    }
                                })
                                youtubeRef.current?.target.cueVideoById({
                                    'videoId': customYoutubeLink,
                                    'startSeconds': parseFloat(gameOption.startTime),
                                    'endSeconds': parseFloat(gameOption.startTime) + parseFloat(gameOption.duration)
                                })
                            }
                            }>Load</button>
                        </div>}
                        <div className='mt-5'>
                            <div className="flex justify-between items-center">
                                <div className='p-2 bold'>Start Time</div>
                                {selectedGameType.value != GuessSongGameType.custom && <div className="flex justify-center items-center">
                                    <input onChange={(e) => {
                                        setGameOption((gameOption) => {
                                            return {
                                                ...gameOption,
                                                isFixedStartTime: e.target.checked
                                            }
                                        })
                                    }} checked={gameOption.isFixedStartTime} id="game-fullscreen" className="checkbox" type="checkbox" />
                                    <label className="ml-2 text-sm font-medium text-gray-900 " htmlFor="game-fullscreen">Fixed Time</label>
                                </div>}
                            </div>
                            <div className='flex '>
                                <input value={gameOption.startTime} onChange={(e) => setGameOption((gameOption) => {
                                    const re = /^(\d*)?(\.\d{0,1})?$/
                                    if (re.test(e.target.value))
                                        return {
                                            ...gameOption,
                                            startTime: e.target.value
                                        }
                                    return gameOption
                                })}
                                    className='px-4 py-2 box box-shadow w-full' placeholder='Start Time'></input>
                                <button className='btn btn-secondary ml-2' onClick={() => getRandomTime()}>Random</button>
                            </div>
                        </div>
                        <div className='mb-5'>
                            <div className='p-2 bold'>Duration</div>
                            <div className='flex'>
                                <input value={gameOption.duration} onChange={(e) => setGameOption((gameOption) => {
                                    const re = /^(\d*)?(\.\d{0,1})?$/
                                    if (re.test(e.target.value))
                                        return {
                                            ...gameOption,
                                            duration: e.target.value
                                        }
                                    return gameOption
                                })}
                                    className='px-4 py-2 box box-shadow w-full' placeholder='Duration'></input>
                            </div>
                        </div>
                        {!canControlGamePanel && (!gameOption.duration || !gameOption.startTime) && <div className='text-red-500 bold'>Please input both start time and duration!</div>}
                        <div className='flex flex-wrap my-5'>
                            <button disabled={!canControlGamePanel || !currentSong} className='btn bg-red txt-white mr-2 my-1' onClick={broadCastConfig}>Start</button>
                            <button disabled={!canControlGamePanel || (selectedGameType.value != GuessSongGameType.custom && !currentSong)} className='btn bg-red txt-white mr-2 my-1'
                                onClick={() => { broadCastConfigWithRandomTime() }}>Start(R)</button>
                            <button disabled={!canControlGamePanel || !currentSong} className='btn bg-red txt-white mr-2 my-1' onClick={broadCastReplaySong}>Replay</button>
                            <button disabled={!canControlGamePanel || !currentSong} className='btn bg-red txt-white my-1' onClick={showAnswer}>Reveal</button>
                        </div>
                        <div className='flex my-5 items-center'>
                            <div className='flex flex-1 items-center'>
                                <button disabled={!canControlGamePanel} className='btn btn-secondary mr-2 my-1' onClick={testSong}>Test</button>
                                {selectedGameType.value != GuessSongGameType.custom && <button disabled={!canControlGamePanel} className='btn btn-secondary my-1' onClick={getNextSong}>
                                    {isLoadingNextSong ? <LoadingView /> : "Next"}</button>}
                            </div>
                            <button className='btn btn-secondary' onClick={() => {
                                setIsShowVideo(!isShowVideo)
                            }}>{!isShowVideo ? "Show Video" : "Hide Video"}</button>
                        </div>
                    </div>
                }

            </div>
            <div className='relative inner inner-p20 inner-540'>
                <YouTube videoId="69plnXaTTnE" opts={{
                    height: '100%',
                    width: '100%',
                    playerVars: {
                        // https://developers.google.com/youtube/player_parameters
                        // playsinline: 1,
                        controls: 1,
                        disablekb: 1,
                        fs: 0,
                        // start: gameOption.startTime,
                        // end: gameOption.startTime + gameOption.duration
                    },
                }} style={(isHost && isShowVideo) ? { opacity: 1, aspectRatio: 16 / 9 } : { opacity: 0, position: "absolute", top: -999, height: 100, width: 100 }}
                    onReady={youtubeVideoOnReady} onPlay={() => {
                        if (selectedGameType.value == GuessSongGameType.custom) {
                            timer.current = setTimeout(() => {
                                youtubeRef.current?.target.pauseVideo()
                            }, parseFloat(gameOption?.duration) * 1000)
                        }
                    }} onError={youtubeVideoOnError} onStateChange={(e: any) => {
                        console.log("video time : ", youtubeRef.current?.target.getCurrentTime(), e.data)
                        if (e.data == 5) {
                            console.log("finish buffer")
                            // youtubeRef.current?.target.playVideo()
                            if (shouldSendBufferedSignal) {
                                console.log("finish buffer", "emit")
                                socket?.emit('finish-buffer-music', { roomID, playerID: socket.id });
                            } else {
                                setShouldSendBufferedSignal(true)
                                if (customYoutubeLink && customSongList.length > 0) {
                                    setSongList(customSongList)
                                    showMessage("Loaded custom video successfully")
                                }
                            }
                            if (shouldGetNewRandomStartTime) {
                                console.log("shouldGetNewRandomStartTime", "youtube")
                                getRandomTime()
                                setShouldGetNewRandomStartTime(false)
                            }

                            if (selectedGameType.value == GuessSongGameType.custom) {
                                youtubeRef.current?.target.mute()
                                youtubeRef.current?.target.seekTo(0, true)
                                youtubeRef.current?.target.playVideo()
                            }
                        }
                    }} />
            </div>
            <InputAnswerSetModal youtube_link={customYoutubeLink} isOpen={isInputAnswerSetModalOpen} setIsOpen={setIsInputAnswerSetModalOpen} callBack={(songs: CustomSong[]) => {
                setCustomSongList(songs.sort((a, b) => a.startTime - b.startTime))
                setIsInputAnswerSetModalOpen(false)
            }} />
            <ToastContainer
            />
        </LayoutWrapper >
    );
};

export default GuessSongGame;



const InputAnswerSetModal: React.FC<Omit<ModalProps, "children"> & {
    youtube_link: string
    callBack: (songs: CustomSong[]) => void
}> = ({
    isOpen, setIsOpen, callBack, youtube_link
}) => {
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
1:04:06 - Koubou「Mami Kawada`)

        return <Modal title={"Please Input the answer set"} positiveBtnText={"Convert"} rightBtnCallBack={() => {
            let answerSetTextArray = answerSetText.split("\n")
            const re = /([0-9]?[0-9]:)?([0-5][0-9])(:[0-5][0-9])/
            let songList: CustomSong[] = []
            answerSetTextArray.map((k, i) => {
                let test = re.exec(k)
                if (test) {
                    // console.log(test)
                    let time = test[0].split(":")
                    let duration = 0
                    time.forEach((z, i) => {
                        duration += parseInt(z) * Math.pow(60, time.length - 1 - i)
                    })
                    let songName = k.replaceAll(test[0], "")
                    songList.push({
                        id: i,
                        youtube_link,
                        display_name: songName,
                        startTime: duration
                    })
                }
            })
            if (songList.length == 0) {
                callBack([{ id: 0, youtube_link, display_name: answerSetText, startTime: 0 }])
                return
            }
            console.log(songList)
            callBack(songList)
        }} isOpen={isOpen} setIsOpen={setIsOpen}>
            <div className='px-5'>
                <textarea value={answerSetText} onChange={e => setAnswerSetText(e.target.value)}
                    placeholder={`Song Name - [mm:ss]\nSong Name - [mm:ss]\nSong Name - [mm:ss]\nSong Name - [mm:ss]\nSong Name - [mm:ss]\n`}
                    className='box box-shadow h-[300px] w-full p-3'>

                </textarea>
            </div>
        </Modal>
    }

