import { createRootRoute, getRouterContext, Outlet, useMatch, useMatches } from "@tanstack/react-router";
import { AliveScope } from "react-activation";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { forwardRef, useContext, useRef } from "react";
import { cloneDeep } from "lodash";

const Root = () => {
    const matches = useMatches();
    const match = useMatch({ strict: false });
    const nextMatchIndex = matches.findIndex((d) => d.id === match.id) + 1;
    const nextMatch = matches[nextMatchIndex];

    return (
        <main>
            <AliveScope>
                <AnimatePresence mode="wait">
                    <AnimatedOutlet key={nextMatch.id} />
                </AnimatePresence>
            </AliveScope>
        </main>
    );
};

export const Route = createRootRoute({
    component: Root,
});

const AnimatedOutlet = forwardRef<HTMLDivElement>((_, ref) => {
    const RouterContext = getRouterContext();
    const routerContext = useContext(RouterContext);
    const renderedContext = useRef(routerContext);
    const isPresent = useIsPresent();

    if (isPresent) {
        renderedContext.current = cloneDeep(routerContext);
    }

    return (
        <motion.div
            ref={ref}
            initial={{ y: -100, opacity: 0 }}   // Enter from above
            animate={{ y: 0, opacity: 1 }}      // Settle in place
            exit={{ y: -100, opacity: 0 }}      // Exit up
            transition={{ duration: 0.1 }}
        >
            <RouterContext.Provider value={renderedContext.current}>
                <Outlet />
            </RouterContext.Provider>
        </motion.div>
    );
});