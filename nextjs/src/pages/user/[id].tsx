import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { Rating, Song } from 'types'
import _, { isString } from 'lodash'
import Users from 'db/model/users'
import Records from 'db/model/records'
import Songs from 'db/model/songs'
import { MdOutlineContentCopy } from 'react-icons/md'
import { calculateSingleSongRating, generateScript, toFixedTrunc } from 'utils/calculateRating'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LayoutWrapper from 'components/LayoutWrapper'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Op } from 'sequelize'
import { BestRatingTable, RecentRatingTable } from 'components/RatingTable'
import { getRatingList } from 'utils/getRatingList'

type Props = {
    bestRatingList: Rating[],
    recentRatingList: Rating[]
    userName: string;
};


const User: NextPage<Props> = ({ bestRatingList, recentRatingList, userName }) => {
    const [copied, setCopied] = useState(false)
    const timer = useRef<NodeJS.Timeout>()
    const [searchText, setSearchText] = useState('')
    const router = useRouter()
    const ref = useRef(null)
    // const sortedRatingList = useMemo(() => {
    //   if (searchText)
    //     return _.filter(_.orderBy(ratingList, ['rating'], ['desc']), k => k.song.toUpperCase().includes(searchText.toUpperCase()))
    //   else return (_.orderBy(ratingList, ['rating'], ['desc']))
    // }, [searchText, ratingList])


    const [average, max, recentAverage, recent] = useMemo(() => {
        const additons = 0.00000001
        const top30 = _.take(_.orderBy(bestRatingList, ['rating'], ['desc']), 30)
        const top30Total = top30.reduce((a: number, b: Rating) => a + b.rating, 0)
        const top30Avg = top30Total / 30 + additons
        const recentTotal = recentRatingList.reduce((a: number, b: Rating) => a + b.rating, 0) 
        const recentAvg =  recentRatingList.length > 0 ? (recentTotal / recentRatingList.length) + additons : 0
        const maxRate =  (top30Total + top30[0].rating * 10) / 40 + additons
        const recent = (top30Total + recentTotal) / (30 + recentRatingList.length) + additons
        if (top30.length < 1) return [0, 0, 0, 0]
        return [top30Avg, maxRate,recentAvg, recent]
      }, [bestRatingList, recentRatingList])


    return (
        <LayoutWrapper>

            <div className='inner inner-720 tc' >

                <h1 className='mb-2'>{`User: ${userName}`}</h1>

                <div className='mb20  items-center'>
                    <div className="space-x-5">
                        <span >
                            {`Top 30 Average : ${toFixedTrunc(average, 4)}`}
                        </span>
                        <span>
                            {`Max : ${toFixedTrunc(max, 2)}`}
                        </span>
                    </div>
                    <div className="space-x-5">
                        <span>
                            {`Recent : ${toFixedTrunc(recentAverage, 2)}`}
                        </span>
                        <span>
                            {`Now : ${toFixedTrunc(recent, 2)}`}
                        </span>
                    </div>
                    {/* <button className="btn btn-secondary" onClick={() => { router.push('/song') }}>SONG LIST</button> */}
                </div>
                <RecentRatingTable recentRatingList={recentRatingList} isOtherUser/>
                <BestRatingTable ratingList={bestRatingList} />
            </div>
        </LayoutWrapper >
    )
}

export default User

export async function getServerSideProps(context: NextPageContext) {
    context.res?.setHeader('Cache-Control', 'public, s-maxage=60')
    try {
        // let session = await getSession(context)

        const userId = context.query.id as string

        if (!userId) return {
            redirect: {
                permanent: false,
                destination: '/login',
            }
        }


        let data = (await Users.findOne({
            where: {
                [Op.or]: [
                { username: userId },
                    { id: isNaN(parseInt(userId)) ? 0 :parseInt(userId)},
                ]
            }, include: {
                model: Records,

                include: [{
                    model: Songs,
                }]
            }
        }))
        if (!data) return {
            notFound: true,
        }
        const [bestRatingList, recentRatingList] = await getRatingList( data)

        return {
            props: {
                bestRatingList,
                recentRatingList,
                // average                // average
                userName: data.username,
            },
        }
    }
    catch (e) {
        console.log(e)
        return {
            notFound: true,
        }
    }
}
