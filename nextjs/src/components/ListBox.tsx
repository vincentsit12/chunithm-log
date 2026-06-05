import Image from "next/image";
import React, { Fragment, HtmlHTMLAttributes, SetStateAction } from "react";
import {
  BiSolidUpArrow,
  BiLogoYoutube,
  BiSolidDownArrow,
  BiListCheck,
  BiUpsideDown,
  BiCheck,
} from "react-icons/bi";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import classNames from "classnames";

type Props = {
  source: {
    name: string;
    value: string | number;
  }[];
  selected: {
    name: string;
    value: string | number;
  };
  setSelected: React.Dispatch<SetStateAction<any>>;
} & HtmlHTMLAttributes<HTMLDivElement>;

export default function ListBox({
  className,
  source,
  selected,
  setSelected,
}: Props) {
  return (
    <div className={className ?? "w-24"}>
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <ListboxButton className="relative w-full cursor-default rounded-xl border border-white/10 bg-white/5 py-2 pl-3 pr-8 text-left text-sm font-medium text-slate-100 shadow-sm ring-1 ring-white/5 backdrop-blur-sm transition focus:outline-none focus-visible:border-fuchsia-400/60 focus-visible:ring-2 focus-visible:ring-fuchsia-400/30">
            <span className="block truncate">{selected.name}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <BiSolidDownArrow
                size={"10px"}
                color="#cbd5e1"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="z-20 absolute mt-2 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-brand-panel/95 text-base text-slate-100 shadow-2xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-xl focus:outline-none sm:text-sm">
              {source.map((k, i) => (
                <ListboxOption
                  key={i}
                  className={({ active, selected }) =>
                    classNames(
                      "relative flex cursor-default select-none items-center justify-between rounded-lg px-3 py-2 transition",
                      {
                        "bg-violet-500/20 text-white": active,
                        "text-slate-200": !active && !selected,
                        "bg-white/5 text-cyan-200": selected && !active,
                      },
                    )
                  }
                  value={k}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={classNames("block truncate text-left", {
                          "font-semibold": selected,
                          "font-normal": !selected,
                        })}
                      >
                        {k.name}
                      </span>
                      {selected ? (
                        <span className="inset-y-0 text-cyan-300">
                          <BiCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
