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

type Props = {
  ratingList: Rating[];
  average: number
};


const Home: NextPage<Props> = ({ ratingList, average }) => {
  const renderRatingColor = (d: string) => {
    switch (d) {
      case 'master':
        return 'bg-master'
        break;

      default:
        break;
    }
  }
  const renderTableRow = () => {

    return _.map(_.orderBy(ratingList, ['rating'], ['desc']), (k, i) => {
      return <tr key={i} >
        <td>{i + 1}</td>
        <td>{k.song}</td>
        <td>{k.score}</td>
        <td className='txt-white '><span className={classNames(`bg-${k.difficulty}`, 'rounded')}>{k.truncatedRating}</span></td>
      </tr>
    })
  }

  const { data: session, status } = useSession()
  return (
    <LayoutWrapper>
      <div className='inner inner-720 ' >
        <div className='flex box box-shadow' style={{ height: '48px' }}>
          <div id='script' >
            <p> {generateScript(session?.user.id!)}</p>
          </div>
          <CopyToClipboard text={generateScript(session?.user.id!)}>
            <button className='btn btn-secondary icon grid-center'><MdOutlineContentCopy></MdOutlineContentCopy></button>
          </CopyToClipboard>
        </div>
      </div>
      <div className='inner inner-540 tc '>
        <div className='font-20 mb20'>{`Top 30 Average : ${toFixedTrunc(average, 2)}`}</div>
        <div id='rating-table' className='box box-shadow mb20'>
          {ratingList.length > 0 ?
            <table >
              <tbody>
                {renderTableRow()}
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
  try {
    let session = await getSession(context)
    let data: any = (await Users.findOne({ where: { id: session?.user.id }, include: { model: Records, include: [{ model: Songs }] } }))

    const ratingList = _.map(data.records, function (o) {
      let song: Song = JSON.parse(o.song[o.difficulty])
      let rating = calculateSingleSongRating(song?.rate, o.score)
      let result: Rating = { song: o.song.display_name, combo: song?.combo, rating: rating, truncatedRating: toFixedTrunc(rating, 2), score: o.score, difficulty: o.difficulty, }
      return result
    });
    let average = _.take(ratingList, 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
    return {
      props: {
        ratingList,
        average
      },
    }
  }
  catch (e) {
    console.log(e)
    return {
      props: {
        ratingList: [] as Rating[]
      },
    }
  }
}
