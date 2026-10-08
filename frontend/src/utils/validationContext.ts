import { createContext } from 'react'
export const ValidationContext = createContext<ReadonlySet<string>>(new Set())
