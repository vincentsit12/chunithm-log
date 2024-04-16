import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { Socket, io } from "socket.io-client"
import _, { uniqBy, values } from 'lodash'
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import Songs, { MaimaiSongs } from 'db/model/songs';
import { GuessSongGameOption, RoomInfo } from '../../../api/socket';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import LayoutWrapper from 'components/LayoutWrapper';
import { useRouter } from 'next/router';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFlag } from "react-icons/fa6";

import ListBox from 'components/ListBox';
import { GuessGameSong, MessageDetails } from 'types';
import classNames from 'classnames';
const enum GuessSongGameType {
    chunithm = 1,
    maimai,
    playlist,
}

function useSocketClient() {
    const [state, setState] = useState(false)
    const socket = useRef<Socket>()
    useEffect(() => {

        fetch('/api/socket').
            catch(e => { console.log(e) }).
            finally(() => {
                socket.current = io()

                let socketRef = socket.current

                socket.current.on("connect", () => {
                    console.log("connected", socketRef.id);
                    setState(true)
                })

                socket.current.on("disconnect", () => {
                    console.log("Disconnected")
                    setState(false)
                })
                // socket.current.on("connect_error", async err => {
                //     console.log(`connect_error due to ${err.message}`)
                //     await fetch("/api/socket")
                // })
            })
    }, [])


    return { socket: socket.current, state }
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
}[] = [{ "name": "chunithm", "value": GuessSongGameType.chunithm }, { "name": "maimai", "value": GuessSongGameType.maimai }, { "name": "playlist", "value": GuessSongGameType.playlist }]

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

    const [customYoutubeLink, setCustomYoutubeLink] = useState<string>("")
    const [customAnswer, setCustomAnswer] = useState<string>("")


    const [isHost, setIsHost] = useState(false)

    const [isJoined, setIsJoined] = useState(false)

    const [isSurrendered, setIsSurrendered] = useState(false)

    const [shouldSendBufferedSignal, setShouldSendBufferedSignal] = useState(true)
    const [shouldGetNewRandomStartTime, setShouldGetNewRandomStartTime] = useState(false)
    const [shouldStartNewRound, setShouldStartNewRound] = useState(true)

    const [isShowVideo, setIsShowVideo] = useState(true)

    const chatBoxRef = useRef<HTMLDivElement>(null)

    const [selectedGameType, setSelectedGameType] = useState(guessSongGameType[0])
    const [answerRaceChoicesNumber, setAnswerRaceChoicesNumber] = useState(answerChoices[0])

    const [lowerLevelRange, setLowerLevelRange] = useState<{ name: string; value: number }>(level.find(k => k.value == chunithmDefaulLevelRange[0])!)
    const [upperLevelRange, setUpperLevelRange] = useState<{ name: string; value: number }>(level.find(k => k.value == chunithmDefaulLevelRange[1])!)

    const [playlist, setPlaylist] = useState<string>("")

    const [gameOption, setGameOption] = useState<GuessSongGameOption>({
        youtubeID: "Mru-JAtqagE",
        startTime: "10",
        duration: "2",
        isCustom: false,
        isFixedStartTime: false,
        answerRaceChoices: [],
        answerRaceChoicesNumber: answerRaceChoicesNumber.value,
    })

    const [roomInfo, setRoomInfo] = useState<RoomInfo>()

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

        socket?.on('update-room-info', (roomInfo: RoomInfo) => {
            console.log("updae", roomInfo)
            setRoomInfo(roomInfo)
        });

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
        }
        socket?.emit('change-game-type', { roomID }, selectedGameType.name)
    }, [selectedGameType, isHost])

    useEffect(() => {
        if ((!isHost || selectedGameType.value == GuessSongGameType.playlist)) {
            setFilteredSongList(songList)
            return
        }
        const isMaimaiSongs = (x: any): x is MaimaiSongs => true;
        let filteredSongList = songList.filter(k => {
            let isValid = false
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
    }, [songList, upperLevelRange, lowerLevelRange])

    useEffect(() => {
        socket?.on('replay-music', (message) => {
            console.log('replay-music', gameOption)
            replaySong()
        });

        socket?.on('play-music', (message) => {
            console.log('replay-music-11', gameOption)
            setTimeout(() => {
                console.log('replay-music-12', gameOption)
                playSong()
            }, 1000)

        });

        return () => {
            socket?.removeListener('play-music')
            socket?.removeListener('replay-music')
        };

    }, [gameOption, state])

    useEffect(() => {
        socket?.on('request-replay', (playerName: string) => {
            if (isHost) {
                toast(playerName + " Request Replay", {
                    position: 'bottom-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    closeButton: () => {
                        return <div className='flex items-center'>
                            <button className='btn bg-red txt-white !min-w-min' onClick={replaySong}>Replay</button>
                        </div>
                    },
                    type: 'default',
                    theme: 'light',
                    className: "",
                })
            }
        })

        return () => {
            socket?.removeListener('request-replay')
        };
    }, [gameOption, isHost, state])

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

        socket?.on('buffer-music', (gameOption: GuessSongGameOption) => {

            console.log('buffer-music', gameOption)
            setGameOption((x) => { return { ...x, ...gameOption } })
            youtubeRef.current?.target.cueVideoById({
                'videoId': gameOption.youtubeID,
                'startSeconds': parseFloat(gameOption.startTime),
                'endSeconds': parseFloat(gameOption.startTime) + parseFloat(gameOption.duration)
            })
        });

        socket?.on('change-song-list', (songList: GuessGameSong[]) => {
            if (!isHost) {
                setFilteredSongList(songList)
            }
        })

        return () => {
            socket?.removeListener('message')
            socket?.removeListener('buffer-music')
            socket?.removeListener('change-song-list')
        };
    }, [isHost, state])

    useEffect(() => {
        chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight })
    }, [messages])

    useEffect(() => {
        if (isHost)
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

    const sendMessage = () => {
        // Send the message to the server
        socket?.emit('message', { roomID }, currentMessage);
        // Clear the currentMessage state
        setCurrentMessage('');
    };

    const getSongList = async () => {
        // Send the message to the server
        let result = await axios.get<Songs[]>("/api/songs")
        setSongList(result.data)
        console.log(result)
    };

    const getMaimaiSongList = async () => {
        // Send the message to the server
        let result = await axios.get<MaimaiSongs[]>("/api/songs/maimaiSongList")
        setSongList(result.data)
        console.log(result)
    };

    const getPlaylist = async () => {
        // Send the message to the server
        let result = await axios.get<Songs[]>(`/api/songs/playlist?id=${playlist}`)
        setSongList(result.data)
        console.log(result)
    };

    const getNextSong = async () => {
        let song = _.sampleSize<GuessGameSong>(filteredSongList, 1)[0]
        console.log(song)
        setCurrentSong(song)
        setCustomAnswer("")
        setCustomYoutubeLink("")
        setGameOption(k => {
            return { ...k, isCustom: false, }
        })
        if (!gameOption.isFixedStartTime) {
            setShouldGetNewRandomStartTime(true)
        }
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
    }

    const broadCastReplaySong = () => {
        socket?.emit('replay-music', { roomID });
    }

    const broadCastConfig = () => {

        if (gameOption.isCustom) {
            socket?.emit('load-music', { roomID }, gameOption, customAnswer, shouldStartNewRound);
        } else {
            socket?.emit('load-music', { roomID }, gameOption, currentSong?.display_name, shouldStartNewRound);
        }

        setShouldStartNewRound(false)
    }

    const testSong = () => {
        youtubeRef.current?.target.loadVideoById({
            'videoId': gameOption.youtubeID,
            'startSeconds': parseFloat(gameOption.startTime),
            'endSeconds': parseFloat(gameOption.startTime) + parseFloat(gameOption.duration)
        })
        // youtubeRef.current?.target.seekTo(gameOption?.startTime, true)
        youtubeRef.current?.target.playVideo()
        // setTimeout(() => {
        //     youtubeRef.current?.target.pauseVideo()
        // }, gameOption.duration * 1000)
    }

    const replaySong = () => {
        console.log("replay", gameOption?.startTime)
        youtubeRef.current?.target.seekTo(parseFloat(gameOption?.startTime), true)
    }

    const playSong = () => {
        console.log("start play music", gameOption)
        youtubeRef.current?.target.seekTo(parseFloat(gameOption?.startTime), true)
        youtubeRef.current?.target.playVideo()
    }

    const requestReplySong = () => {
        socket?.emit('request-replay', { roomID, playerID: socket.id });
    }

    const joinGame = () => {
        console.log("join-game")
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

    const getRandomTime = () => {
        setGameOption((gameOption) => {
            return {
                ...gameOption,
                startTime: Math.max(0, _.random(parseFloat(youtubeRef.current?.target.getDuration())) - parseFloat(gameOption.duration) - 1).toString()
            }
        })
    }

    const showAnswer = () => {
        socket?.emit('show-answer', { roomID, playerID: socket.id });
    }

    const surrender = () => {
        socket?.emit('surrender', { roomID, playerID: socket.id });
    }

    const canControlGamePanel = isHost && gameOption.startTime && gameOption.duration && filteredSongList.length > 0
    const playerInfo = useMemo(() => { return _.find(roomInfo?.players, k => { return k.id == socket?.id }) }, [roomInfo, socket, state])

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
                                            zIndex: 999
                                        }}
                                        className='flex-1 auto-search'
                                    />
                                    <button disabled={playerInfo?.isSurrendered} className='btn btn-secondary ml-2' onClick={sendAnswer}>Answer</button>
                                </div>
                                    : <div className='my-5 box box-shadow w-full flex p-4 flex-wrap'>
                                        {_.map(gameOption.answerRaceChoices, (k, i) => {
                                            return <button key={i} className='btn m-1 answer-race bg-master' onClick={
                                                () => {
                                                    socket?.emit('send-answer', { roomID, playerID: socket.id }, k);
                                                }
                                            }>{k}</button>
                                        })}
                                    </div>}
                                <div className='my-5 flex'>
                                    <button disabled={playerInfo?.isSurrendered} className='btn btn-secondary mr-2' onClick={requestReplySong}>Request Replay</button>
                                    <button disabled={playerInfo?.isSurrendered} className='btn bg-red text-white' onClick={surrender}>Surrender</button>
                                </div>
                            </>}
                            {!isJoined && <button className='btn btn-secondary my-5' onClick={joinGame}>Join</button>}
                        </div>
                        <div id={`guess-song-game-${isHost ? 'host' : 'player'}-scorebox`} className='box box-shadow'>
                            {roomInfo && roomInfo.players.map(k => {
                                return <ul className='even:bg-[#eab058] odd:bg-[#ea8b58]'>
                                    <li className='px-5 py-3 text-white'>
                                        <div className='flex justify-between'>
                                            <div className='flex items-center'>
                                                <div className='mr-2'>{k.name}</div>
                                                {k.isSurrendered && <FaFlag />}
                                            </div>
                                            <span>{`score: ${k.score}`}</span>
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
                            {selectedGameType.value != GuessSongGameType.playlist &&
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
                            }>Load</button>
                        </div>}
                        <div className='flex my-5'>
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
                            <input value={customAnswer} onChange={(e) => {
                                setCustomAnswer(e.target.value)
                            }}
                                className='px-4 py-2 box box-shadow w-full' placeholder='Answer'></input>
                            <button className='btn btn-secondary ml-2' onClick={() => {

                                if (customYoutubeLink && customAnswer) {
                                    setShouldSendBufferedSignal(false)
                                    setGameOption((gameOption) => {
                                        return {
                                            ...gameOption,
                                            youtubeID: customYoutubeLink,
                                            isCustom: true,
                                        }
                                    })
                                    youtubeRef.current?.target.cueVideoById({
                                        'videoId': customYoutubeLink,
                                        'startSeconds': parseFloat(gameOption.startTime),
                                        'endSeconds': parseFloat(gameOption.startTime) + parseFloat(gameOption.duration)
                                    })
                                } else {
                                    alert("Please input both youtube link and answer!")
                                }
                            }
                            }>Load</button>
                        </div>
                        <div className='mt-5'>
                            <div className="flex justify-between items-center">
                                <div className='p-2 bold'>Start Time</div>
                                <div className="flex justify-center items-center">
                                    <input onChange={(e) => {
                                        setGameOption((gameOption) => {
                                            return {
                                                ...gameOption,
                                                isFixedStartTime: e.target.checked
                                            }
                                        })
                                    }} checked={gameOption.isFixedStartTime} id="game-fullscreen" className="checkbox" type="checkbox" />
                                    <label className="ml-2 text-sm font-medium text-gray-900 " htmlFor="game-fullscreen"  >Fixed Time</label>
                                </div>
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
                                <button className='btn btn-secondary ml-2' onClick={getRandomTime}>Random</button>
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
                            <button disabled={!canControlGamePanel} className='btn bg-red txt-white mr-2 my-1' onClick={broadCastConfig}>Start</button>
                            <button disabled={!canControlGamePanel} className='btn bg-red txt-white mr-2 my-1' onClick={broadCastReplaySong}>Replay</button>
                            <button disabled={!canControlGamePanel} className='btn bg-red txt-white my-1' onClick={showAnswer}>Reveal</button>
                        </div>
                        <div className='flex my-5 items-center'>
                            <div className='flex-1'>
                                <button disabled={!canControlGamePanel} className='btn btn-secondary mr-2 my-1' onClick={testSong}>Test</button>
                                <button disabled={!canControlGamePanel} className='btn btn-secondary my-1' onClick={getNextSong}>Next</button>
                            </div>
                            <button className='btn btn-secondary' onClick={() => {
                                setIsShowVideo(!isShowVideo)
                            }}>{!isShowVideo ? "Show Video" : "Hide Video"}</button>
                        </div>
                    </div>
                }

            </div>
            <div className='relative inner inner-p20 inner-540'>
                <YouTube videoId="fR7e0N1UkRI" opts={{
                    height: '100%',
                    width: '100%',
                    playerVars: {
                        // https://developers.google.com/youtube/player_parameters
                        // playsinline: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        // start: gameOption.startTime,
                        // end: gameOption.startTime + gameOption.duration
                    },
                }} style={(isHost && isShowVideo) ? { opacity: 1, aspectRatio: 16 / 9 } : { opacity: 0, position: "absolute", top: -999 }}
                    onReady={youtubeVideoOnReady} onError={youtubeVideoOnError} onStateChange={(e) => {
                        console.log(e.data)
                        if (e.data == 5) {
                            console.log("finish buffer")
                            // youtubeRef.current?.target.playVideo()
                            if (shouldSendBufferedSignal) {
                                socket?.emit('finish-buffer-music', { roomID, playerID: socket.id });
                            } else {
                                setShouldSendBufferedSignal(true)
                                if (customYoutubeLink && customAnswer) {
                                    showMessage("Loaded custom video successfully")
                                }
                            }
                            if (shouldGetNewRandomStartTime) {
                                getRandomTime()
                                setShouldGetNewRandomStartTime(false)
                            }
                        }
                    }} />
            </div>
            <ToastContainer
            />
        </LayoutWrapper >
    );
};

export default GuessSongGame;
