import LayoutWrapper from 'components/LayoutWrapper'
import { Game } from 'Games/Game'
import { isArray } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-modal';

type Props = {}
const defaultTimeLine = '["3", "2", "1", "0", "3", "4", "0", "6"], ["5", "0", "7", "8", "0", "2", "3", "4"], ["6", "7", "8", "0", "6", "5", "0", "3"], ["4", "7", "82", "1", "7", "82", "3", "4"], ["3", "2", "1", "0", "3", "4", "0", "6"], ["5", "0", "7", "8", "0", "2", "3", "4"], ["6", "7", "8", "0", "61", "5", "0", "38"], ["4", "7", "82", "18", "7", "82", "37", "48"], ["18", "0", "7", "0", "2", "0", "8", "1", "0", "1", "8", "0", "2", "0", "8", "0"], ["3", "0", "7", "0", "4", "0", "6", "3", "0", "3", "6", "0", "4", "0", "6", "0"], ["3", "0", "4", "0", "3", "0", "6", "3", "0", "3", "7", "0", "2", "0", "8", "0"], ["1", "0", "6", "0", "3", "0", "6", "2", "0", "2", "6", "0", "4", "0", "6", "0"], ["3", "0", "6", "0", "2", "0", "8", "1", "8", "1", "8", "0", "3", "0", "1", "0"], ["4", "0", "6", "0", "3", "0", "5", "2", "0", "2", "6", "0", "1", "0", "7", "0"], ["2", "0", "6", "0", "8", "0", "6", "1", "6", "1", "6", "0", "5", "0", "3", "0"], ["4", "0", "3", "0", "6", "0", "2", "5", "0", "5", "1", "0", "7", "8", "1", "2"], ["8", "0", "7", "0", "2", "0", "6", "1", "0", "1", "5", "0", "8", "0", "4", "0"], ["1", "0", "6", "0", "2", "0", "5", "1", "6", "1", "5", "0", "1", "5", "1", "7"], ["18", "0", "6", "0", "3", "0", "6", "2", "0", "2", "7", "0", "8", "0", "6", "0"], ["1", "0", "5", "0", "2", "0", "5", "3", "4", "3", "5", "0", "4", "5", "6", "7"], ["68", "0", "2", "0", "8", "0", "2", "7", "0", "7", "3", "0", "6", "0", "4", "0"], ["6", "0", "2", "0", "7", "0", "1", "8", "2", "7", "3", "0", "5", "4", "6", "4"], ["53", "0", "7", "0", "2", "0", "6", "8", "0", "8", "5", "0", "2", "0", "8", "0"], ["3", "0", "6", "0", "4", "0", "5", "4", "6", "3", "7", "0", "2", "3", "4", "5"], ["67", "0", "5", "0", "7", "0", "6", "5", "6", "5", "6", "0", "5", "0", "3", "0"], ["1", "0", "3", "0", "5", "0", "4", "6", "4", "6", "4", "0", "3", "5", "3", "5"], ["36", "0", "7", "0", "1", "0", "6", "5", "6", "5", "6", "0", "5", "0", "7", "0"], ["4", "0", "1", "0", "3", "0", "4", "5", "4", "5", "4", "0", "7", "8", "1", "2"], ["13", "0", "5", "0", "7", "0", "6", "5", "6", "5", "4", "0", "5", "0", "3", "0"], ["1", "0", "3", "0", "5", "0", "6", "5", "6", "5", "4", "0", "3", "5", "3", "5"], ["36", "0", "7", "0", "1", "0", "6", "5", "6", "5", "4", "0", "5", "0", "7", "0"], ["4", "0", "1", "0", "3", "0", "4", "5", "4", "5", "6", "0", "6", "7", "8", "1"], ["2", "1", "2", "1", "2", "0", "7", "8", "7", "8", "7", "0", "1", "8", "1", "0"], ["6", "5", "6", "5", "6", "0", "3", "4", "3", "4", "3", "0", "5", "4", "5", "0"], ["4", "5", "4", "5", "4", "0", "5", "4", "5", "4", "5", "0", "3", "6", "3", "0"], ["7", "2", "7", "2", "7", "0", "2", "7", "2", "7", "2", "0", "8", "1", "8", "0"], ["2", "1", "2", "1", "2", "0", "7", "8", "7", "8", "7", "0", "1", "8", "1", "8"], ["3", "4", "3", "4", "3", "0", "6", "5", "6", "5", "6", "0", "4", "5", "4", "5"], ["3", "6", "3", "6", "3", "0", "7", "2", "7", "2", "7", "0", "1", "8", "1", "8"], ["3", "4", "3", "2", "3", "0", "5", "4", "5", "6", "5", "0", "6", "7", "8", "1"], ["28", "7", "3", "0", "6", "0", "4", "5", "3", "0", "8", "0", "2", "7", "3", "8"], ["2", "7", "2", "0", "8", "0", "1", "7", "8", "0", "3", "0", "7", "2", "6", "3"], ["54", "6", "4", "0", "7", "0", "4", "5", "3", "0", "7", "0", "5", "6", "4", "7"], ["3", "5", "4", "0", "7", "0", "5", "6", "3", "0", "7", "0", "6", "7", "8", "1"], ["27", "8", "1", "0", "8", "0", "2", "7", "3", "0", "6", "0", "5", "4", "6", "5"], ["7", "5", "6", "0", "1", "0", "8", "1", "7", "0", "2", "0", "6", "3", "5", "4"], ["53", "6", "4", "0", "7", "0", "1", "8", "2", "0", "6", "0", "1", "8", "1", "6"], ["1", "4", "2", "0", "6", "0", "3", "0", "5", "4", "5", "0", "4", "5", "6", "7"], ["8", "1", "8", "1", "8", "0", "72", "27", "18", "0", "0", "0", "8", "0", "0", "0"], ["2", "7", "1", "0", "8", "2", "8", "2", "7", "3", "7", "0", "4", "5", "3", "6"], ["7", "4", "8", "0", "2", "1", "2", "1", "3", "4", "3", "0", "6", "5", "7", "4"], ["6", "5", "6", "0", "4", "5", "4", "5", "3", "6", "3", "0", "6", "3", "7", "2"], ["8", "1", "8", "1", "7", "2", "7", "2", "6", "3", "6", "3", "5", "4", "5", "4"], ["6", "3", "7", "2", "8", "1", "7", "2", "8", "1", "7", "2", "8", "1", "7", "2"], ["6", "3", "5", "4", "5", "3", "6", "2", "5", "1", "6", "2", "7", "3", "8", "4"], ["7", "3", "6", "2", "5", "1", "4", "8", "37", "48", "51", "62", "37", "84", "15", "26"]'

