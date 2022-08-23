import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { Rating } from 'types'
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
var CryptoJS = require("crypto-js");

type Props = {
  songList: Songs[];
};


const SongPage: NextPage<Props> = ({ songList }) => {
  console.log("🚀 ~ file: song.tsx ~ line 29 ~ songList", songList)
  const [searchText, setSearchText] = useState('')
  const router = useRouter()

  const sortedRatingList = useMemo(() => {
    if (searchText)
      return _.filter(_.orderBy(songList, ['id'], ['asc']), k => k.display_name.toUpperCase().includes(searchText.toUpperCase()))
    else return (_.orderBy(songList, ['id'], ['asc']))
  }, [searchText, songList])



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
        router.push(k.display_name)
      }}>
        <td className='w-10'>{k.id}</td>
        <td>{k.display_name}</td>
        <td className='w-20'>{k.ultima?.rate ?? '-'}</td>
        <td className='w-20'>{k.master?.rate ?? '-'}</td>
        <td className='w-20'>{k.expert?.rate ?? '-'}</td>
      </tr>
    })
  }

  const { data: session, status } = useSession()
  return (
    <LayoutWrapper>
      <div className='inner inner-720 tc' >


        <div className='inner inner-720'  >
          <input value={searchText} onChange={(e) => {
            setSearchText(e.target.value)
          }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title'></input>
        </div>
        <div id='rating-table' className='box box-shadow mb20'>
          {songList.length > 0 ?
            <table >
              <thead>
                <tr >
                  <th >id</th>
                  <th >Name</th>
                  <th >Ultima</th>
                  <th >Master</th>
                  <th >Expert</th>
                </tr>
              </thead>
              <tbody>

                {_renderTableRow()}
              </tbody>
            </table>
            : <div className='inner-p20 w-full h-full text-left'>
              <p className='mb10'>
                {`
                  1. Save the above script into a browser bookmark:
                `}
              </p>
              <p className='mb10'>
                {`2. Open this page (required login) https://chunithm-net-eng.com/mobile/home/ or https://chunithm-net-eng.com/mobile/record/musicGenre/master`}
              </p>
              <p className='mb10'>
                {`
                  3. click the bookmark and wait for redirecting to this page again`
                }
              </p>
            </div>}
        </div>
        <button className="btn btn-secondary" onClick={() => { signOut() }}>Logout</button>
      </div>
    </LayoutWrapper >
  )
}

export default SongPage

export async function getServerSideProps(context: NextPageContext) {
  // context.res?.setHeader(
  //   'Cache-Control',
  //   'public, s-maxage=1, stale-while-revalidate=59'
  // )
  try {

    let data = await Songs.findAll({attributes : {exclude : ['user_id']}})

    // let average = _.take(ratingList, 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
    return {
      props: {
        songList: JSON.parse(JSON.stringify(data)),
        // average
        // userId: encryptUserId
      },
    }
  }
  catch (e) {
    console.log(e)
    return {
      props: {
        songList: [],

      },
    }
  }
}
