import Image from "next/image";
import React from "react";

type Props = {};

export default function LoadingView({}: Props) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-slate-950/10 shadow-lg  backdrop-blur-sm">
        <Image
          alt="loading"
          width={100}
          height={100}
          priority
          src={"/pen_sleep_apng.png"}
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>
  );
}
