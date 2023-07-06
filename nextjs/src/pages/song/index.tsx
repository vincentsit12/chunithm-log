import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import _, { isInteger, isString } from 'lodash'
import { CiCircleMore } from "react-icons/ci";

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
    let orderedList = _.orderBy(songList, ({ master, ultima, expert }) => master?.rate || ultima?.rate || expert?.rate || 0, ['desc'])
    if (searchText)
      return _.filter(orderedList, k => {
        if (parseFloat(searchText) > 0.0) {
          let searchRate = parseFloat(searchText)
          return k.display_name.toUpperCase().includes(searchText.toUpperCase()) || (k.master?.rate === searchRate) || (k.expert?.rate === searchRate) || (k.ultima?.rate === searchRate)
        }
        else return k.display_name.toUpperCase().includes(searchText.toUpperCase())
      })
    else return orderedList
  }, [searchText, songList])


  const _renderTableRow = () => {

    return _.map(sortedRatingList, (k, i) => {

      return <tr key={i} className=' even:bg-gray-300/[.6] hover:bg-gray-500/[.4] active:bg-gray-500/[.4]' >
        {/* <td className='w-10'>{k.id}</td> */}
        <td className='p-2' >{k.display_name}</td>
        <td className='w-20'>{k.ultima?.rate ?? '-'}</td>
        <td className='w-20'>{k.master?.rate ?? '-'}</td>
        <td className='w-20'>{k.expert?.rate ?? '-'}</td>
        <td className='px-4 cursor-pointer' onClick={() => {
          router.push(`/song/${k.display_name}`)
        }}><CiCircleMore size={"1.5rem"}/></td>
      </tr>
    })
  }

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
                  <th ></th>
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
  context.res?.setHeader('Cache-Control', 'public, s-maxage=600')
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
