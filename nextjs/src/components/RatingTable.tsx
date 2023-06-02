import classNames from "classnames"
import _ from "lodash"
import Link from "next/link"
import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Rating } from "types"
import { AutoSizer, CellMeasurer, CellMeasurerCache, Column, List, Table, WindowScroller } from 'react-virtualized';
import { toFixedTrunc } from "utils/calculateRating"

export const RecentRatingTable = ({ recentRatingList }: { recentRatingList: Rating[] }) => {
    const [showTable, setShowTable] = useState(false)
    const router = useRouter()
    const height = recentRatingList.length * 42
    return <div>
        <div className='flex justify-center items-center mb-4 form-check'>
            <input onChange={(e) => {
                setShowTable(e.target.checked)
            }} checked={showTable} id="recent" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="recent" >Recent Songs</label>
        </div>
        <div id='rating-table' className={'mb-5 box box-shadow !min-h-0 collapse scrollbar-hide'} style={{ 'maxHeight': !showTable ? 0 : `${height}px` }}>

            {_.map(recentRatingList, (k, i) => {
                return <div key={k.song + i} className={classNames("rating-table-row")} >
                    <span className="px-2 w-[3rem]">{k.order ?? '-'}</span>
                    <span className='flex-1 px-2'>{k.song}</span>
                    <span className="px-2">{toFixedTrunc(k.internalRate, 1)}</span>
                    <span className="px-2 w-[5.5rem]">{k.score}</span>
                    <div onClick={() => {
                        router.push(`/song/${k.song}`)
                    }} className='px-2 txt-white '><span className={classNames(`bg-${k.difficulty}`, 'rounded cursor-pointer')}>{k.truncatedRating}</span></div>
                </div >
            })}

        </div>
    </div >
}
const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 100
});

