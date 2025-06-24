import type { ReactNode } from "react";
import style from "./topBar.module.css";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { resizeTo } from "../../state/view";
import { useLastRoute } from "../../lib/LastRouteProvider";

interface TopBarProps {
    left?: ReactNode;
    right?: ReactNode;
}

const TopBar = ({ left, right }: TopBarProps) => {
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

    return <div className={`flex items-center justify-between border-b border-gray-200 p-2 ${style.dragArea}`} style={{ height: '10%' }}>
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