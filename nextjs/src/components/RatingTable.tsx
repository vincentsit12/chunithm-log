import classNames from "classnames"
import _ from "lodash"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import { Rating } from "types"

export const RecentRatingTable = ({ recentRatingList }: { recentRatingList: Rating[] }) => {
    const [showTable, setShowTable] = useState(false)
    const router = useRouter()
    const height = recentRatingList.length * 42
    return <div>
        <div className='flex justify-center items-center mb-4 form-check'>
            <input onChange={(e) => {
                setShowTable(e.target.checked)
            }} checked={showTable} id="recent" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300" htmlFor="recent" >Recent Songs</label>
        </div>
        <div id='rating-table' className={'mb-5 box box-shadow !min-h-0 collapse scrollbar-hide'} style={{ 'maxHeight': !showTable ? 0 : `${height}px` }}>
            <table >
                <tbody>
                    {_.map(recentRatingList, (k, i) => {
                        return <tr key={i} className={classNames("even:bg-gray-300/[.6]", 'hover:bg-gray-500/[.4]', 'hover:bg-gray-500/[.4]')} >
                            <td className='song'>{k.song}</td>
                            <td>{k.internalRate}</td>
                            <td>{k.score}</td>
                            <td onClick={() => {
                                router.push(`/song/${k.song}`)
                            }} className='txt-white cursor-pointer'><span className={classNames(`bg-${k.difficulty}`, 'rounded')}>{k.truncatedRating}</span></td>
                        </tr >
                    })}
                </tbody>
            </table>
        </div>
    </div >
}

export const BestRatingTable = ({ ratingList }: { ratingList: Rating[] }) => {
    const [searchText, setSearchText] = useState('')
    const router = useRouter()

    const _renderTableRow = () => {

        return _.map(sortedRatingList, (k, i) => {
            return <tr key={i} className={classNames("even:bg-gray-300/[.6]", 'hover:bg-gray-500/[.4]', 'hover:bg-gray-500/[.4]', { 'border-b': i === 29 && !searchText, 'border-b-red-700': i === 29 && !searchText })} >
                <td>{k.order ?? '-'}</td>
                <td className='song'>{k.song}</td>
                <td>{k.internalRate}</td>
                <td>{k.score}</td>
                <td onClick={() => {
                    router.push(`/song/${k.song}`)
                }} className='txt-white cursor-pointer'><span className={classNames(`bg-${k.difficulty}`, 'rounded')}>{k.truncatedRating}</span></td>
            </tr >
        })
    }
    const sortedRatingList = useMemo(() => {
        if (searchText)
            return _.filter(_.orderBy(ratingList, ['master.rate'], ['desc']), k => {
                if (parseFloat(searchText) > 0.0) {
                    let searchRate = parseFloat(searchText)
                    return k.song.toUpperCase().includes(searchText.toUpperCase()) || (k.internalRate === searchRate)
                }
                else return k.song.toUpperCase().includes(searchText.toUpperCase())
            })
        else return (_.orderBy(ratingList, ['rating'], ['desc']))
    }, [searchText, ratingList])
    return <><div className='inner inner-720'  >
        <input value={searchText} onChange={(e) => {
            setSearchText(e.target.value)
        }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title / Rate'></input>
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
            1. Save the above script into a browser bookmark
          `}
                    </p>
                    <p className='mb10'>
                        {`2. Open this page (required login) `}<Link href={"https://chunithm-net-eng.com/mobile/home/"}>https://chunithm-net-eng.com/mobile/home/</Link>
                    </p>
                    <p className='mb10'>
                        {`
            3. click the bookmark and wait for redirecting to this page`
                        }
                    </p>
                </div>}
        </div>
    </>
}