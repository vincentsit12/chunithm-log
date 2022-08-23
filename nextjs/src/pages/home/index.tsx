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
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { hash } from 'bcryptjs'
import Link from 'next/link'
import { decrypt } from 'utils/encrypt'

type Props = {
  ratingList: Rating[];
  userId: string
};


const Home: NextPage<Props> = ({ ratingList, userId }) => {
  const [searchText, setSearchText] = useState('')
  const router = useRouter()

  const sortedRatingList = useMemo(() => {
    if (searchText)
      return _.filter(_.orderBy(ratingList, ['rating'], ['desc']), k => k.song.toUpperCase().includes(searchText.toUpperCase()))
    else return (_.orderBy(ratingList, ['rating'], ['desc']))
  }, [searchText, ratingList])

  const average = useMemo(() => {
    return _.take(_.orderBy(ratingList, ['rating'], ['desc']), 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
  }, [ratingList])

  const renderRatingColor = (d: string) => {
    switch (d) {
      case 'master':
        return 'bg-master'
        break;

      default:
        break;
    }
  }
  const _renderTableRow = () => {

    return _.map(sortedRatingList, (k, i) => {
      return <tr key={i} className='cursor-pointer hover:bg-gray-300/[.4] active:bg-gray-300/[.4]' onClick={() => {
        router.push(k.song)
      }}>
        <td>{i + 1}</td>
        <td>{k.song}</td>
        <td>{k.internalRate}</td>
        <td>{k.score}</td>
        <td className='txt-white '><span className={classNames(`bg-${k.difficulty}`, 'rounded')}>{k.truncatedRating}</span></td>
      </tr>
    })
  }

  return (
    <LayoutWrapper>

      <div className='inner inner-720 tc' >
        <div className='flex box box-shadow mb20' >
          <div id='script' >
            <p> {generateScript(userId)}</p>
          </div>
          <CopyToClipboard text={generateScript(userId)}>
            <button className='btn btn-secondary icon grid-center'>
              <MdOutlineContentCopy></MdOutlineContentCopy></button>
          </CopyToClipboard>
        </div>

        <div className='mb20 flex items-center'>
          <div className='font-20 flex-1'>{`Top 30 Average : ${toFixedTrunc(average, 2)}`}
          </div>
          {/* <button className="btn btn-secondary" onClick={() => { router.push('/song') }}>SONG LIST</button> */}
        </div>
        <div className='inner inner-720'  >
          <input value={searchText} onChange={(e) => {
            setSearchText(e.target.value)
          }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title'></input>
        </div>
        <div id='rating-table' className='box box-shadow mb20'>
          {ratingList.length > 0 ?
            <table >
              <tbody>
                {_renderTableRow()}
              </tbody>
            </table>
            : <div className='inner-p20 w-full h-full text-left'>
              <p className='mb10'>
                {`
                  1. Save the following script into a browser bookmark:
                `}
              </p>
              <p className='mb10'>
                {`2. Open this page (required login) https://chunithm-net-eng.com/mobile/home/ or https://chunithm-net-eng.com/mobile/record/musicGenre/master`}
              </p>
              <p className='mb10'>
                {`
                  3. click the bookmark`
                }
              </p>
            </div>}
        </div>
        <button className="btn btn-secondary" onClick={() => { signOut() }}>Logout</button>
      </div>
    </LayoutWrapper >
  )
}

export default Home

export async function getServerSideProps(context: NextPageContext) {
  // context.res?.setHeader(
  //   'Cache-Control',
  //   'public, s-maxage=1, stale-while-revalidate=59'
  // )
  try {
    let session = await getSession(context)
    if (!session) throw 'please login'
    const encryptUserId = session.user.id.toString()

    const userID = decrypt(encryptUserId)

    let data = (await Users.findOne({ where: { id: parseInt(userID) }, include: { model: Records, include: [{ model: Songs }] } }))

    const ratingList = _.map(data?.records, function (o) {
      let song: Song = o.song[o.difficulty]
      let rating = calculateSingleSongRating(song?.rate, o.score)
      let result: Rating = { song: o.song.display_name, combo: song?.combo || 0, internalRate: song?.rate || 0, rating: rating, truncatedRating: toFixedTrunc(rating, 2), score: o.score, difficulty: o.difficulty, }
      return result
    });
    // let average = _.take(ratingList, 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
    return {
      props: {
        ratingList,
        // average
        userId: encryptUserId
      },
    }
  }
  catch (e) {
    console.log(e)
    return {
      props: {
        ratingList: [] as Rating[],
      },
    }
  }
}
