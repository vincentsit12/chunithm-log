import axios from 'axios';
import LayoutWrapper from 'components/LayoutWrapper'
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import _, { isInteger, isString } from 'lodash'
import { MdMusicNote, MdGames } from 'react-icons/md'
import Head from 'next/head';

interface Room {
    roomID: string,
    playerCount: number
}

const GameRoomList = () => {
    const [roomList, setRoomList] = useState<Room[]>([])
    const router = useRouter()

    useEffect(() => {
        getRoomList()
    }, [])

    const getRoomList = async () => {
        let res = await axios.get<Room[]>("/api/game/rooms")
        setRoomList(res.data)
    }

    const joinRoom = async (roomID: string) => {
        let res = await axios.get<Room[]>("/api/game/rooms")
        if (res.data.findIndex(k => k.roomID == roomID) > -1) {
            router.push(`./rooms/${roomID}`)
        }
        else {
            alert("This room has been deleted!")
            setRoomList(res.data)
        }
    }

    const createRoom = async (roomID: string) => {
        let res = await axios.get<Room[]>("/api/game/rooms")
        if (res.data.findIndex(k => k.roomID == roomID) > -1) {
            alert("This room has been created!")
            setRoomList(res.data)
        }
        else {
            router.push(`./rooms/${roomID}`)
        }
    }

    const _renderTableRow = () => {
        return _.map(roomList, (k, i) => {

            return <tr key={i} className='even:bg-gray-700/20 transition-colors duration-200' >
                {/* <td className='w-10'>{k.id}</td> */}
                <td className='text-white font-medium'>{k.roomID}</td>
                <td className='w-20 text-gray-300'>{k.playerCount}</td>
                <td className='w-40 text-right' onClick={() => {
                    joinRoom(k.roomID)
                }}><button className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'>Join</button></td>
            </tr>
        })
    }
    return (

        <div className='min-h-screen' style={{
            background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)'
        }}>
            <Head>
                <title>Song Guesser</title>
            </Head>
            <div className='inner inner-720 tc py-8' >
                <div className='w-full my-8' >
                    {/* Header */}
                    <div className='mb-12'>
                        <div className='flex items-center justify-center mb-6'>
                            <div className='bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-2xl shadow-lg'>
                                <MdMusicNote className='w-8 h-8 text-white' />
                            </div>
                            <h1 className='text-4xl font-bold text-white ml-4 tracking-wide'>Song Guesser</h1>
                        </div>
                    </div>

                    <button onClick={() => {
                        let roomName = prompt("Please enter a room name")
                        if (roomName) {
                            createRoom(roomName)
                        }
                    }}
                        className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-semibold text-lg mb-8 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'>
                        Create Room
                    </button>

                    <div className='guess-song-game-box overflow-hidden'>
                        <div className='min-h-[500px] p-6'>
                            <table className='text-left w-full'>
                                <thead>
                                    <tr className='border-b border-gray-600/30'>
                                        {/* <th >id</th> */}
                                        <th className='text-purple-300 font-semibold text-lg pb-4'>Room Name</th>
                                        <th className='w-20 text-purple-300 font-semibold text-lg pb-4'>Players</th>
                                        <th className='w-40 text-purple-300 font-semibold text-lg pb-4'></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roomList.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className='text-center py-12'>
                                                <div className='text-gray-400 text-lg'>
                                                    <div className='mb-4'>
                                                        <MdGames className='w-16 h-16 mx-auto text-gray-500 mb-4' />
                                                    </div>
                                                    No rooms available
                                                    <p className='text-sm text-gray-500 mt-2'>Create a room to get started!</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        _renderTableRow()
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default GameRoomList

