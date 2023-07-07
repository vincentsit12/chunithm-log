import classNames from "classnames"
import _, { isNumber } from "lodash"
import Link from "next/link"
import { useRouter } from "next/router"
import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Rating, SortingKeys, TableHeader } from "types"
import { AutoSizer, CellMeasurer, CellMeasurerCache, Column, List, Table, WindowScroller } from 'react-virtualized';
import { toFixedTrunc } from "utils/calculateRating"
import { useWindowResize } from "utils/hooks/useWindowResize"
import { GiMusicalScore } from "react-icons/gi";
import { BiSolidUpArrow, BiLogoYoutube, BiSolidDownArrow, BiListCheck, BiUpsideDown, BiCheck } from "react-icons/bi";
import { Listbox, Transition } from '@headlessui/react'
import ListBox from "./ListBox"
import DraggableList, { DropList } from "./DraggableList"
import Modal from "./Modal"
import { IoMdSettings } from "react-icons/io"
import { Divider } from "./Divider"
import { useLocalStorage } from "utils/hooks/useLocalStorage"

const levels = [{ "name": "All", "value": 0 }, { "name": "15", "value": 15 }, { "name": "14+", "value": 14.5 }, { "name": "14", "value": 14 }, { "name": "13+", "value": 13.5 }, { "name": "13", "value": 13 }, { "name": "12+", "value": 12.5 }, { "name": "12", "value": 12 }, { "name": "11+", "value": 11.5 }, { "name": "11", "value": 11 }, { "name": "10+", "value": 10.5 }, { "name": "10", "value": 10 },]
const tableRowsNumbers = [
    { name: "All", value: -1 }, { name: "30", value: 30 }, { name: "100", value: 100 }, { name: "200", value: 200 }, { name: "500", value: 500 },
]
const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 42
});

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
        <div className={'rating-table mb-5 box box-shadow !min-h-0 collapsable scrollbar-hide'} style={{ 'maxHeight': !showTable ? 0 : `${height}px` }}>

            {_.map(recentRatingList, (k, i) => {
                return <div key={k.song + i} className={classNames("rating-table-row")} >
                    <span className="w-[3rem]">{k.order ?? '-'}</span>
                    <span className='flex-1 px-2'>{k.song}</span>
                    {/* <span className='cursor-pointer w-[1.75rem] px-1'><BiLogoYoutube size={"100%"} /></span> */}
                    {k.scriptUrl && <span className='cursor-pointer w-[1.75rem] px-1' onClick={() => {
                        window.open(k.scriptUrl)
                    }}><GiMusicalScore size={"100%"} /></span>}
                    <span className="w-[3.5rem]">{toFixedTrunc(k.internalRate, 1)}</span>
                    <span className="w-[5.5rem]">{k.score}</span>
                    <span onClick={() => {
                        router.push(`/song/${k.song}`)
                    }} className={classNames(`txt-white  w-[3.5rem] bg-${k.difficulty}`, 'rounded cursor-pointer')}>{k.truncatedRating} </span>
                </div >
            })}

        </div>
    </div >
}



