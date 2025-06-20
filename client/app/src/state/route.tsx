import { createBrowserRouter } from "react-router";
import MenuPage from "../pages/MenuPage";
import ChatPage from "../pages/ChatPage";
import NotePage from "../pages/NotePage";
import TaskBoardPage from "../pages/TaskBoardPage";
import SettingsPage from "../pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MenuPage />,
  },
  {
    path: "/chat",
    element: <ChatPage />,
  },
  {
    path: "/note",
    element: <NotePage />,
  },
  {
    path: "/task_board",
    element: <TaskBoardPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
]);