export const BestRatingTable = ({ ratingList }: { ratingList: Rating[] }) => {
    const [searchText, setSearchText] = useState('')
    const router = useRouter()
    const ref = useRef()
    const [tableRowsNumber, setTableRowsNumber] = useState(100)

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
    }, [searchText])


    const _renderTableRow = useCallback(() => {
        const tableRowsNum = tableRowsNumber < 0 ? sortedRatingList.length : tableRowsNumber
        return _.map(_.take(sortedRatingList, tableRowsNum), (k, i) => {
            return <div key={k.song + i} className={classNames("rating-table-row", { 'border-b': i === 29 && !searchText && (tableRowsNumber > 30 || tableRowsNumber < 0), 'border-b-red-700': i === 29 && !searchText })} >
                <span className="w-[3rem]">{k.order ?? '-'}</span>
                <span className='flex-1 px-2'>{k.song}</span>
                <span className="w-[3.5rem]">{toFixedTrunc(k.internalRate, 1)}</span>
                <span className="w-[5.5rem]">{k.score}</span>

                <span onClick={() => {
                    router.push(`/song/${k.song}`)
                }} className={classNames(`txt-white  w-[3.5rem] bg-${k.difficulty}`, 'rounded cursor-pointer w-full')}>{k.truncatedRating} </span>
            </div >
        })
    }, [sortedRatingList, tableRowsNumber])


    return <><div className='inner inner-720'  >
        <input value={searchText} onChange={(e) => {
            setSearchText(e.target.value)
        }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title / Rate'></input>
    </div>
        <div className='flex justify-center items-center mb-4 form-check'>
            <input onChange={(e) => {
                setTableRowsNumber(30)
            }} checked={tableRowsNumber == 30} id="record-30" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-30" >Top 30</label>
            <input onChange={(e) => {
                setTableRowsNumber(100)
            }} checked={tableRowsNumber == 100} id="record-100" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-100" >Top 100</label>
            <input onChange={(e) => {
                setTableRowsNumber(500)
            }} checked={tableRowsNumber == 500} id="record-500" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-500" >Top 500</label>
            <input onChange={(e) => {
                setTableRowsNumber(-1)
            }} checked={tableRowsNumber == -1} id="record-all" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-all" >All</label>
        </div>
        <div id='rating-table' className='box box-shadow'>
            {ratingList.length > 0 ?
                // <AutoSizer disableHeight>
                //     {({ width }) => {
                //         return <WindowScroller>
                //             {({ height, isScrolling, onChildScroll, scrollTop }) => (
                //                 <List
                //                     width={width}
                //                     autoHeight
                //                     height={height}
                //                     // ref={ref}
                //                     isScrolling={isScrolling}
                //                     onScroll={onChildScroll}
                //                     // rowStyle={{ display: 'flex' }}
                //                     scrollTop={scrollTop}
                //                     // rowRenderer={({ index, key, style }) => {
                //                     //     const k = sortedRatingList[index]
                //                     //     return  
                //                     // }}

                //                     // rowClassName={(info) => classNames("flex", "even:bg-gray-300/[.6]", 'hover:bg-gray-500/[.4]', 'hover:bg-gray-500/[.4]', { 'border-b': info.index === 29 && !searchText, 'border-b-red-700': info.index === 29 && !searchText })}
                //                     deferredMeasurementCache={cache}
                //                     rowHeight={cache.rowHeight}
                //                     rowCount={sortedRatingList.length}
                //                     rowRenderer={({ index, key, style, parent }) => {
                //                         const k = sortedRatingList[index]

                //                         return (
                //                             <CellMeasurer
                //                                 key={key}
                //                                 cache={cache}
                //                                 parent={parent}
                //                                 columnIndex={0}
                //                                 rowIndex={index}>
                //                                 {({ measure, registerChild }) => {
                //                                     return <div ref={registerChild} style={style} key={index} className={classNames("rating-table-row", { 'border-b': index === 29 && !searchText, 'border-b-red-700': index === 29 && !searchText, "bg-gray-300/[.6]": index % 2 === 1 })} >
                //                                         <span className="w-[3rem]">{k.order ?? '-'}</span>
                //                                         <span className='flex-1 px-2'>{k.song}</span>
                //                                         <span className="w-[3.5rem]">{toFixedTrunc(k.internalRate, 1)}</span>
                //                                         <span className="w-[5.5rem]">{k.score}</span>

                //                                         <span onClick={() => {
                //                                             router.push(`/song/${k.song}`)
                //                                         }} className={classNames(`txt-white  w-[3.5rem] bg-${k.difficulty}`, 'rounded cursor-pointer w-full')}>{k.truncatedRating} </span>
                //                                     </div >
                //                                 }}
                //                             </CellMeasurer>
                //                         )
                //                     }}

                //                 >

                //                 </List>)}

                //         </WindowScroller>
                //     }}
                // </AutoSizer>

                _renderTableRow()

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

export const BestRatingTable2 = ({ ratingList }: { ratingList: Rating[] }) => {

    const [searchText, setSearchText] = useState('')
    const router = useRouter()
    const ref = useRef()
    const [tableRowsNumber, setTableRowsNumber] = useState(100)

    const sortedRatingList = () => {
        if (searchText)
            return _.filter(_.orderBy(ratingList, ['master.rate'], ['desc']), k => {
                if (parseFloat(searchText) > 0.0) {
                    let searchRate = parseFloat(searchText)
                    return k.song.toUpperCase().includes(searchText.toUpperCase()) || (k.internalRate === searchRate)
                }
                else return k.song.toUpperCase().includes(searchText.toUpperCase())
            })
        else return (_.orderBy(ratingList, ['rating'], ['desc']))
    }


    const _renderTableRow = () => {
        const list = sortedRatingList()
        const tableRowsNum = tableRowsNumber < 0 ? list.length : tableRowsNumber
        return _.map(_.take(list, tableRowsNum), (k, i) => {
            return <tr key={k.song + i} className={classNames({ 'border-b': i === 29 && !searchText && (tableRowsNumber > 30 || tableRowsNumber < 0), 'border-b-red-700': i === 29 && !searchText })} >
                <td>{k.order ?? '-'}</td>
                <td className='song'>{k.song}</td>
                <td>{toFixedTrunc(k.internalRate, 1)}</td>
                <td >{k.score}</td>
                <td onClick={() => {
                    router.push(`/song/${k.song}`)
                }} className='txt-white cursor-pointer'><span className={classNames(`bg-${k.difficulty}`, 'rounded')}>{k.truncatedRating}</span></td>
            </tr >
        })
    }
    const _renderTable = () => {
        const list = sortedRatingList()
        return <AutoSizer disableHeight>
            {({ width }) => {
                return <WindowScroller>
                    {({ height, isScrolling, onChildScroll, scrollTop }) => (
                        <List
                            width={width}
                            autoHeight
                            height={height}
                            // ref={ref}
                            isScrolling={isScrolling}
                            onScroll={onChildScroll}
                            // rowStyle={{ display: 'flex' }}
                            scrollTop={scrollTop}
                            // rowRenderer={({ index, key, style }) => {
                            //     const k = sortedRatingList[index]
                            //     return  
                            // }}

                            // rowClassName={(info) => classNames("flex", "even:bg-gray-300/[.6]", 'hover:bg-gray-500/[.4]', 'hover:bg-gray-500/[.4]', { 'border-b': info.index === 29 && !searchText, 'border-b-red-700': info.index === 29 && !searchText })}
                            deferredMeasurementCache={cache}
                            rowHeight={cache.rowHeight}
                            rowCount={list.length}
                            rowRenderer={({ index, key, style, parent }) => {
                                const k = list[index]

                                return (
                                    <CellMeasurer
                                        key={key}
                                        cache={cache}
                                        parent={parent}
                                        columnIndex={0}
                                        rowIndex={index}>
                                        {({ measure, registerChild }) => {
                                            return <div style={style} key={index} className={classNames("rating-table-row-2", { 'border-b': index === 29 && !searchText, 'border-b-red-700': index === 29 && !searchText, "bg-gray-300/[.6]": index % 2 === 1 })} >
                                                <span className="w-[3rem]">{k.order ?? '-'}</span>
                                                <span className='flex-1 px-2'>{k.song}</span>
                                                <span className="w-[3.5rem]">{toFixedTrunc(k.internalRate, 1)}</span>
                                                <span className="w-[5.5rem]">{k.score}</span>

                                                <span onClick={() => {
                                                    router.push(`/song/${k.song}`)
                                                }} className={classNames(`txt-white  w-[3.5rem] bg-${k.difficulty}`, 'rounded cursor-pointer w-full')}>{k.truncatedRating} </span>
                                            </div >
                                        }}
                                    </CellMeasurer>
                                )
                            }}

                        >

                        </List>)}

                </WindowScroller>
            }}
        </AutoSizer>
    }
    return <><div className='inner inner-720'  >
        <input value={searchText} onChange={(e) => {
            setSearchText(e.target.value)
        }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title / Rate'></input>
    </div>
        {/* <div className='flex justify-center items-center mb-4 form-check'>
            <input onChange={(e) => {
                setTableRowsNumber(30)
            }} checked={tableRowsNumber == 30} id="record-30" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-30" >Top 30</label>
            <input onChange={(e) => {
                setTableRowsNumber(100)
            }} checked={tableRowsNumber == 100} id="record-100" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-100" >Top 100</label>
            <input onChange={(e) => {
                setTableRowsNumber(500)
            }} checked={tableRowsNumber == 500} id="record-500" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-500" >Top 500</label>
            <input onChange={(e) => {
                setTableRowsNumber(-1)
            }} checked={tableRowsNumber == -1} id="record-all" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="record-all" >All</label>
        </div> */}
        <div id='rating-table' className='box box-shadow'>
            {ratingList.length > 0 ?
                _renderTable()
                // <table >
                //     <tbody>
                //         {_renderTableRow()}
                //     </tbody>
                // </table>
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