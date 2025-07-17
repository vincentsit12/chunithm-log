import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo, SetStateAction, Dispatch } from 'react';
import { Socket, io } from "socket.io-client"
import _, { uniqBy, values } from 'lodash'
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import Songs, { MaimaiSongs } from 'db/model/songs';
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import { useRouter } from 'next/router';
import { Bounce, Id, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFlag, FaRobot, FaArrowLeft, FaHome } from "react-icons/fa";
import { MdMusicNote, MdChatBubble, MdCheck, MdGamepad, MdPeople, MdSettings, MdPlayArrow, MdVisibility, MdVisibilityOff, MdShuffle, MdReplay, MdTimer, MdSkipNext, MdStar, MdCancel } from "react-icons/md";

import ListBox from 'components/ListBox';
import { MessageDetails } from 'types';
import classNames from 'classnames';
import Modal, { ModalProps } from 'components/Modal';
import { CustomSong, GuessGameSong, GuessSongGameOption, RoomInfo } from 'Games/GuessSongGame/types';

// Message types enum matching Flutter design
enum MessageType {
    CORRECT = 'correct',
    WRONG = 'wrong',
    JOIN_LEAVE = 'joinLeave', 
    ANSWER = 'answer',
    NORMAL = 'normal'
}

// Message interface with type information
interface ChatMessage {
    content: string;
    type: MessageType;
    timestamp?: number;
}
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
        <svg aria-hidden="true" className="mx-auto w-6 h-6 text-gray-400 animate-spin fill-purple-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// Section Header Component (matching Flutter design)
const SectionHeader = ({ title, icon, iconColor = 'purple' }: { title: string; icon: React.ReactNode; iconColor?: 'purple' | 'red' }) => (
    <div className="flex items-center mb-6">
        <div className={`bg-gradient-to-r p-2 rounded-xl shadow-lg ${
            iconColor === 'red' 
                ? 'from-red-500 to-red-600' 
                : 'from-purple-600 to-purple-700'
        }`}>
            {icon}
        </div>
        <h2 className="text-xl font-bold text-white ml-3">{title}</h2>
    </div>
);

// Chat Header Component (matching Flutter chat header)
const ChatHeader = ({ messageCount }: { messageCount: number }) => (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg">
                    <MdChatBubble className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg ml-3">Game Chat</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white font-bold text-sm">{messageCount}</span>
            </div>
        </div>
    </div>
);

// Message Component with different styles for different types
const ChatMessageComponent = ({ message }: { message: ChatMessage }) => {
    const getMessageStyle = (type: MessageType) => {
        switch (type) {
            case MessageType.CORRECT:
                return {
                    bgColor: 'bg-emerald-500/20',
                    borderColor: 'border-emerald-500/30',
                    textColor: 'text-emerald-300',
                    icon: <MdCheck className="w-4 h-4 text-emerald-400" />
                };
            case MessageType.WRONG:
                return {
                    bgColor: 'bg-red-500/20',
                    borderColor: 'border-red-500/30', 
                    textColor: 'text-red-300',
                    icon: <MdCancel className="w-4 h-4 text-red-400" />
                };
            case MessageType.JOIN_LEAVE:
                return {
                    bgColor: 'bg-cyan-500/20',
                    borderColor: 'border-cyan-500/30',
                    textColor: 'text-cyan-300',
                    icon: <MdPeople className="w-4 h-4 text-cyan-400" />
                };
            case MessageType.ANSWER:
                return {
                    bgColor: 'bg-purple-500/20',
                    borderColor: 'border-purple-500/30',
                    textColor: 'text-purple-300',
                    icon: <MdMusicNote className="w-4 h-4 text-purple-400" />
                };
            case MessageType.NORMAL:
            default:
                return {
                    bgColor: 'bg-gray-700/20',
                    borderColor: 'border-gray-600/30',
                    textColor: 'text-gray-200',
                    icon: <MdChatBubble className="w-4 h-4 text-gray-400" />
                };
        }
    };

    const style = getMessageStyle(message.type);

    return (
        <div className={`${style.bgColor} ${style.borderColor} border rounded-lg p-3 mb-2 flex items-start gap-2`}>
            <div className="flex-shrink-0 mt-0.5">
                {style.icon}
            </div>
            <p className={`${style.textColor} text-sm leading-relaxed flex-1`}>
                {message.content}
            </p>
        </div>
    );
};

