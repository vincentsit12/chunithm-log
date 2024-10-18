import Image from 'next/image'
import React, { Fragment, HtmlHTMLAttributes, SetStateAction } from 'react'
import { BiSolidUpArrow, BiLogoYoutube, BiSolidDownArrow, BiListCheck, BiUpsideDown, BiCheck } from "react-icons/bi";
import { Listbox, Transition } from '@headlessui/react'

type Props = {
    source: {
        name: string;
        value: number;
    }[],
    selected: {
        name: string;
        value: number;
    },
    setSelected: React.Dispatch<SetStateAction<{
        name: string;
        value: number;
    }>>,
} & HtmlHTMLAttributes<HTMLDivElement>

export default function ListBox({ className, source, selected, setSelected }: Props) {
    return (
        <div className={className ?? "w-24"}>
            <Listbox value={selected} onChange={setSelected}>
                <div className="relative">
                    <Listbox.Button className="relative cursor-default rounded-lg bg-white w-full py-2 p-3 pr-8 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                        <span className="block truncate">{selected.name}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <BiSolidDownArrow
                                size={"10px"}
                                color="black"
                                aria-hidden="true" 
                            />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className=" z-20 absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white  text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {source.map((k, i) => (
                                <Listbox.Option
                                    key={i}
                                    className={({ active }) =>
                                        `relative cursor-default select-none flex justify-between items-center py-2 px-2  ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                        }`
                                    }
                                    value={k}
                                >
                                    {({ selected }) => (
                                        <>
                                            <span
                                                className={`text-left block truncate ${selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                            >
                                                {k.name}
                                            </span>
                                            {selected ? (
                                                <span className=" inset-y-0 text-amber-600">
                                                    <BiCheck className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    )
}


