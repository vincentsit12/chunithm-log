import axios from 'axios';
import LayoutWrapper from 'components/LayoutWrapper'
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import _, { isInteger, isString } from 'lodash'

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

            return <tr key={i} className=' even:bg-gray-300/[.6]' >
                {/* <td className='w-10'>{k.id}</td> */}
                <td >{k.roomID}</td>
                <td className='w-20'>{k.playerCount}</td>
                <td className='w-40 text-right' onClick={() => {
                    joinRoom(k.roomID)
                }}><button className='btn btn-secondary'>Join</button></td>
            </tr>
        })
    }
    return (
        <LayoutWrapper>
            <div className='inner inner-720 tc' >
                <div className='w-full my-5' >
                    <button onClick={() => {
                        let roomName = prompt("Please enter a room name")
                        if (roomName) {
                            createRoom(roomName)
                        }
                    }}
                        className='btn btn-secondary mb-10'>Create Room</button>

                    <div className='box box-shadow min-h-[500px] p-4'>
                        <table className='text-left'>
                            <thead>
                                <tr>
                                    {/* <th >id</th> */}
                                    <th >Name</th>
                                    <th className='w-20'>Players</th>
                                    <th className='w-40'></th>
                                </tr>
                            </thead>
                            <tbody>

                                {_renderTableRow()}
                            </tbody>
                        </table>

                    </div>
                </div>
            </div>

        </LayoutWrapper >
    )
}

export default GameRoomList

