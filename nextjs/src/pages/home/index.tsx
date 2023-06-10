import type { NextPage, NextPageContext } from 'next'
import { getSession, signOut, useSession } from 'next-auth/react'
import { Rating, Song } from 'types'
import _, { isString } from 'lodash'
import Users from 'db/model/users'
import Records from 'db/model/records'
import Songs from 'db/model/songs'
import { MdOutlineContentCopy } from 'react-icons/md'
import { calculateSingleSongRating, generateScript, toFixedTrunc } from 'utils/calculateRating'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LayoutWrapper from 'components/LayoutWrapper'
import { SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { decrypt } from 'utils/encrypt'
import Tooltip from 'rc-tooltip'
import 'rc-tooltip/assets/bootstrap_white.css';
import { BestRatingTable, RecentRatingTable } from 'components/RatingTable'
import Modal from 'components/Modal'
import axios from 'axios'
import { getRecommandList } from 'utils/api'
import { getRatingList } from 'utils/getRatingList'

type Props = {
  bestRatingList: Rating[],
  recentRatingList: Rating[]
  userId: string;
  userName?: string
};

const RecommadSongs = ({ avg }: { avg: number }) => {
  const [list, setList] = useState<Songs[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let upper = Math.max(avg + 0.1 - 2.15, 10)
    let lower = Math.max(avg - 2.15, 0)
    getRecommandList(lower, upper).then(d => {
      setList(d.data)
    }).catch((e) => {

    })

  }, [])

  return <ul>
    {_.map(list, (k, i) => {
      return <li>
        {`${i}. ${k.display_name} ${k.id}}`}
      </li>
    })}
  </ul>
}

const Home: NextPage<Props> = ({ bestRatingList, recentRatingList, userId, userName }) => {
  const [copied, setCopied] = useState(false)
  const timer = useRef<NodeJS.Timeout>()
  const router = useRouter()
  const ref = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(true)

  const [average, max, recentAverage, recent] = useMemo(() => {
    const top30 = _.take(_.orderBy(bestRatingList, ['rating'], ['desc']), 30)
    const top30Total = top30.reduce((a: number, b: Rating) => a + b.rating, 0)
    const recentTotal = recentRatingList.reduce((a: number, b: Rating) => a + b.rating, 0)
    const recent = (top30Total + recentTotal) / (30 + recentRatingList.length)
    if (top30.length < 1) return [0, 0, 0, 0]
    return [top30Total / 30, (top30Total + top30[0].rating * 10) / 40, recentRatingList.length > 0 ? recentTotal / recentRatingList.length : 0, recent]
  }, [bestRatingList, recentRatingList])

  return (
    <LayoutWrapper>

      <div className='inner inner-720 tc' >
        {userName && <h1 className='mb-2'>{`User: ${userName}`}</h1>}
        <div className='flex box box-shadow mb20' >

          <div id='script' >
            <p> {generateScript(userId)}</p>
          </div>
          <CopyToClipboard text={generateScript(userId)}>
            <Tooltip onVisibleChange={(visible) => {
              if (visible) {
                timer.current = setTimeout(() => {
                  setCopied(false)
                }, 3000)
              }
            }} visible={copied} overlayClassName={'fadeIn'} showArrow={false} overlayStyle={{ width: '6rem', textAlign: "center", }} placement='top' trigger={['click']} overlay={<span>Copied</span>}>
              <button onClick={() => {
                if (copied && timer.current) {
                  clearTimeout(timer.current)
                  timer.current = setTimeout(() => {
                    setCopied(false)
                  }, 3000)
                }
                else setCopied(true)
              }}
                className='btn btn-secondary icon grid-center'>
                <MdOutlineContentCopy></MdOutlineContentCopy></button>
            </Tooltip>

          </CopyToClipboard>


        </div>

        <div className='mb20  items-center'>
          <div className="space-x-5">
            <span >
              {`Top 30 Average : ${toFixedTrunc(average, 2)}`}
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
        <RecentRatingTable recentRatingList={recentRatingList} />
        <BestRatingTable ratingList={bestRatingList} />
      </div>
      {/* <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <RecommadSongs avg={average} />
      </Modal> */}
    </LayoutWrapper >
  )
}

export default Home

export async function getServerSideProps(context: NextPageContext) {
  context.res?.setHeader('Cache-Control', 'public, s-maxage=10')
  try {
    let session = await getSession(context)
    if (!session) return {
      redirect: {
        permanent: false,
        destination: '/login',
      }
    }
    const encryptUserId = session.user.id.toString()

    const userID = decrypt(encryptUserId)

    let data = (await Users.findOne({
      where: { id: parseInt(userID) }, include: {
        model: Records,
        include: [{
          model: Songs,
        }]
      }
    }))

    const [bestRatingList, recentRatingList] = await getRatingList(data)

    // let average = _.take(ratingList, 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
    return {
      props: {
        bestRatingList,
        recentRatingList,
        // average
        userId: encryptUserId,
        userName: data?.username ?? ""
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
