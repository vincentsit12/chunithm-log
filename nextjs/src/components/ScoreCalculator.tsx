import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useScoreCalculator } from 'utils/hooks/useScoreCalculator';
import { usePrevious } from 'utils/hooks/usePrevious';
import { useSession } from 'next-auth/react';
import { AiFillPlusCircle, AiFillMinusCircle } from 'react-icons/ai'
import { isNumber } from 'lodash';
import { calculateSingleSongRating, toFixedTrunc } from 'utils/calculateRating';

type Props = {
    rate: number,
    score: number,
    combo: number,
    haveScore: boolean
}

const renderColor = (key: string) => {
    switch (key) {
        case 'CRITICAL JUSTICE':
            return '#f2d218'
        case 'JUSTICE':
            return '#ee9105'
        case 'GOOD':
            return '#26ff0f'
        case 'MISS':
            return '#cecece'
        default:
            return '#cecece'
    }
}

const SdSlider = ({ value, max, onChange, label }: { value: number, max: number, onChange: (v: any) => void, label: string }) => {
    return <div className='my-4'>
        <div className={`flex  ml-1 md:mb-3 rounded-md items-start text-sm`} >
            <span className='px-2 py-1 tc rounded-xl w-1/3' style={{ backgroundColor: renderColor(label) }}>{label}</span></div>
        <div className='flex justify-center items-center'>
            <div className='w-2/3 px-3 ' >
                <Slider railStyle={{ backgroundColor: '#FCFCFC' }}
                    value={value}
                    max={max}
                    onChange={(v) => onChange(v)} />
            </div>

            <input onKeyPress={(e) => !/[0-9%]/.test(e.key) && e.preventDefault()} onChange={(v) => {
                if (v.target.value.endsWith("%")) {
                    onChange(Math.trunc(parseInt(v.target.value) * max * 0.01))
                }
                else if (v.target.value === '') {
                    onChange('')
                }
                else if (!isNaN(parseInt(v.target.value))) {
                    onChange(v.target.value)
                }
            }} className='w-1/6 tc mx-4' value={value}></input>
            <div className="text-sm flex-1 justify-around  sm:flex ">
                <button className=' mb-1 md:mb-0' onClick={() => {
                    if (value + 1 <= max)
                        onChange(value + 1)
                }}>
                    <AiFillPlusCircle color='#21618C' size={'1.75rem'} />
                </button>
                <button className='' onClick={() => {
                    if (value - 1 >= 0)
                        onChange(value - 1)
                }}>
                    <AiFillMinusCircle color='#21618C' size={'1.75rem'} />
                </button>
            </div>
        </div>
    </div>
}

export const ScoreCalculator: React.FC<Props> = ({ rate, score, combo, haveScore }) => {
    const { data: session, status } = useSession()
    const [baseScore, setBaseScore] = useState(1010000)
    const [scoreDetails, setScoreDetails] = useState<number[]>([combo, 0, 0, 0])
    useEffect(() => {
        setScoreDetails([combo, 0, 0, 0])
    }, [combo])
    const adjustScoreDetails = (scoreDetails: number[], value: number, index: number) => {
        let temp = [...scoreDetails]

        if (!isNumber(value)) {
            let x: any = value
            if (x !== '') {
                temp[index] = parseInt(x)
            } else temp[index] = value
        } else temp[index] = value
        let diff = Math.abs(temp[index] - scoreDetails[index])
        //number is increasing
        if (temp[index] - scoreDetails[index] > 0) {
            let i = index === 0 ? 1 : 0
            while (diff > 0) {

                if (temp[i] - diff > 0) {
                    temp[i] -= diff
                    diff = 0
                }
                else if (temp[i] > 0) {
                    diff -= temp[i]
                    temp[i] = 0
                }
                else {
                    i = (i + 1) % 4
                }
            }
        }
        //number is decreasing
        else {
            let i = index === 0 ? 1 : 0

            while (diff > 0) {

                if (temp[i] + diff <= combo) {
                    temp[i] += diff
                    diff = 0
                }
                else if (temp[i] < combo) {
                    diff -= combo - temp[i]
                    temp[i] = combo
                }
                else {
                    i = (i + 1) % 4
                }
            }
        }
        return (temp)
    }

    const calculateTotalScore = (scoreDetails: number[]) => {
        return Math.trunc((scoreDetails[0] * 1.01 + scoreDetails[1] + scoreDetails[2] * .5) / combo * 1000000)
    }

    const generateScoreDetailByScore = (score: number) => {
        const target = score
        let scoreDetails = [combo, 0, 0, 0]
        // const scoreUnit = [unit * .01, unit * .5, unit]


        let i = 3;
        while (i > 0 || score <= target) {
            scoreDetails[0] = scoreDetails[0] - 1
            scoreDetails[i] = scoreDetails[i] + 1
            let predictedScroe = calculateTotalScore(scoreDetails)

            if (predictedScroe > target) {
                score = predictedScroe
            }
            else if (predictedScroe === target) {
                i--
            }
            else {
                scoreDetails[0] = scoreDetails[0] + 1
                scoreDetails[i] = scoreDetails[i] - 1
                i--
            }
        }


        setScoreDetails(scoreDetails)
    }

    const onChange = (v: number, index: number) => {

        setScoreDetails(scoreDetails => {
            let adjustedScoreDetails = adjustScoreDetails(scoreDetails, v, index)
            return adjustedScoreDetails
        })
    }

    return (
        <div className=''>
            <h5 className='mb-5'>Score calculator</h5>
            <div></div>
            <div></div>
            <div></div>
            <div className='flex items-center justify-center mb-5'>
                {session && haveScore && <span onClick={() => {
                    // setBaseScore(baseScore)
                    generateScoreDetailByScore(score)
                }} className='m-2 btn-secondary cursor-pointer rounded-xl p-2'>Your Score</span>}
                <span onClick={() => {
                    generateScoreDetailByScore(1009000)
                }} className='m-2 btn-secondary cursor-pointer rounded-xl p-2'>SSS+</span>
                <span onClick={() => {
                    generateScoreDetailByScore(1007500)
                }} className='m-2 btn-secondary cursor-pointer rounded-xl p-2'>SSS</span>
                <span onClick={() => {
                    generateScoreDetailByScore(1005000)
                }} className='m-2 btn-secondary cursor-pointer rounded-xl p-2'>SS+</span>
                <span onClick={() => {
                    generateScoreDetailByScore(1000000)
                }} className='m-2 btn-secondary cursor-pointer rounded-xl p-2'>SS</span>


            </div>
            <div className='flex justify-center space-x-5'>
                <div>{`Score : ${calculateTotalScore(scoreDetails)}`}</div>
                <div>{`Rate : ${toFixedTrunc(calculateSingleSongRating(rate, calculateTotalScore(scoreDetails)),2)}`}</div>
            </div>

            <div className='w-full '>
                <SdSlider value={scoreDetails[0]} max={combo} onChange={(v) => { onChange(v as number, 0) }} label='CRITICAL JUSTICE' />
                <SdSlider value={scoreDetails[1]} max={combo} onChange={(v) => { onChange(v as number, 1) }} label='JUSTICE' />
                <SdSlider value={scoreDetails[2]} max={combo} onChange={(v) => { onChange(v as number, 2) }} label='GOOD' />
                <SdSlider value={scoreDetails[3]} max={combo} onChange={(v) => { onChange(v as number, 3) }} label='MISS' />
            </div>
        </div>
    )
}