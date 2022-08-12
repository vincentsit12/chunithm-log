import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { Rating, Song } from 'types'
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
import { useMemo, useState } from 'react'
import { log } from 'console'

type SongProps = {
    record: Records[] | null
    song: Songs
};
type DifficultyInfo = {

}

const SongPage: NextPage<SongProps> = ({ record, song }) => {

    const [difficulty, setDifficulty] = useState("master")
    const _renderTableRow = () => {

    }
    const { data: session, status } = useSession()
    return (
        <LayoutWrapper>
            <div className='inner inner-540 '>
                <div className='box box-shadow inner-p20'>
                    <div className='tc bold mb20'>{song.display_name}</div>
                    <div className='flex justify-center w-full mb20' >
                        <div className="flex justify-between ">
                            {song.master && <button onClick={() => {
                                setDifficulty("master")
                            }} className={`btn bg-master${difficulty != "master" ? "-20" : ""} p-4 mx-10 `}>Master</button>}
                            {song.expert && <button onClick={() => {
                                setDifficulty("expert")
                            }} className={`btn bg-expert${difficulty != "expert" ? "-20" : ""} p-4 mx-10 `}>Expert</button>}
                            {song.ultima && <button onClick={() => {
                                setDifficulty("ultima")
                            }} className={`btn bg-ultima${difficulty != "ultima" ? "-20" : ""} p-4 mx-10 `}>Ultima</button>}
                        </div>

                    </div>
                    <div className='tc'>
                        {/* <div className='font-14'>{`Rate : ${JSON.parse(song[difficulty]).rate}`}</div>
                        <div className='font-14'>{`Combo :  ${JSON.parse(song[difficulty]).combo}`}</div> */}
                        {/* {session && <div className='font-14'>{}</div>} */}
                    </div>
                </div>
            </div>

        </LayoutWrapper >
    )
}

export default SongPage

export async function getServerSideProps(context: NextPageContext) {
    context.res?.setHeader(
        'Cache-Control',
        'public, s-maxage=600,'
    )


    const songName = context.query.song

    let session = await getSession(context)
    let song = await Songs.findOne({ where: { display_name: songName } })
    let record: Records[] | null = null

    if (song && session) {
        record = await Records.findAll({ where: { song_id: song.id, user_id: session.user.id } })
    }

    // let data: any = (await Users.findOne({where: {id: session?.user.id }, include: {model: Records, include: [{model: Songs }] } }))

    // const ratingList = _.map(data.records, function (o) {
    //   let song: Song = JSON.parse(o.song[o.difficulty])
    //   let rating = calculateSingleSongRating(song?.rate, o.score)
    //   let result: Rating = {song: o.song.display_name, combo: song?.combo ?? null, rating: rating, truncatedRating: toFixedTrunc(rating, 2), score: o.score, difficulty: o.difficulty, }
    //   return result
    // });
    // let average = _.take(ratingList, 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
    return {
        props: {
            // average
            song: JSON.parse(JSON.stringify(song)),
            record: JSON.parse(JSON.stringify(record))
        },
    }

}