// Helper function to determine message type based on content
const determineMessageType = (message: string): MessageType => {
    const lowerMessage = message.toLowerCase();
    
    // Check for correct answers
    if (lowerMessage.includes('correct') || lowerMessage.includes('right') || 
        lowerMessage.includes('✓') || lowerMessage.includes('✅')) {
        return MessageType.CORRECT;
    }
    
    // Check for wrong answers
    if (lowerMessage.includes('wrong') || lowerMessage.includes('incorrect') || 
        lowerMessage.includes('failed') || lowerMessage.includes('✗') || 
        lowerMessage.includes('❌')) {
        return MessageType.WRONG;
    }
    
    // Check for join/leave messages
    if (lowerMessage.includes('joined') || lowerMessage.includes('left') || 
        lowerMessage.includes('disconnected') || lowerMessage.includes('connected') ||
        lowerMessage.includes('enter') || lowerMessage.includes('exit')) {
        return MessageType.JOIN_LEAVE;
    }
    
    // Check for answer-related messages
    if (lowerMessage.includes('answered') || lowerMessage.includes('guessed') || 
        lowerMessage.includes('solution') || lowerMessage.includes('answer is')) {
        return MessageType.ANSWER;
    }
    
    return MessageType.NORMAL;
};

const GuessSongGame = () => {

    // State to store the messages
    const [messages, setMessages] = useState<ChatMessage[]>([]);
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
            
            // Determine message type based on content
            const messageType = determineMessageType(message);
            
            const chatMessage: ChatMessage = {
                content: message,
                type: messageType,
                timestamp: Date.now()
            };
            
            setMessages((prevMessages) => [...prevMessages, chatMessage]);
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
        <div id='container' style={{
            background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)'
        }}>
            {/* Navigation Bar */}
            <div className='mb-2 w-fit mx-auto'>
                <div className='flex justify-center items-center mb-12'>
                    <div className='cursor-pointer flex items-center' onClick={() => router.push('/playground/guess_song_game/rooms')}>
                        <div className='bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-2xl shadow-lg'>
                            <MdMusicNote className='w-8 h-8 text-white' />
                        </div>
                        <h1 className='text-4xl font-bold text-white ml-4 tracking-wide'>Song Guesser</h1>
                    </div>
                </div>
            </div>

            <div className='flex flex-wrap justify-center'>
                <div id={`guess-song-game-${isHost ? 'host' : 'player'}-space`} className={classNames({ 'min-h-[800px]': !isHost })}>
                    <h1 className='text-center mb-8 text-3xl font-bold text-white tracking-wide'>{roomID}</h1>
                    <div id={`guess-song-game-${isHost ? 'host' : 'player'}-chatbox`} className='mb-4'>
                        <div className='flex-1'>
                            {/* Game Chat Section */}
                            <div className='mb-8 overflow-hidden guess-song-game-box'
                                style={{
                                    backdropFilter: 'blur(10px)'
                                }}>
                                <ChatHeader messageCount={messages.length} />

                                {/* Chat Messages */}
                                <div ref={chatBoxRef} className="p-4 overflow-y-scroll h-[300px]">
                                    {messages.map((message, index) => (
                                        <ChatMessageComponent key={index} message={message} />
                                    ))}
                                </div>
                            </div>
                            {/* End Gaem Chat section */}

                            {!isJoined && (
                                <div className='my-4'>
                                    <button
                                        className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'
                                        onClick={joinGame}
                                    >
                                        Join Game
                                    </button>
                                </div>
                            )}
                            {/* Chat Input */}
                            {isJoined && (
                                <div className='my-5 border-t border-gray-600/30'>
                                    <div className='flex'>
                                        <input
                                            value={currentMessage}
                                            onChange={(e) => setCurrentMessage(e.target.value)}
                                            className='guess-song-game-input px-4 py-3 w-full'
                                            placeholder='Type a meessage'
                                        />
                                        <button
                                            disabled={currentMessage.length == 0}
                                            className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl ml-3 font-semibold transition-all duration-200 shadow-lg'
                                            onClick={sendMessage}
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Answer Section */}
                            {isJoined && (
                                <div className='mb-8'>
                                    {gameOption.answerRaceChoices.length <= 0 ? (
                                        <div className='flex'>
                                            <ReactSearchAutocomplete<GuessGameSong>
                                                inputSearchString={answer}
                                                items={filteredSongList}
                                                onSearch={handleOnSearch}
                                                onClear={() => { setAnswer(undefined) }}
                                                onSelect={handleOnSelect}
                                                fuseOptions={{ keys: ["display_name"] }}
                                                resultStringKeyName='display_name'
                                                placeholder='Answer'
                                                key={"display_name"}
                                                showIcon={false}
                                                styling={{
                                                    borderRadius: '12px',
                                                    height: "auto",
                                                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                                                    backgroundColor: "#1E1E2E",
                                                    border: "1px solid rgba(75, 85, 99, 0.3)",
                                                    color: "#ffffff",
                                                    hoverBackgroundColor : 'gray',
                                                    fontFamily: "inherit",
                                                    fontSize: 'inherit',
                                                    zIndex: 99,
                                                }}
                                                className='flex-1 auto-search'
                                            />
                                            <button
                                                disabled={playerInfo?.isSurrendered}
                                                className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl ml-3 font-semibold transition-all duration-200 shadow-lg'
                                                onClick={sendAnswer}
                                            >
                                                Answer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='flex flex-wrap gap-3'>
                                            {_.map(gameOption.answerRaceChoices, (k, i) => {
                                                return (
                                                    <button
                                                        disabled={isAnswered || playerInfo?.isSurrendered == true}
                                                        key={i}
                                                        className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'
                                                        onClick={() => {
                                                            setIsAnswered(true)
                                                            socket?.emit('send-answer', { roomID, playerID: socket.id }, k, true);
                                                        }}
                                                    >
                                                        {k}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Game Controls Section */}
                            {isJoined && (
                                <div className='mb-8 p-6 guess-song-game-box'>
                                    <SectionHeader
                                        title="Game Controls"
                                        icon={<MdGamepad className="w-5 h-5 text-white" />}
                                    />

                                    <div className='mb-4'>
                                        <span className='text-gray-300 font-semibold text-sm mb-3 block'>Request Options:</span>
                                        <div className='flex flex-wrap gap-3'>
                                            <button
                                                disabled={playerInfo?.isSurrendered}
                                                className='bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center gap-2'
                                                onClick={() => makeRequest("replay")}
                                            >
                                                <MdReplay className="w-4 h-4" />
                                                Replay
                                            </button>
                                            <button
                                                disabled={playerInfo?.isSurrendered}
                                                className='bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center gap-2'
                                                onClick={() => makeRequest("longer")}
                                            >
                                                <MdTimer className="w-4 h-4" />
                                                Longer
                                            </button>
                                            <button
                                                disabled={playerInfo?.isSurrendered}
                                                className='bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center gap-2'
                                                onClick={() => makeRequest("anotherSection")}
                                            >
                                                <MdSkipNext className="w-4 h-4" />
                                                Section
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        disabled={playerInfo?.isSurrendered}
                                        className='bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg w-full flex items-center justify-center gap-2'
                                        onClick={surrender}
                                    >
                                        <FaFlag className="w-4 h-4" />
                                        Surrender
                                    </button>
                                </div>
                            )}

                        </div>


                        {/* Players Section */}
                        <div id={`guess-song-game-${isHost ? 'host' : 'player'}-scorebox`} className='guess-song-game-box overflow-hidden'>
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <MdPeople className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-white font-bold text-lg ml-3">Players</span>
                                    </div>
                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                        <span className="text-white font-bold text-sm">{roomInfo?.players?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div >
                                {roomInfo && roomInfo.players.map((k, i) => {
                                    const colors = [
                                        'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)', // Purple
                                        'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', // Cyan
                                        'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Emerald
                                        'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber
                                        'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', // Red
                                        'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', // Pink
                                    ];
                                    const playerColor = colors[i % colors.length];

                                    return (
                                        <div key={i} className="p-4 border-b border-gray-600/30 last:border-b-0">
                                            <div className='flex justify-between items-center'>
                                                <div className='flex items-center'>
                                                    {/* <div
                                                        className='w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold mr-3 shadow-lg'
                                                        style={{ background: playerColor }}
                                                    >
                                                        {k.name.charAt(0).toUpperCase()}
                                                    </div> */}
                                                    <div>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-white font-semibold'>{k.name}</span>
                                                            {k.isHost && <FaRobot className='text-yellow-300' />}
                                                            {k.isSurrendered && <FaFlag className='text-red-300' />}
                                                        </div>
                                                    </div>
                                                </div>
                                                {(!k.isHost || (k.isHost && k.isJoined)) && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-gray-700 px-3 py-1 rounded-lg flex items-center gap-1">
                                                            <MdStar className="w-3 h-3 text-amber-400" />
                                                            <span className='text-white font-semibold text-sm'>{k.score}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                </div>

                {isHost && (
                    <div id="guess-song-game-host">
                        <div className="p-6 mb-6 guess-song-game-box" >
                            <SectionHeader
                                title="Game Settings"
                                icon={<MdSettings className="w-5 h-5 text-white" />}
                            />

                            <div className="flex items-center justify-between px-4 mb-6">
                                <div className=''>
                                    <div className='ml-2 mb-2 text-purple-300 font-semibold'>Game Type: </div>
                                    <ListBox className="w-[7.5rem]" source={guessSongGameType} selected={selectedGameType} setSelected={setSelectedGameType} />
                                </div>
                                {selectedGameType.value != GuessSongGameType.playlist && selectedGameType.value != GuessSongGameType.custom &&
                                    <div className=''>
                                        <div className='ml-2 mb-2 text-purple-300 font-semibold'>Level: </div>
                                        <div className="flex justify-between items-center">
                                            <ListBox className="w-[5.5rem]" source={level.filter(k => {
                                                return k.value <= upperLevelRange.value
                                            })} selected={lowerLevelRange} setSelected={setLowerLevelRange} />
                                            <span className="text-lg mx-2 font-bold text-purple-300"> ー </span>
                                            <ListBox className="w-[5.5rem]" source={level.filter(k => {
                                                return k.value >= lowerLevelRange.value
                                            })} selected={upperLevelRange} setSelected={setUpperLevelRange} />
                                        </div>
                                    </div>}
                            </div>
                            <div className='flex items-center ml-2 my-5'>
                                <div className='mr-2 font-bold text-purple-300'>Number of options: </div>
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
                                    className='px-4 py-3 mr-2 guess-song-game-gradient rounded-xl w-full border border-gray-600/30 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors'
                                    placeholder='Youtube link'></input>
                                <button disabled={(playlist.length <= 0)} className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl ml-2 font-semibold transition-all duration-200 shadow-lg' onClick={() => {
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
                                    className='px-4 py-3 mr-2 guess-song-game-input w-full'
                                    placeholder='Youtube link'></input>
                                <button className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl ml-2 font-semibold transition-all duration-200 shadow-lg' onClick={() => {
                                    if (!customYoutubeLink) {
                                        showMessage("Please input the link first!", {
                                            type: "error"
                                        })
                                        return
                                    }
                                    setIsInputAnswerSetModalOpen(true)
                                }
                                }>Config</button>
                                <button disabled={customSongList.length == 0 || !customYoutubeLink} className='bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl ml-2 font-semibold transition-all duration-200 shadow-lg' onClick={() => {

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
                                    <div className='p-2 font-bold text-purple-300'>Start Time</div>
                                    {selectedGameType.value != GuessSongGameType.custom && <div className="flex justify-center items-center">
                                        <input onChange={(e) => {
                                            setGameOption((gameOption) => {
                                                return {
                                                    ...gameOption,
                                                    isFixedStartTime: e.target.checked
                                                }
                                            })
                                        }} checked={gameOption.isFixedStartTime} id="game-fullscreen" className="w-4 h-4 text-purple-600 bg-gray-700 border border-gray-600 rounded focus:ring-purple-500 focus:ring-2" type="checkbox" />
                                        <label className="ml-2 text-sm font-medium text-gray-300" htmlFor="game-fullscreen">Fixed Time</label>
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
                                        className='px-4 py-3 guess-song-game-gradient rounded-xl w-full border border-gray-600/30 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors'
                                        placeholder='Start Time'></input>
                                    <button className='bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl ml-2 font-semibold transition-all duration-200 shadow-lg flex items-center gap-2' onClick={() => getRandomTime()}>
                                        <MdShuffle className="w-4 h-4" />
                                        Random
                                    </button>
                                </div>
                            </div>
                            <div className='mb-5'>
                                <div className='p-2 font-bold text-purple-300'>Duration</div>
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
                                        className='px-4 py-3 guess-song-game-input w-full'
                                        placeholder='Duration'></input>
                                </div>
                            </div>
                            {!canControlGamePanel && (!gameOption.duration || !gameOption.startTime) && <div className='text-red-400 font-bold'>Please input both start time and duration!</div>}
                            <div className='flex flex-wrap my-5 gap-3'>
                                <button disabled={!canControlGamePanel || !currentSong} className='bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg' onClick={broadCastConfig}>Start</button>
                                <button disabled={!canControlGamePanel || (selectedGameType.value != GuessSongGameType.custom && !currentSong)} className='bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg'
                                    onClick={() => { broadCastConfigWithRandomTime() }}>Start(R)</button>
                                <button disabled={!canControlGamePanel || !currentSong} className='bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg' onClick={broadCastReplaySong}>Replay</button>
                                <button disabled={!canControlGamePanel || !currentSong} className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg' onClick={showAnswer}>Reveal</button>
                            </div>
                            <div className='flex my-5 items-center gap-3'>
                                <button disabled={!canControlGamePanel} className='bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg' onClick={testSong}>Test</button>
                                {selectedGameType.value != GuessSongGameType.custom && <button disabled={!canControlGamePanel} className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg' onClick={getNextSong}>
                                    {isLoadingNextSong ? <LoadingView /> : "Next"}</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* YouTube Video Section with Toggle Button */}
            <div className='inner inner-540' style={{
                position: isHost ? "relative" : "absolute",
                top: isHost ? "0" : "-9999px",
                left: isHost ? "0" : "-9999px",
            }}>
                <div className="p-6 guess-song-game-box">
                    <div className='flex justify-between items-center'>
                        <SectionHeader
                            title="Music Player"
                            icon={<MdPlayArrow className="w-5 h-5 text-white" />}
                            iconColor="red"
                        />
                        <button
                            className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 flex items-center gap-2 mb-6'
                            onClick={() => setIsShowVideo(!isShowVideo)}
                        >
                            {isShowVideo ? (
                                <MdVisibilityOff className="w-4 h-4" />
                            ) : (
                                <MdVisibility className="w-4 h-4" />
                            )}
                            {isShowVideo ? 'Hide Video' : 'Show Video'}
                        </button>
                    </div>
                    <div className="relative" style={{ aspectRatio: 16 / 9 }}>
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
                        }} style={isHost ? { aspectRatio: 16 / 9 } : { opacity: 0 }}
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
                        
                        {/* Overlay when video is hidden (only for hosts) */}
                        {isHost && !isShowVideo && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/30 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="bg-gray-700/50 p-4 rounded-xl mb-4 inline-block">
                                        <MdVisibilityOff className="w-8 h-8 text-gray-400 mx-auto" />
                                    </div>
                                    <h3 className="text-white font-semibold text-lg mb-2">Video Hidden</h3>
                                    <p className="text-gray-400 text-sm">
                                        Click &quot;Show Video&quot; to display video
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <InputAnswerSetModal youtube_link={customYoutubeLink} isOpen={isInputAnswerSetModalOpen} setIsOpen={setIsInputAnswerSetModalOpen} callBack={(songs: CustomSong[]) => {
                        setCustomSongList(songs.sort((a, b) => a.startTime - b.startTime))
                        setIsInputAnswerSetModalOpen(false)
                    }} />
                    <ToastContainer
                    />
                </div>
            </div>
        </div >
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
                    className='guess-song-game-input h-[300px] w-full p-4'
                  >

                </textarea>
            </div>
        </Modal>
    }

