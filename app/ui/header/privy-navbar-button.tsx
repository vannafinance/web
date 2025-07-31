import { usePrivy} from "@privy-io/react-auth"
import { useEffect, useState } from "react"
import { getShortenedAddress } from "@/app/lib/web3-constants"
import PrivyNetworkDropdown from "./privy-network-dropdown"
import { SunDim } from "@phosphor-icons/react"
import { useDarkMode } from "./use-dark-mode"

export const PrivyNavbarButton = () => {
    const { authenticated, login, logout, user } = usePrivy()
    const [buttonText, setButtonText] = useState("")
    const { toggleDarkMode } = useDarkMode();


    useEffect(() => {
        if (user && user.wallet) {
            setButtonText(getShortenedAddress(user.wallet.address))
        }
    }, [user])

    return <div className="flex gap-4">

        <div className="p-2 border border-neutral-100 dark:border-neutral-700 rounded-lg cursor-pointer dark:text-purple text-baseBlack">
                <SunDim size={24} weight="fill" onClick={toggleDarkMode} />
            </div>
        <div>
            <PrivyNetworkDropdown />
        </div>

        <div>
            {!user && !authenticated && (<button
                className="bg-gradient-to-r from-gradient-1 to-gradient-2 w-40 h-11 text-baseWhite rounded-lg text-base font-semibold"
                onClick={login}
            >
                Connect Wallet
            </button>)}
            {user && user.wallet && authenticated && (
                <button className="bg-gradient-to-r from-gradient-1 to-gradient-2 w-40 h-11 text-baseWhite rounded-lg text-base font-semibold" onClick={logout}>{buttonText}</button>
            )}
        </div>
    </div>
}