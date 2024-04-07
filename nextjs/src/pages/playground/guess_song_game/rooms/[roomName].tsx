import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Socket, io } from "socket.io-client"
import _, { uniqBy, values } from 'lodash'
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import Songs, { MaimaiSongs } from 'db/model/songs';
import { GuessSongGameOption } from '../../../api/socket';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import LayoutWrapper from 'components/LayoutWrapper';
import { useRouter } from 'next/router';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ListBox from 'components/ListBox';
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

type GuessGameSong = Songs | MaimaiSongs
const generateLevel = () => {
    let x = []
    for (let i = 15.4; i >= 13.0; i -= 0.1) {
        let key = (i + 0.00001).toFixed(1)
        x.push({ "name": `${key}`, "value": parseFloat(key) })
    }
    return x
}
const getIndexLevel = () => {
    let x = []
    for (let i = 15.4; i >= 13.0; i -= 0.1) {
        let key = (i + 0.00001).toFixed(1)
        x.push({ "name": `${key}`, "value": parseFloat(key) })
    }
    return x
}
const guessSongGameType: {
    name: string,
    value: GuessSongGameType
}[] = [{ "name": "chunithm", "value": GuessSongGameType.chunithm }, { "name": "maimai", "value": GuessSongGameType.maimai }]

const level = generateLevel()
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

    const [gameOption, setGameOption] = useState<GuessSongGameOption>({
        youtubeID: "Mru-JAtqagE",
        startTime: 90,
        duration: 2,
        isCustom: false
    })

    const [customYoutubeLink, setCustomYoutubeLink] = useState<string>()
    const [customAnswer, setCustomAnswer] = useState<string>()


    const [isHost, setIsHost] = useState(false)

    const [isJoined, setIsJoined] = useState(false)

    const [shouldSendBufferedSignal, setShouldSendBufferedSignal] = useState(true)

    const [isShowVideo, setIsShowVideo] = useState(true)

    const chatBoxRef = useRef<HTMLDivElement>(null)

    const answerBoxRef = useRef<HTMLInputElement>(null)

    const [selectedGameType, setSelectedGameType] = useState(guessSongGameType[0])

    const [lowerLevelRange, setLowerLevelRange] = useState<{ name: string; value: number }>(level.find(k => k.value == chunithmDefaulLevelRange[0])!)
    const [upperLevelRange, setUpperLevelRange] = useState<{ name: string; value: number }>(level.find(k => k.value == chunithmDefaulLevelRange[1])!)

    useEffect(() => {
        // Listen for incoming messages
        socket?.on('message', (message, withNotification: boolean) => {
            setMessages((prevMessages) => [...prevMessages, message]);
            if (withNotification) {
                showMessage(message)
            }
        });


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
        setSongList([])
        if (selectedGameType.value == GuessSongGameType.chunithm) {
            setLowerLevelRange(level.find(k => k.value == chunithmDefaulLevelRange[0])!)
            setUpperLevelRange(level.find(k => k.value == chunithmDefaulLevelRange[1])!)
            getSongList()
        } else if (selectedGameType.value == GuessSongGameType.maimai) {
            setLowerLevelRange(level.find(k => k.value == maimaiDefaulLevelRange[0])!)
            setUpperLevelRange(level.find(k => k.value == maimaiDefaulLevelRange[1])!)
            getMaimaiSongList()
        }
    }, [selectedGameType])

    useEffect(() => {
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
            setTimeout(() => {
                playSong()
            }, 1000)

        });

        return () => {
            socket?.removeListener('play-music')
            socket?.removeListener('replay-music')
        };

    }, [gameOption, state])

    useEffect(() => {
        socket?.on('buffer-music', (gameOption: GuessSongGameOption) => {
            if (!isHost) {
                console.log('buffer-music', gameOption)
                setGameOption((x) => { return { ...x, ...gameOption } })
            }
            youtubeRef.current?.target.cueVideoById({
                'videoId': gameOption.youtubeID,
                'startSeconds': gameOption.startTime,
                'endSeconds': gameOption.startTime + gameOption.duration
            })
        });

        return () => {
            socket?.removeListener('buffer-music')
        };
    }, [isHost, state])

    useEffect(() => {
        chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight })
    }, [messages])

    const showMessage = (message: string, isError: boolean = false) => {
        if (isError) {
            toast.error(message, {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored',
                className: "",
            })
        } else {
            toast.info(message, {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored',
                className: "",
            })
        }
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
        let result = await axios.get<MaimaiSongs[]>("/api/songs/getMaimaiSongList")
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
        let url = selectedGameType.value == GuessSongGameType.chunithm ? `/api/songs/getYoutubeID?type=chunithm&id=${song.id}` : `/api/songs/getYoutubeID?type=maimai&id=${song.display_name}`
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
                    'startSeconds': gameOption.startTime,
                    'endSeconds': gameOption.startTime + gameOption.duration
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
            socket?.emit('load-music', { roomID }, gameOption, customAnswer);
        } else {
            socket?.emit('load-music', { roomID }, gameOption, currentSong?.display_name);
        }
    }

    const testSong = () => {
        youtubeRef.current?.target.loadVideoById({
            'videoId': gameOption.youtubeID,
            'startSeconds': gameOption.startTime,
            'endSeconds': gameOption.startTime + gameOption.duration
        })
        // youtubeRef.current?.target.seekTo(gameOption?.startTime, true)
        youtubeRef.current?.target.playVideo()
        // setTimeout(() => {
        //     youtubeRef.current?.target.pauseVideo()
        // }, gameOption.duration * 1000)
    }

    const replaySong = () => {
        console.log("replay", gameOption?.startTime)
        youtubeRef.current?.target.seekTo(gameOption?.startTime, true)
    }

    const playSong = () => {
        console.log("start play music", gameOption)
        youtubeRef.current?.target.seekTo(gameOption?.startTime, true)
        youtubeRef.current?.target.playVideo()
    }


    const joinGame = () => {
        console.log("join-game")
        // youtubeRef.current?.target.seekTo(gameOption?.startTime, true)

        socket?.emit('join-game', { roomID, playerID: socket.id }, () => { });
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


        socket?.emit('send-anwser', { roomID, playerID: socket.id }, answer);

        setAnswer("")
    }

    const getRandomTime = () => {
        setGameOption((gameOption) => {
            return {
                ...gameOption,
                startTime: Math.max(0, _.random(parseInt(youtubeRef.current?.target.getDuration())) - gameOption.duration)
            }
        })
        // socket?.emit('send-anwser', { roomID, playerID: socket.id }, () => { });
    }

    return (
        <LayoutWrapper>
            <div className='inner inner-720 min-h-[700px]'>
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
                    <div className='flex my-5'>
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
                                fontSize: 'inherit'
                            }}
                            className='flex-1 auto-search'
                        />
                        <button className='btn btn-secondary ml-2' onClick={sendAnswer}>Answer</button>
                    </div></>}
                {/* <div className='my-10'>
                <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                />
            </div> */}
                {!isJoined && <button className='btn btn-secondary my-5' onClick={joinGame}>Join</button>}
                {isHost &&
                    <div>
                        <h1 className='tc mb-5'>Host</h1>
                        <div className="flex items-center justify-between px-5">
                            <div className=''>
                                <div className='ml-2 mb-2'>Game Type: </div>
                                <ListBox className="w-[7rem]" source={guessSongGameType} selected={selectedGameType} setSelected={setSelectedGameType} />
                            </div>
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
                            </div>
                        </div>
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
                                        'startSeconds': gameOption.startTime,
                                        'endSeconds': gameOption.startTime + gameOption.duration
                                    })
                                } else {
                                    alert("Please input both youtube link and answer!")
                                }
                            }
                            }>Load</button>
                        </div>
                        <div className='mt-5'>
                            <div className='p-2 bold'>Start Time</div>
                            <div className='flex '>
                                <input value={gameOption.startTime} onChange={(e) => setGameOption((gameOption) => {
                                    return {
                                        ...gameOption,
                                        startTime: isNaN(Number(e.target.value)) ? 1 : Number(e.target.value)
                                    }
                                })}
                                    className='px-4 py-2 box box-shadow w-full' placeholder='Start Time'></input>
                                <button className='btn btn-secondary ml-2' onClick={getRandomTime}>Random</button>
                            </div>
                        </div>
                        <div className='mb-5'>
                            <div className='p-2 bold'>Duration</div>
                            <div className='flex'>
                                <input value={gameOption.duration} onChange={(e) => setGameOption((gameOption) => {
                                    return {
                                        ...gameOption,
                                        duration: isNaN(Number(e.target.value)) ? 1 : Number(e.target.value)
                                    }
                                })}
                                    className='px-4 py-2 box box-shadow w-full' placeholder='Duration'></input>
                            </div>
                        </div>
                        <div className='flex my-5'>
                            <button disabled={filteredSongList.length <= 0} className='btn bg-red txt-white mr-2 ' onClick={broadCastConfig}>Start</button>
                            <button disabled={filteredSongList.length <= 0} className='btn bg-red txt-white' onClick={broadCastReplaySong}>Replay</button>
                        </div>
                        <div className='flex my-5'>
                            <div className='flex-1'>
                                <button disabled={filteredSongList.length <= 0} className='btn btn-secondary mr-2 ' onClick={testSong}>Test</button>
                                <button disabled={filteredSongList.length <= 0} className='btn btn-secondary' onClick={getNextSong}>Next</button>
                            </div>
                            <button className='btn btn-secondary' onClick={() => {
                                setIsShowVideo(!isShowVideo)
                            }}>{!isShowVideo ? "Show Video" : "Hide Video"}</button>
                        </div>
                    </div>
                }
                <YouTube videoId="Mru-JAtqagE" opts={{
                    height: '320',
                    width: '320',
                    playerVars: {
                        // https://developers.google.com/youtube/player_parameters
                        // playsinline: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        // start: gameOption.startTime,
                        // end: gameOption.startTime + gameOption.duration
                    },
                }} style={(isHost && isShowVideo) ? { opacity: 1 } : { opacity: 0, position: "absolute", top: -999 }}
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
                        }
                    }} />
            </div>
            <ToastContainer
            />
        </LayoutWrapper >
    );
};

export default GuessSongGame;
