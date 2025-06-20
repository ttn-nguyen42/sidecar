import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AliveScope } from "react-activation";

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    return (
        <AliveScope>
            <Outlet />
        </AliveScope>
    );
}