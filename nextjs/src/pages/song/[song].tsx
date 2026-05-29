import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { Difficulty, Rating, Song } from 'types'
import _ from 'lodash'
import Users from 'db/model/users'
import Records from 'db/model/records'
import Songs from 'db/model/songs'
import LayoutWrapper from 'components/LayoutWrapper'
import classNames from 'classnames'
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import { log } from 'console'
import Slider from 'rc-slider';
import { ScoreCalculator } from 'components/ScoreCalculator'
import { decrypt } from 'utils/encrypt'
import { BiLogoYoutube } from "react-icons/bi";
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'

const difficultyButtonStyles: Record<Difficulty, { active: NonNullable<ComponentProps<typeof Button>['variant']>; idle: NonNullable<ComponentProps<typeof Button>['variant']> }> = {
    master: {
        active: 'danger',
        idle: 'secondary',
    },
    expert: {
        active: 'warning',
        idle: 'secondary',
    },
    ultima: {
        active: 'violet',
        idle: 'secondary',
    },
}

type SongProps = {
    record: Records[] | null
    song: Songs
};

const SongPage: NextPage<SongProps> = ({ record, song }) => {

    const [difficulty, setDifficulty] = useState<Difficulty>("master")

    const songData = song[difficulty]

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

    const getGenreString = () => {
        switch (song.genre) {
            case 'ORI':
                return 'ORIGINAL'
            case 'P&A':
                return 'POPS & ANIME'
            case 'VAR':
                return 'VARIETY'
            case 'nico':
                return 'niconico'
            case 'イロ':
                return 'イロドリミドリ'
            case '撃舞':
                return 'ゲキマイ'
            case '東方':
                return '東方Project'
        }
    }

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
            <div className='mx-auto w-full max-w-2xl'>
                <Surface className='px-6 py-6 text-center sm:px-8'>
                    <h4 className='mb-2 text-3xl font-bold text-white'>{song.display_name}</h4>
                    <h5 className='mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300'>{getGenreString()}</h5>
                    <div className='mb-6 flex w-full justify-center' >
                        <div className="flex flex-wrap justify-center w-full">
                            {song.master &&
                                <div className='m-2'>
                                    <Button onClick={() => {
                                        setDifficulty("master")
                                    }} className='min-w-[8rem]' size='sm' variant={difficulty == 'master' ? difficultyButtonStyles.master.active : difficultyButtonStyles.master.idle}>Master</Button>
                                </div>
                            }
                            {song.expert &&
                                <div className='m-2'>
                                    <Button onClick={() => {
                                        setDifficulty("expert")
                                    }} className='min-w-[8rem]' size='sm' variant={difficulty == 'expert' ? difficultyButtonStyles.expert.active : difficultyButtonStyles.expert.idle}>Expert</Button>
                                </div>}
                            {song.ultima &&
                                <div className='m-2'>
                                    <Button onClick={() => {
                                        setDifficulty("ultima")
                                    }} className='min-w-[8rem]' size='sm' variant={difficulty == 'ultima' ? difficultyButtonStyles.ultima.active : difficultyButtonStyles.ultima.idle}>Ultima</Button>
                                </div>
                            }
                        </div>
                    </div>
                    {songData && <div>
                        <div className='text-lg font-semibold text-white'>{`Rate : ${songData.rate}`}</div>
                        <div className='mb-6 text-sm text-slate-300'>{`Combo :  ${songData.combo}`}</div>
                        {session && recordData &&
                            <div className='mb-2'>
                                <div>
                                    {`Your score : ${recordData?.score}`}
                                </div>

                            </div>

                        }
                        <div className="flex flex-wrap justify-center w-full">
                            <div className='m-2'>
                                <Button disabled={song[difficulty]?.scriptUrl == undefined} onClick={() => {
                                    window.open(song[difficulty]?.scriptUrl)
                                }} variant='secondary' className='min-w-[8rem]'>譜面</Button>
                            </div>

                            <div className='m-2'>
                                <Button onClick={() => {
                                    window.open(`https://www.youtube.com/results?search_query=${song.display_name}+${difficulty}+chunithm`)
                                }} variant='secondary' className='min-w-[8rem]'><BiLogoYoutube className='mr-1' size={"1.25rem"} />YouTube</Button>
                            </div>
                        </div>
                        <div className='divide-solid w-full  my-8 bg-slate-300 h-0.5'></div>
                        <ScoreCalculator rate={songData.rate} score={recordData?.score ?? 1010000} combo={songData.combo} haveScore={recordData?.score !== undefined} />
                    </div>}
                </Surface>
            </div>

        </LayoutWrapper >
    )
}

export default SongPage

export async function getServerSideProps(context: NextPageContext) {

    context.res?.setHeader('Cache-Control', 'public, s-maxage=60')

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
