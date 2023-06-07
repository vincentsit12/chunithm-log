import type { NextPage, NextPageContext } from 'next'
import { Rating, Song } from 'types'
import _, { isString } from 'lodash'
import LayoutWrapper from 'components/LayoutWrapper'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import 'rc-tooltip/assets/bootstrap_white.css';
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

        {/* <RecentRatingTable recentRatingList={recentRatingList} /> */}
        <div>
          {testrecord.map((i) => {
            return <div key={`${i}`} className='mb-1 flex bg-black text-white p-2'>
              <span className='w-full text-center'>123123</span>
            </div>
          })}
        </div>
      </div>
    </LayoutWrapper >
  )
}

export default Home


