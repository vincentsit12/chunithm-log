import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import classNames from 'classnames'
import { Button } from '@/components/ui/Button'

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
                        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className={classNames("fixed inset-0 overflow-y-auto")}>
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
                                <Dialog.Panel className="w-full max-w-full md:max-w-xl transform overflow-hidden rounded-[2rem] border border-violet-400/20 bg-brand-panel/90 py-6 text-center align-middle text-slate-100 shadow-glow ring-1 ring-white/10 backdrop-blur transition-all">
                                    {title && <Dialog.Title
                                        as="h3"
                                        className="text-lg font-semibold leading-6 text-white"
                                    >
                                        {title}
                                    </Dialog.Title>}
                                    <div ref={ref} className="mt-2 relative">
                                        {children}
                                    </div>
                                    {showButton && <div className='mt-10 flex w-full flex-wrap items-center justify-center gap-4 px-6'>
                                        <div>
                                            <Button
                                                type="button"
                                                variant='secondary'
                                                onClick={props.closeModal ?? closeModal}
                                            >
                                                Close
                                            </Button>
                                        </div>
                                        <div>
                                            <Button
                                                type="button"
                                                onClick={props.rightBtnCallBack ?? closeModal}
                                            >
                                                {positiveBtnText ?? "Save"}
                                            </Button>
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