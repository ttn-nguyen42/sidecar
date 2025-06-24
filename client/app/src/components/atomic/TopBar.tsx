import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { resizeTo } from "../../state/view";
import { useLastRoute } from "../../lib/LastRouteProvider";

interface TopBarProps {
    left?: ReactNode;
    right?: ReactNode;
    style?: React.CSSProperties;
}

const TopBar = ({ left, right, style }: TopBarProps) => {
    const location = useRouter();
    const lastRoute = useLastRoute();

    const toMenu = () => {
        const lastDimension = lastRoute.getLastDimension();
        if (lastDimension) {
            resizeTo(lastDimension.width, lastDimension.height)
        }
        const prev = lastRoute.goBack();
        if (prev) {
            location.history.push(prev);
        } else {
            location.history.back();
        }
    }

    return <div className={`flex items-center justify-between border-b border-gray-200 p-2`} style={style}>
        <div className='flex justify-start items-center gap-2'>
            <Button size={'icon'} variant={'ghost'} onClick={toMenu} className='size-8'>
                <ArrowLeft onClick={toMenu} />
            </Button>
            {left}
        </div>
        <div className='flex justify-end items-center gap-2'>
            {right}
        </div>
    </div>
}

export default TopBar;