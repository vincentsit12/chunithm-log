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


function useSocketClient() {
    const [state, setState] = useState(false)
    const socket = useRef<Socket>()
    useEffect(() => {
        fetch('/api/socket').
            catch(e => { console.log(e) }).
            finally(() => {
                socket.current = io({
                    query: {
                        roomID: 123
                    }
                })

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

    const [gameOption, setGameOption] = useState<GuessSongGameOption>()

    const [isHost, setIsHost] = useState(false)

    useEffect(() => {
        // Listen for incoming messages
        socket?.on('message', (message) => {
            console.log(message)
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        socket?.on('buffer-music', (gameOption: GuessSongGameOption) => {
            console.log('buffer-music', gameOption)
            setGameOption((x) => { return { ...x, ...gameOption } })

            youtubeRef.current?.target.cueVideoById({
                'videoId': gameOption.youtubeID,
                'startSeconds': gameOption.startTime,
                'endSeconds': gameOption.startTime + gameOption?.duration
            })
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
                console.log(isHost)
                if (isHost) {
                    setIsHost(true)
                    getSongList()
                }
            });
        }

        socket?.on('play-music', (message) => {
            startSong()
        });

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
        return () => {
            socket?.removeListener('replay-music')
        };

    }, [gameOption])

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

    const nextSong = async () => {
        let song = _.sampleSize<Songs>(songList, 1)[0]
        console.log(song)
        setCurrentSong(song)

        let url = `/api/songs/getYoutubeID?id=${song.id}`
        let youtubeAPIResult = await axios.get(url)
        console.log(youtubeAPIResult)
        let gameOption: GuessSongGameOption = {
            youtubeID: youtubeAPIResult.data,
            startTime: 90,
            duration: 2,
        }

        socket?.emit('load-music', { roomID }, gameOption);

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

    const replaySong = () => {
        console.log("replay", gameOption?.startTime)
        youtubeRef.current?.target.seekTo(gameOption?.startTime, true)
    }

    const startSong = () => {
        console.log("start")
        // youtubeRef.current?.target.seekTo(gameOption?.startTime, true)
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

    return (
        <LayoutWrapper>
            <div className='inner inner-720'>
                {/* Display the messages */}
                {messages.map((message, index) => (
                    <p key={index}>{message}</p>
                ))}

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
                        autoFocus
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
                    <div className='flex my-10'>
                        <button className='btn btn-secondary mr-2' onClick={nextSong}>Next Song</button>
                        <button className='btn btn-secondary' onClick={broadCastReplaySong}>Replay Song</button>
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
                }} style={{ display: isHost ? "block" : "none" }}
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