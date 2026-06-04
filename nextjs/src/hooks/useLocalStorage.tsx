import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(val: T, key: string): [T, (value: T) => void] {
    const [value, setValue] = useState<T>(val)
    const saveValue = (value: T) => {
        localStorage.setItem(key, JSON.stringify(value))
        setValue(value)
    }
    useEffect(() => {
        try {
            let savedValue = localStorage.getItem(key)
            if (savedValue) {
                let value = JSON.parse(savedValue)
                setValue(value)
            }
        }
        catch (e) {
            alert(e)
        }

    }, [])
    return [value, saveValue]
}