import { useState, useLayoutEffect, useEffect } from "react";


export const useWindowResize = (callback: () => void) => {

    useEffect(() => {

        window.addEventListener("resize", callback);

        return () => window.removeEventListener("resize", callback);
    }, []);

};