const SimpleMaimai = (props: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const game = useRef<Game>()
    const [isGameStarted, setIsGameStarted] = useState(false)
    const [timelineString, setTimelineString] = useState<string>(defaultTimeLine)
    const [BPM, setBPM] = useState("180")
    const [speed, setSpeed] = useState<string>("8")
    const [modalIsOpen, setModalIsOpen] = useState(false)
    useEffect(() => {
        let listener = window.addEventListener('keydown', (e) => game.current?.onKeyboard(e))

        return listener
    }, [])
    const customStyles = {}
    const initGame = () => {
        try {

            if (canvasRef.current) {
                if (isNaN(parseInt(speed)) || isNaN(parseInt(BPM))) {
                    throw ''
                }
                const music = new Audio('/fragrance.mp3')
                const timeline = converTimelineToString(JSON.parse("[" + timelineString + "]"))
                const vmin = Math.min(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
                const config: GameConfig = {
                    RMG_CENTERLINE_RADIUS: vmin * .4,
                    RMG_OBJECT_RADIUS: vmin * .4 * .1,
                    BPM: parseInt(BPM),
                    SPEED: parseInt(speed),
                    DURATION: 4000 / parseInt(speed),
                }
                game.current = new Game(canvasRef.current, 'maimai', music, timeline, config)
                // // // // console.log("🚀 ~ file: maimai-simple.tsx ~ line 24 ~ useEffect ~ game", game)
            }
        } catch (e) {
            alert('invalid timeline/setting!')
        }
    }
    const converTimelineToString = (timeline: (string | number | number[] | string[])[]) => {
        timeline = timeline
        return timeline.map(k => {
            if (isArray(k)) {
                k = k.map(k => k.toString())
            }
            else k = k.toString()
            return k
        })
    }
    return (
        <LayoutWrapper>
            <div className='flex w-full justify-center mb20' >
                <button onClick={() => {
                    setModalIsOpen(true)
                    // if (game.current?.isStarted) {
                    //     game.current?.reset()
                    // }
                    // initGame()
                    // game.current?.startGame()

                }} className='btn btn-secondary mx-5'>Start Game</button>
                <button onClick={() => {
                    game.current?.reset()
                    // game.current = null
                }} className='btn btn-secondary mx-5'>Reset Game</button>
            </div>

            <div className='inner inner-720'>
                <textarea value={timelineString} onChange={(e) => {
                    setTimelineString(e.target.value)
                }} className='px-4 py-2 box box-shadow mb20 w-full h-40' placeholder='notes'></textarea>
                <input value={BPM} onChange={(e) => {
                    setBPM(e.target.value)
                }} className='px-4 py-2 box box-shadow mb20 w-full' placeholder='bpm'></input>
                <input value={speed} onChange={(e) => {
                    setSpeed(e.target.value)

                }} className='px-4 py-2 box box-shadow mb20 w-full' placeholder='speed'></input>
                <Modal
                    isOpen={modalIsOpen}
                    // onAfterOpen={afterOpenModal}
                    // onRequestClose={closeModal}
                    ariaHideApp={false}
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        },
                        content: {
                            top: '50%',
                            left: '50%',
                            right: 'auto',
                            bottom: 'auto',
                            marginRight: '-50%',
                            padding: '.5rem',
                            transform: 'translate(-50%, -50%)',
                        },
                    }}
                // contentLabel="Example Modal"
                >
                    <div style={{ height: '30rem' , width : '80vw'}} className='bg-black m-auto mb10' >
                        <canvas
                            onTouchStart={e => game.current?.ontouchstart(e)}
                            onTouchMove={e => game.current?.ontouchmove(e)}
                            onTouchEnd={e => game.current?.ontouchend(e)}
                            className='w-full h-full' ref={canvasRef}></canvas>
                    </div>
                    <div className='flex w-full justify-center'>
                        <button onClick={() => {

                            if (game.current?.isStarted) {
                                game.current?.reset()
                            }
                            initGame()
                            game.current?.startGame()

                        }} className='btn btn-secondary mx-5'>Start Game</button>
                        <button onClick={() => {
                            game.current?.reset()
                            setModalIsOpen(false)
                            // game.current = null
                        }} className='btn btn-secondary mx-5'>Close Game</button>
                    </div>
                </Modal>

            </div>
        </LayoutWrapper >
    )
}

export default SimpleMaimai

