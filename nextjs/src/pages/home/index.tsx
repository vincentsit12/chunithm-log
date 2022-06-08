import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { Rating } from 'types'
import { getRatingList } from 'utils/api'
import _ from 'lodash'
import Users from 'db/model/users'
import Records from 'db/model/records'
import Songs from 'db/model/songs'
import { calculateSingleSongRating } from 'utils/calculateRating'
type Props = {
  ratingList: Rating[];
};

const Home: NextPage<Props> = ({ ratingList }) => {
  const renderTableRow = () => {

    return _.map(_.orderBy(ratingList, ['rating'], ['desc']), (k, i) => {
      return <tr key={i}>
        <td>{i + 1}</td>
        <td>{k.song}</td>
        <td>{k.score}</td>
        <td>{k.rating}</td>
      </tr>
    })

  }
  const { data: session, status } = useSession()
  return (
    <div id='container'>
      <div className='inner inner-540 tc'>
        <div id='rating-table' className='mb20'>
          <div className="margin-bottom:10px">
            {/* <div className="closeBtn" onClick={() => { }}>
              <span className="width: 100%;height: 3px; transform: translateY(8px) rotate(45deg);;background-color: black;"></span>
              <span className="width:  100%;height: 3px;transform: translateY(5px) rotate(135deg);background-color: black;"></span>
            </div> */}
            {/* ${"Average Rating: " + (Math.trunc(totalRate / 30 * 100) / 100).toFixed(2)} */}
            {/* <div >
            <input id='top30' type='checkbox' /> <label htmlFor="top30">Top30</label>
          </div> */}

          </div>
          <table >
            <tbody>
              {renderTableRow()}
            </tbody>
          </table>

        </div>
        <button className="btn btn-secondary" onClick={() => { signOut() }}>Logout</button>
      </div>
    </div >
  )
}

export default Home

export async function getServerSideProps(context: NextPageContext) {
  try {
    let session = await getSession(context)
    let data: any = (await Users.findOne({ where: { id: session?.user.id}, include: { model: Records, include: [{ model: Songs }] } }))

    const ratingList = _.map(data.records, function (o) {
        let rate = (Math.trunc(calculateSingleSongRating(o.song[o.difficulty], o.score) * 100) / 100).toFixed(2)
        let result: Rating = { song: o.song.name, rating: rate, score: o.score, difficulty: o.difficulty, }
        return result
    });

    return {
      props: {
        ratingList
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
