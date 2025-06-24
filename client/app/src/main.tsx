import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen'
import { LastRouteProvider } from './lib/LastRouteProvider';

const router = createRouter({
  routeTree,
  scrollRestoration: true,
});

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <RouterProvider router={router} />
  )
}