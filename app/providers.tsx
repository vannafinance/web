'use client'

import React from 'react'
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

function getLibrary(provider: any): Web3Provider {
  return new Web3Provider(provider)
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      {children}
    </Web3ReactProvider>
  )
}
