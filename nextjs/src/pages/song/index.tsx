import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import _, { isInteger, isString } from 'lodash'
import { CiCircleMore } from "react-icons/ci";

import Songs from 'db/model/songs'

import LayoutWrapper from 'components/LayoutWrapper'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { sequelize } from 'db';
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { TextField } from '@/components/ui/TextField'

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

      return <tr key={i} className='border-t border-white/5 text-slate-100 transition-colors even:bg-slate-300/10 hover:bg-violet-500/15 active:bg-violet-500/15' >
        {/* <td className='w-10'>{k.id}</td> */}
        <td className='px-4 py-3 font-medium text-white' >{k.display_name}</td>
        <td className='w-20 px-4 py-3 text-center text-slate-200'>{k.ultima?.rate ?? '-'}</td>
        <td className='w-20 px-4 py-3 text-center text-slate-200'>{k.master?.rate ?? '-'}</td>
        <td className='w-20 px-4 py-3 text-center text-slate-200'>{k.expert?.rate ?? '-'}</td>
        <td className='px-4 py-3 text-right'>
          <Button className='text-slate-300 hover:text-cyan-200' size='icon-sm' variant='ghost' onClick={() => {
          router.push(`/song/${k.display_name}`)
        }}><CiCircleMore size={"1.35rem"} /></Button></td>
      </tr>
    })
  }

  return (
    <LayoutWrapper>
      <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 text-center' >
        <Surface className='px-6 py-5'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300'>Library</p>
          <h1 className='mb-5 text-3xl font-bold text-white'>Song List</h1>
          <TextField value={searchText} onChange={(e) => {
            setSearchText(e.target.value)
          }} placeholder='Song Title / Rate' />
        </Surface>
        <Surface id='rating-table' className='overflow-hidden px-2 py-2'>
          {songList.length > 0 &&
            <table className='w-full overflow-hidden text-left text-sm text-slate-200 sm:text-base' >
              <thead>
                <tr className='border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 sm:text-sm' >
                  {/* <th >id</th> */}
                  <th className='px-4 py-3'>Name</th>
                  <th className='px-4 py-3 text-center'>Ultima</th>
                  <th className='px-4 py-3 text-center'>Master</th>
                  <th className='px-4 py-3 text-center'>Expert</th>
                  <th className='px-4 py-3 text-right'>Open</th>
                </tr>
              </thead>
              <tbody>

                {_renderTableRow()}
              </tbody>
            </table>
          }
        </Surface>

      </div>
    </LayoutWrapper >
  )
}

export default SongPage

export async function getServerSideProps(context: NextPageContext) {
  context.res?.setHeader('Cache-Control', 'public, s-maxage=600')
  try {
    let data = await Songs.findAll({
      where: {
        is_deleted: false
      },
      attributes: {
        exclude: ['user_id']

      }
    })
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
