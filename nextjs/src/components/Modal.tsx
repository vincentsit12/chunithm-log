import React, { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

type Props = {
    isOpen: boolean,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    closeModal?: () => void
    save?: () => void
    title?: string,
    children: React.ReactNode
    closeWhenClickBackDrop?: boolean
}

export default function Modal(props: Props) {
    const { isOpen, setIsOpen, title, children } = props
    const ref = useRef(null)
    function closeModal() {
        setIsOpen(false)
    }
    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" initialFocus={ref} className="relative z-10" onClose={() => {
                    if (props.closeWhenClickBackDrop) setIsOpen(false)
                }}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-full md:max-w-xl transform overflow-hidden rounded-2xl bg-white py-6 text-center align-middle shadow-xl transition-all">
                                    {title && <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        {title}
                                    </Dialog.Title>}
                                    <div ref={ref} className="mt-2 relative">
                                        {children}
                                    </div>
                                    <div className='w-full flex justify-around items-center'>
                                        <div className="mt-10">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={props.closeModal ?? closeModal}
                                            >
                                                Close
                                            </button>
                                        </div>
                                        <div className="mt-10">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={props.save ?? closeModal}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}