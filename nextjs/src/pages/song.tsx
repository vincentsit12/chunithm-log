import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'

import _, { isInteger, isString } from 'lodash'

import Songs from 'db/model/songs'

import LayoutWrapper from 'components/LayoutWrapper'
import classNames from 'classnames'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'

type Props = {
  songList: Songs[];
};


const SongPage: NextPage<Props> = ({ songList }) => {
  const [searchText, setSearchText] = useState('')
  const router = useRouter()

  const sortedRatingList = useMemo(() => {
    if (searchText)
      return _.filter(_.orderBy(songList, ['master.rate'], ['desc']), k => {
        if (parseFloat(searchText) > 0.0) {
          let searchRate = parseFloat(searchText)
          return k.display_name.toUpperCase().includes(searchText.toUpperCase()) || (k.master?.rate === searchRate) || (k.expert?.rate === searchRate) || (k.ultima?.rate === searchRate)
        }
        else return k.display_name.toUpperCase().includes(searchText.toUpperCase())
      })
    else return (_.orderBy(songList, ['master.rate'], ['desc']))
  }, [searchText, songList])

  const renderRatingColor = (d: string) => {
    switch (d) {
      case 'master':
        return 'bg-master'
      default:
        break;
    }
  }
  const _renderTableRow = () => {

    return _.map(sortedRatingList, (k, i) => {
      if (isString(k.master) || isString(k.expert) || isString(k.ultima))
        console.log("🚀 ~ file: song.tsx ~ line 55 ~ return_.map ~ k", k)
      return <tr key={i} className='cursor-pointer even:bg-gray-300/[.6] hover:bg-gray-500/[.4] active:bg-gray-500/[.4]' onClick={() => {
        router.push(k.display_name)
      }}>
        {/* <td className='w-10'>{k.id}</td> */}
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
          }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title / Rate'></input>
        </div>
        <div id='rating-table' className='box box-shadow mb20 '>
          {songList.length > 0 &&
            <table >
              <thead>
                <tr >
                  {/* <th >id</th> */}
                  <th className='song'>Name</th>
                  <th >Ultima</th>
                  <th >Master</th>
                  <th >Expert</th>
                </tr>
              </thead>
              <tbody>

                {_renderTableRow()}
              </tbody>
            </table>
          }
        </div>

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

    let data = await Songs.findAll({ attributes: { exclude: ['user_id'] } })
    // let x = await sequelize.query(`delete from songs WHERE not master::jsonb ? 'rate'`)
    // console.log("🚀 ~ file: song.tsx ~ line 116 ~ getServerSideProps ~ data", x)

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