const item: TableHeader[] = ["Youtube", "Grade"];
const selected: TableHeader[] = ["Rank", "Name", "Script", "Base", "Score", "Rate"];
export const BestRatingTable = ({ ratingList }: { ratingList: Rating[] }) => {
    const [itemList, setItemList] = useLocalStorage<DropList>({
        "notSelected": item,
        "selected": selected,
    }, "headerPref");
    const [tempItemList, setTempItemList] = useState<DropList>({
        "notSelected": itemList["notSelected"],
        "selected": itemList["selected"],
    });

    const [isModalOpen, setIsModalOpen] = useState(false)
    const ref = useRef<HTMLInputElement | null>(null);

    const [scoreRange, setScoreRange] = useState<[number, number]>([0, 1010000])
    const [tempScoreRange, setTempScoreRange] = useState<[number, number]>(scoreRange)

    useEffect(() => {
        setTempItemList(itemList)
        setTempScoreRange(scoreRange)
    }, [itemList, scoreRange])
    const [selectedLevel, setSelectedLevel] = useState(levels[0])
    const [searchText, setSearchText] = useState('')
    const router = useRouter()
    const [selectedTableRowsNumber, setSelectedTableRowsNumber] = useState(tableRowsNumbers[3])
    const tableRowsNumber = selectedTableRowsNumber.value
    const [sortingPref, setSortingPref] = useState<[SortingKeys, "asc" | "desc"]>(['rating', "desc"])

    const sortedRatingList = useMemo(() => {
        let orderedList: Rating[]
        const scoreRule = (score: number) => {
            return score >= scoreRange[0] && score <= scoreRange[1]
        }

        if (selectedLevel.value > 0) {
            orderedList = ratingList.filter(k => scoreRule(k.score) && k.internalRate >= selectedLevel.value && k.internalRate < selectedLevel.value + 0.5)
        }
        else {
            orderedList = ratingList.filter(k => scoreRule(k.score))
        }

        if (sortingPref[0] === 'rating') {
            orderedList = _.orderBy(orderedList, ["rating"], [sortingPref[1]])
        }
        else {
            orderedList = _.orderBy(orderedList, [sortingPref[0], "rating"], [sortingPref[1], "desc"])
        }
        if (searchText)
            return _.filter(orderedList, k => {
                if (parseFloat(searchText) > 0.0) {
                    let searchRate = parseFloat(searchText)
                    return k.song.toUpperCase().includes(searchText.toUpperCase()) || (k.internalRate === searchRate)
                }
                else return k.song.toUpperCase().includes(searchText.toUpperCase())
            })
        else return orderedList
    }, [searchText, sortingPref, selectedLevel, scoreRange])

    const updatedIdSet = useMemo(() => {
        const set = new Set<number>()
        const grp = _.groupBy(ratingList, o => { return o.updatedAt })
        const keyGrp = Object.keys(grp)
        if (keyGrp.length <= 1) return set
        //filter out the first update
        const orderedKey = _.tail(_.sortBy(keyGrp))

        let count = 0
        const max = 15
        for (let i = orderedKey.length - 1; i >= 0; i--) {
            if (count < max) {
                for (let j = 0; j < grp[orderedKey[i]].length; j++) {
                    let id = grp[orderedKey[i]][j].order ?? -1
                    if (id > 0) {
                        set.add(id)
                    }
                    count++
                }
            }
            else break
        }

        return set
    }, [ratingList])

    const Table = () => {
        const _renderArrow = (key: SortingKeys) => {
            return key === sortingPref[0] ? <span className={classNames("ml-1 rotate", { "rotate-0": sortingPref[1] == 'asc', "rotate-180": sortingPref[1] == 'desc' })}><BiSolidUpArrow size={".75rem"} /></span> : null
        }
        const changeSortingPref = (key: SortingKeys) => {
            let opposite: "desc" | "asc" = sortingPref[1] === "asc" ? "desc" : "asc"
            if (key == sortingPref[0]) {
                setSortingPref([key, opposite])
            }
            else {
                setSortingPref([key, "desc"])
            }
        }
        const tableRowsNum = tableRowsNumber < 0 ? sortedRatingList.length : tableRowsNumber
        const _renderHeader = (key: TableHeader, index: number) => {
            switch (key) {
                case "Base":
                    return <div key={key + index} onClick={() => {
                        changeSortingPref("internalRate")
                    }} className="w-[3.25rem]">{"Base"}{_renderArrow('internalRate')}</div>
                case "Youtube":
                    return <div key={key + index} className="w-[1.5rem]"></div>
                case "Script":
                    return <div key={key + index} className="w-[1.5rem]"></div>
                case "Name":
                    return <div key={key + index} onClick={() => {
                        changeSortingPref("song")
                    }} className='flex-1 px-2'>{"Name"}{_renderArrow('song')}</div>
                case "Rank":
                    return <div key={key + index} onClick={() => {
                        changeSortingPref("order")
                    }} className='w-[3.25rem]'>{"Rank"}{_renderArrow('order')}</div>
                case "Rate":
                    return <div key={key + index} onClick={() => {
                        changeSortingPref("rating")
                    }} className={classNames(`w-[3.25rem]`)}>{"Rate"}{_renderArrow('rating')}</div>

                case "Grade":
                    return <div key={key + index} onClick={() => {
                        changeSortingPref("grade")
                    }} className={classNames(`w-[4rem]`)}>{"Grade"}{_renderArrow('grade')}</div>
                case "Score":
                    return <div key={key + index} onClick={() => {
                        changeSortingPref("score")
                    }} className="w-[5.5rem]">{"Score"}{_renderArrow('score')}</div>
            }
        }
        const _renderContent = (key: TableHeader, data: Rating, index: number) => {
            switch (key) {
                case "Base":
                    return <span key={key + index} className="w-[3.25rem]">{toFixedTrunc(data.internalRate, 1)}</span>

                case "Youtube":
                    return <span key={key + index} className='cursor-pointer w-[1.5rem] center' onClick={() => {
                        window.open(`https://www.youtube.com/results?search_query=${data.song}+${data.difficulty}+chunithm`)
                    }}><BiLogoYoutube className="mx-auto" size={"1.25rem"} /></span>
                case "Script":
                    return data.scriptUrl ? <span key={key + index} className='cursor-pointer w-[1.5rem]' onClick={() => {
                        window.open(data.scriptUrl)
                    }}><GiMusicalScore className="mx-auto" size={"1.25rem"} /></span> : null
                case "Name":
                    return <span key={key + index} className='flex-1 px-2'>{data.song}</span>

                case "Rank":
                    return <span key={key + index} className="w-[3.25rem]">{data.order ?? '-'}</span>


                case "Rate":
                    return <span key={key + index} onClick={() => {
                        router.push(`/song/${data.song}`)
                    }} className={classNames(`txt-white  w-[3.25rem] bg-${data.difficulty}`, 'rounded cursor-pointer')}>{data.truncatedRating} </span>

                case "Grade":
                    return <span key={key + index} className="w-[4rem]">{data.grade}</span>
                case "Score":
                    return <span key={key + index} className="w-[5.5rem]">{`${data.score}`}</span>

            }
        }
        return <>
            <div className={classNames("rating-table-header")}>
                {itemList.selected.map((k, i) => {
                    return _renderHeader(k, i)
                })}
                {/* {updatedIdSet.has(k.order ?? -1) && <span className="ml-2 txt-red">▲</span>} */}
            </div >
            {_.map(_.take(sortedRatingList, tableRowsNum), (k, i) => {
                const showTop30Border =
                    i === 29
                    && !searchText
                    && (tableRowsNumber > 30 || tableRowsNumber < 0)
                    && _.isEqual(sortingPref, ['rating', "desc"])
                    && _.isEqual(scoreRange, [0, 1010000])
                    && selectedLevel.name == "All"
                return <div key={k.song + k.order} className={classNames("rating-table-row", { 'border-b border-b-red-700': showTop30Border })} >
                    {itemList.selected.map((key, index) => _renderContent(key, k, index))}
                    {updatedIdSet.has(k.order ?? -1) && <span className="ml-2 txt-red">▲</span>}
                </div >
            })}
        </>
    }

    return <>
        <div className='inner inner-720'  >
            <input value={searchText} onChange={(e) => {
                setSearchText(e.target.value)
            }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title / Base Rate'></input>
        </div>
        <div className='flex justify-around items-center mb-4 form-check'>
            <div className="flex items-center">
                <span>No. of rows: </span>
                <ListBox className="w-[5rem] ml-2" source={tableRowsNumbers} selected={selectedTableRowsNumber} setSelected={setSelectedTableRowsNumber} />
            </div>
            <div className="flex items-center">
                <span>Levels: </span>
                <ListBox className="w-[5rem] ml-2" source={levels} selected={selectedLevel} setSelected={setSelectedLevel} />
            </div>
            <button onClick={() => {
                setIsModalOpen(true)
            }}
                className='btn btn-secondary grid-center btn-icon'>
                <IoMdSettings size={"1.25rem"} /></button>
        </div >

        <div className='rating-table box box-shadow'>
            {ratingList.length > 0 ?
                <Table />
                : <div className='inner-p20 w-full h-full text-left'>
                    <p className='mb10'>
                        {`1. Save the above script into a browser bookmark`}
                    </p>
                    <p className='mb10'>
                        {`2. Open this page (required login) `}<Link href={"https://chunithm-net-eng.com/mobile/home/"}>https://chunithm-net-eng.com/mobile/home/</Link>
                    </p>
                    <p className='mb10'>
                        {`3. click the bookmark and wait for redirecting to this page`}
                    </p>
                </div>}
            <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} save={() => {
                setItemList(tempItemList)
                let scoreRange: any = [...tempScoreRange]
                if (isNaN(parseInt(scoreRange[0]))) {
                    scoreRange[0] = 0
                }
                else if (parseInt(scoreRange[0]) > parseInt(scoreRange[1])) {
                    scoreRange[0] = parseInt(scoreRange[1])
                }
                if (isNaN(parseInt(scoreRange[1]))) {
                    scoreRange[1] = 1010000
                }
                else if (parseInt(scoreRange[0]) > parseInt(scoreRange[1])) {
                    scoreRange[1] = parseInt(scoreRange[0])
                }
                setScoreRange(scoreRange)
                setIsModalOpen(false)
            }}
                closeModal={() => {
                    setTempItemList(itemList)
                    setTempScoreRange(scoreRange)
                    setIsModalOpen(false)
                }}
            >
                <section className="p-5">
                    <h4 className="text-left ml-1 bold">Score Range</h4>
                    <Divider />
                    <div className="flex justify-between items-center p-2">

                        <input autoFocus={false} value={tempScoreRange[0]} onChange={(e) => {
                            let number = parseInt(e.target.value)
                            if (!isNaN(number)) {
                                // if (number > scoreRange[1]) number = scoreRange[1]
                                setTempScoreRange((p) => [number, p[1]])
                            }
                            else {
                                setTempScoreRange((p) => [e.target.value as any, p[1]])
                            }

                        }} className='p-6 box box-shado w-full h-10' inputMode="numeric" placeholder='0'></input>

                        <span className="text-lg mx-2 bold"> ー </span>

                        <input autoFocus={false} value={tempScoreRange[1]} inputMode="numeric" onChange={(e) => {
                            let number = parseInt(e.target.value)
                            if (!isNaN(number)) {
                                // if (number < scoreRange[0]) number = scoreRange[0]
                                setTempScoreRange((p) => [p[0], number])
                            }
                            else {
                                setTempScoreRange((p) => [p[0], e.target.value as any])
                            }

                        }} className='p-6 box w-full h-10' placeholder='1010000'></input>

                    </div>
                </section>
                <section className="p-5">
                    <h4 className="text-left ml-1 bold">Header</h4>
                    <Divider />
                    <DraggableList setItemList={setTempItemList} itemList={tempItemList} />
                </section>
            </Modal>
        </div>
    </>
}

