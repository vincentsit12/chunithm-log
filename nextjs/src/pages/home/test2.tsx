import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { Rating, Song } from 'types'
import { getRatingList } from 'utils/api'
import _, { isString } from 'lodash'
import Users from 'db/model/users'
import Records from 'db/model/records'
import Songs from 'db/model/songs'
import { MdOutlineContentCopy } from 'react-icons/md'
import { calculateSingleSongRating, generateScript, toFixedTrunc } from 'utils/calculateRating'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LayoutWrapper from 'components/LayoutWrapper'
import classNames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { hash } from 'bcryptjs'
import Link from 'next/link'
import { decrypt } from 'utils/encrypt'
import Tooltip from 'rc-tooltip'
import { log } from 'console'
import { Op } from 'sequelize'
import { BestRatingTable, BestRatingTable2, RecentRatingTable } from 'components/RatingTable'
import { testrecord } from 'utils/test'

type Props = {
  bestRatingList: Rating[],
  recentRatingList: Rating[]
  userId: string;
  userName?: string
};



const Home: NextPage<Props> = () => {
  const [copied, setCopied] = useState(false)
  const timer = useRef<NodeJS.Timeout>()
  const router = useRouter()
  const ref = useRef(null)
  // const sortedRatingList = useMemo(() => {
  //   if (searchText)
  //     return _.filter(_.orderBy(ratingList, ['rating'], ['desc']), k => k.song.toUpperCase().includes(searchText.toUpperCase()))
  //   else return (_.orderBy(ratingList, ['rating'], ['desc']))
  // }, [searchText, ratingList])


  return (
    <LayoutWrapper>

      <div className='inner inner-720 tc' >

        <div className='flex box box-shadow mb20' >

          <div id='script' >

          </div>


        </div>

        <div className='mb20  items-center'>

          {/* <button className="btn btn-secondary" onClick={() => { router.push('/song') }}>SONG LIST</button> */}
        </div>
        {/* <RecentRatingTable recentRatingList={recentRatingList} /> */}
        <BestRatingTable ratingList={testrecord} />
      </div>
    </LayoutWrapper >
  )
}

export default Home


