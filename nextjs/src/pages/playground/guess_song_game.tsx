import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket, io } from "socket.io-client"
import _, { uniqBy } from 'lodash'
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import Songs from 'db/model/songs';
import { GuessSongGameOption } from '../api/socket';
import { useSearchParams } from 'next/navigation';
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import LayoutWrapper from 'components/LayoutWrapper';
import { useRouter } from 'next/router';


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
                    console.log(socketRef.id);
                    setState(true)
                })

                socket.current.on("disconnect", () => {
                    console.log("Disconnected")
                })
                // socket.current.on("connect_error", async err => {
                //     console.log(`connect_error due to ${err.message}`)
                //     await fetch("/api/socket")
                // })
            })
    }, [])


    return { socket: socket.current, state }
}

const GuessSongGame = () => {
    const roomID = useSearchParams().get("room") ?? "test"
    // State to store the messages
    const [messages, setMessages] = useState<string[]>([]);
    // State to store the current message
    const [currentMessage, setCurrentMessage] = useState('');

    const { socket, state } = useSocketClient();

    const { data: session, status } = useSession()

    const [answer, setAnswer] = useState<Songs>();

    const [currentSong, setCurrentSong] = useState<Songs>()

    const [songList, setSongList] = useState<Songs[]>([])

    const youtubeRef = useRef<YouTubeEvent>()

    const router = useRouter()

    const [gameOption, setGameOption] = useState<GuessSongGameOption>({
        youtubeID: "Mru-JAtqagE",
        startTime: 90,
        duration: 2,
    })

    const [isHost, setIsHost] = useState(false)

    useEffect(() => {
        // Listen for incoming messages
        socket?.on('message', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        socket?.on("reconnect", () => {
            socket.emit('create-room', { roomID }, (isHost: boolean) => {
                console.log(isHost)
                if (isHost) {
                    setIsHost(true)
                    getSongList()
                }
            });
        });
        if (socket) {
            socket.emit('create-room', { roomID }, (isHost: boolean) => {
                if (isHost) {
                    setIsHost(true)
                    getSongList()
                }
            });
        }

        socket?.on('delete-room', (message) => {
            alert("room deleted")
        });


        // Clean up the socket connection on unmount
        return () => {
            console.log("clean")
            socket?.disconnect();
        };
    }, [state]);

    useEffect(() => {
        socket?.on('replay-music', (message) => {
            console.log('replay-music', gameOption)
            replaySong()
        });

        socket?.on('play-music', (message) => {
            playSong()
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
                youtubeRef.current?.target.cueVideoById({
                    'videoId': gameOption.youtubeID,
                    'startSeconds': gameOption.startTime,
                    'endSeconds': gameOption.startTime + gameOption.duration
                })
            }
        });

        return () => {
            socket?.removeListener('buffer-music')
        };
    }, [isHost, state])

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

    const getNextSong = async () => {
        let song = _.sampleSize<Songs>(songList, 1)[0]
        console.log(song)
        setCurrentSong(song)

        let url = `/api/songs/getYoutubeID?id=${song.id}`
        let youtubeAPIResult = await axios.get(url)
        console.log(youtubeAPIResult)
        if (isHost) {
            youtubeRef.current?.target.cueVideoById({
                'videoId': youtubeAPIResult.data,
                'startSeconds': gameOption.startTime,
                'endSeconds': gameOption.startTime + gameOption.duration
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
        youtubeRef.current = undefined;
    }

    const broadCastReplaySong = () => {
        socket?.emit('replay-music', { roomID });
    }

    const broadCastConfig = () => {
        youtubeRef.current?.target.cueVideoById({
            'videoId': gameOption.youtubeID,
            'startSeconds': gameOption.startTime,
            'endSeconds': gameOption.startTime + gameOption.duration
        })
        socket?.emit('load-music', { roomID }, gameOption);
    }

    const testSong = () => {
       
        youtubeRef.current?.target.seekTo(gameOption?.startTime, true)
        youtubeRef.current?.target.playVideo()
        setTimeout(() => {
            youtubeRef.current?.target.pauseVideo()
        }, gameOption.duration * 1000)
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
    }

    const handleOnSelect = (result: Songs) => {
        setAnswer(result)
    }

    const sendAnswer = (result: Songs) => {
        socket?.emit('send-anwser', { roomID, playerID: socket.id }, () => { });
    }

    const getRandomTime = () => {
        setGameOption((gameOption) => {
            return {
                ...gameOption,
                startTime: Math.max(0, _.random(Number(youtubeRef.current?.target.getDuration())) - gameOption.duration)
            }
        })
        // socket?.emit('send-anwser', { roomID, playerID: socket.id }, () => { });
    }

    return (
        <LayoutWrapper>
            <div className='inner inner-720'>
                {/* Display the messages */}
                <div className="box box-shadow p-2 h-[300px] overflow-y-scroll">
                    {messages.map((message, index) => (
                        <p key={index}>{message}</p>
                    ))}
                </div>

                {/* Input field for sending new messages */}
                <div className='flex my-5'>
                    <input value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)}
                        className='px-4 py-2 box box-shadow w-full' placeholder='Chat'></input>
                    <button className='btn btn-secondary ml-2' onClick={sendMessage}>Send</button>
                </div>
                {/* Button to submit the new message */}
                {/* <button className='btn btn-secondary' onClick={() => {
                youtubeRef.current?.target.playVideo()
            }}>Send</button> */}


                <div className='flex my-5'>
                    <ReactSearchAutocomplete
                        items={songList}
                        // onSearch={handleOnSearch}
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
                    <button className='btn btn-secondary ml-2' onClick={joinGame}>Answer</button>
                </div>
                {/* <div className='my-10'>
                <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                />
            </div> */}
                <button className='btn btn-secondary' onClick={joinGame}>Join</button>
                {isHost &&
                    <div>
                        <h1 className='tc'>Host</h1>
                        <div className='flex my-5'>
                            <input value={gameOption.startTime} onChange={(e) => setGameOption((gameOption) => {
                                return {
                                    ...gameOption,
                                    startTime: Number(e.target.value)
                                }
                            })}
                                className='px-4 py-2 box box-shadow w-full' placeholder='Start Time'></input>
                            <button className='btn btn-secondary ml-2' onClick={getRandomTime}>Random</button>
                        </div>
                        <div className='flex my-5'>
                            <input value={gameOption.duration} onChange={(e) => setGameOption((gameOption) => {
                                return {
                                    ...gameOption,
                                    duration: Number(e.target.value)
                                }
                            })}
                                className='px-4 py-2 box box-shadow w-full' placeholder='Duration'></input>

                        </div>
                        <div className='flex my-5'>
                            <button disabled={songList.length <= 0} className='btn bg-red txt-white mr-2 ' onClick={broadCastConfig}>Start Song</button>
                            <button disabled={songList.length <= 0} className='btn bg-red txt-white' onClick={broadCastReplaySong}>Replay Song</button>
                        </div>
                        <div className='flex my-5'>
                            <button disabled={songList.length <= 0} className='btn btn-secondary mr-2 ' onClick={testSong}>Test Song</button>
                            <button disabled={songList.length <= 0} className='btn btn-secondary mr-2' onClick={getNextSong}>Next Song</button>
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
                }} style={{ display: isHost ? "block" : "block" }}
                    onReady={youtubeVideoOnReady} onError={youtubeVideoOnError} onStateChange={(e) => {
                        console.log(e.data)
                        if (e.data == 5) {
                            // youtubeRef.current?.target.playVideo()
                            socket?.emit('finish-buffer-music', { roomID, playerID: socket.id });
                        }
                    }} />
            </div>
        </LayoutWrapper>
    );
};

export default GuessSongGame;