export const RatingTable = ({ ratingList, recentRatingList }: { ratingList: Rating[], recentRatingList: Rating[] }) => {
    const height = recentRatingList.length * 42
    const [searchText, setSearchText] = useState('')
    const router = useRouter()
    const listRef = useRef<List | null>()
    const [tableRowsNumber, setTableRowsNumber] = useState(100)
    const [showTable, setShowTable] = useState(false)
    const sortedRatingList = useMemo(() => {
        const tableRowsNum = tableRowsNumber < 0 ? ratingList.length : tableRowsNumber
        const filteredList = _.take(ratingList, tableRowsNum)
        if (searchText)
            return _.filter(_.orderBy(filteredList, ['rate'], ['desc']), k => {
                if (parseFloat(searchText) > 0.0) {
                    let searchRate = parseFloat(searchText)
                    return k.song.toUpperCase().includes(searchText.toUpperCase()) || (k.internalRate === searchRate)
                }
                else return k.song.toUpperCase().includes(searchText.toUpperCase())
            })
        else return (_.orderBy(filteredList, ['rating'], ['desc']))
    }, [searchText, tableRowsNumber])

    useEffect(() => {
        return () => {
            console.log("resize")
            cache.clearAll()
            listRef.current?.recomputeRowHeights()
        }
        // listRef.current?.recomputeGridSize()
    }, [searchText, tableRowsNumber, showTable])

    // useWindowResize(() => {
    //     // alert(1232131231)
    //     cache.clearAll()
    //     listRef.current?.recomputeRowHeights()
    // })



    return <div>
        <div className='flex justify-center items-center mb-4 form-check'>
            <input onChange={(e) => {
                setShowTable(e.target.checked)
            }} checked={showTable} id="recent" className="checkbox" type="checkbox" />
            <label className="mr-2 ml-2 text-sm font-medium text-gray-900 " htmlFor="recent" >Recent Songs</label>
        </div>
        <div className={'rating-table mb-5 box box-shadow !min-h-0 collapse scrollbar-hide'} style={{ 'maxHeight': !showTable ? 0 : `${height}px` }}>

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

        <div className='inner inner-720'  >
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

        <div className='rating-table box box-shadow'>
            {ratingList.length > 0 ?
                <WindowScroller>
                    {({ height, isScrolling, onChildScroll, scrollTop, registerChild }) => (
                        <AutoSizer disableHeight onResize={() => {
                            console.log("auto resize")
                            cache.clearAll()
                            listRef.current?.recomputeRowHeights()
                        }}>
                            {({ width }) => {
                                return <List
                                    width={width}
                                    autoHeight
                                    height={height}
                                    ref={(ref) => { listRef.current = ref }}
                                    isScrolling={isScrolling}
                                    onScroll={onChildScroll}
                                    scrollTop={scrollTop}
                                    rowHeight={cache.rowHeight}
                                    rowCount={sortedRatingList.length}
                                    overscanRowCount={20}
                                    rowRenderer={({ index, key, style, parent }) => {
                                        const k = sortedRatingList[index]

                                        return (
                                            <CellMeasurer
                                                key={key}
                                                cache={cache}
                                                parent={parent}
                                                columnIndex={0}
                                                rowIndex={index}
                                            >
                                                {({ measure, registerChild }) => {
                                                    return <div style={style} className={classNames("rating-table-row-2", { 'border-b': index === 29 && !searchText && (tableRowsNumber > 30 || tableRowsNumber < 0), 'border-b-red-700': index === 29 && !searchText, "bg-gray-300/[.6]": index % 2 === 1 })} >
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

                                </List>

                            }}
                        </AutoSizer>
                    )}
                </WindowScroller >
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
    </div>

}

