import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { Difficulty, Rating, Song } from 'types'
import { getRatingList } from 'utils/api'
import _ from 'lodash'
import Users from 'db/model/users'
import Records from 'db/model/records'
import Songs from 'db/model/songs'
import { MdOutlineContentCopy } from 'react-icons/md'
import { calculateSingleSongRating, generateScript, toFixedTrunc } from 'utils/calculateRating'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LayoutWrapper from 'components/LayoutWrapper'
import classNames from 'classnames'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { log } from 'console'
import Slider from 'rc-slider';
import { ScoreCalculator } from 'components/ScoreCalculator'
import { decrypt } from 'utils/encrypt'

type SongProps = {
    record: Records[] | null
    song: Songs
};

type DifficultyInfo = {

}

const SongPage: NextPage<SongProps> = ({ record, song }) => {

    const [difficulty, setDifficulty] = useState<Difficulty>("master")

    const songData = song[difficulty] ?? {}

    const recordData = useMemo(() => {
        return _.find(record, (k) => k.difficulty === difficulty)
    }, [difficulty, record])

    // const calculateSSSRankMissCount = useCallback(
    //     () => {
    //         let toSSS = 1007500 - recordData?.score!
    //         let missCount = toSSS / (1007500 / songData.combo)
    //         return `${toSSS} (${Math.ceil(missCount)} miss)`
    //     },
    //     [difficulty, song]
    // )

    useEffect(() => {
        if (!song["master"]) {
            if (song["ultima"]) {
                setDifficulty('ultima')
            }
            else if (song["expert"]) {
                setDifficulty('expert')
            }
        }
    }, [])

    const { data: session, status } = useSession()
    return (
        <LayoutWrapper>
            <div className='inner inner-540 '>
                <div className='box box-shadow inner-p20'>
                    <h4 className='tc bold mb20'>{song.display_name}</h4>
                    <div className='flex justify-center w-full mb20' >
                        <div className="flex flex-wrap justify-center w-full">
                            {song.master &&
                                <div className='m-2'>
                                    <button onClick={() => {
                                        setDifficulty("master")
                                    }} className={`btn bg-master${difficulty != "master" ? "-20" : ""} p-3  `}>Master</button>
                                </div>
                            }
                            {song.expert &&
                                <div className='m-2'>
                                    <button onClick={() => {
                                        setDifficulty("expert")
                                    }} className={`btn bg-expert${difficulty != "expert" ? "-20" : ""} p-3  `}>Expert</button>
                                </div>}
                            {song.ultima &&
                                <div className='m-2'>
                                    <button onClick={() => {
                                        setDifficulty("ultima")
                                    }} className={`btn bg-ultima${difficulty != "ultima" ? "-20" : ""} p-3 `}>Ultima</button>
                                </div>
                            }
                        </div>
                    </div>
                    <div className='tc'>
                        <div >{`Rate : ${songData.rate}`}</div>
                        <div className='mb20'>{`Combo :  ${songData.combo}`}</div>
                        {session && recordData &&
                            <div className=''>
                                <div>
                                    {`Your score : ${recordData?.score}`}
                                </div>

                            </div>

                        }
                        <div className='divide-solid w-full  my-8 bg-slate-300 h-0.5'></div>
                        <ScoreCalculator rate={songData.rate} score={recordData?.score ?? 1010000} combo={songData.combo} haveScore={recordData?.score !== undefined} />
                    </div>
                </div>
            </div>

        </LayoutWrapper >
    )
}

export default SongPage

export async function getServerSideProps(context: NextPageContext) {

    context.res?.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=120')

    const songName = context.query.song

    let session = await getSession(context)
    let song = await Songs.findOne({ where: { display_name: songName } })

    if (!song) return {
        notFound: true,
    }
    let record: Records[] | null = null

    if (session) {
        record = await Records.findAll({
            where: { song_id: song.id, user_id: parseInt(decrypt(session.user.id.toString())) }, attributes: {
                exclude: ['user_id']
            }
        })
    }

    return {
        props: {
            // average
            song: JSON.parse(JSON.stringify(song)),
            record: JSON.parse(JSON.stringify(record))
        },
    }

}
