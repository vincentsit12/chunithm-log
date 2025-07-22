import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import classNames from 'classnames'

export type ModalProps = {
    isOpen: boolean,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    closeModal?: () => void
    rightBtnCallBack?: () => void
    showButton?: boolean
    title?: string,
    positiveBtnText?: string,
    children: React.ReactNode
    closeWhenClickBackDrop?: boolean
}

export default function Modal(props: ModalProps) {
    const { isOpen, setIsOpen, title, children, positiveBtnText, showButton = true } = props
    const ref = useRef(null)
    function closeModal() {
        setIsOpen(false)
    }

    // const isIos = Boolean(window?.navigator.userAgent.match(/iPhone|iPad|iPod/i))


    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" initialFocus={ref} className="relative z-[999]" onClose={() => {
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
                        <div className="fixed top-0 left-0 w-full h-full inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className={classNames("fixed overflow-y-auto inset-0", { "absolute-center w-full h-full": true })}>
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
                                    {showButton && <div className='w-full flex justify-around items-center'>
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
                                                onClick={props.rightBtnCallBack ?? closeModal}
                                            >
                                                {positiveBtnText ?? "Save"}
                                            </button>
                                        </div>
                                    </div>}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
        // <div className="fixed top-8 left-8 w-96 h-96 bg-red-400"> 12312312323</div>
    )
}