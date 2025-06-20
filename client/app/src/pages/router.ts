import type { NavigateFunction } from "react-router";
import { resizeTo } from "../state/view";
import { ChatDimensions, MenuDimensions } from "./dimensions";

const moveToMenu = (navigate: NavigateFunction) => {
  resizeTo(MenuDimensions.width, MenuDimensions.height, () => {
    navigate("/");
  });
};

const moveToChat = (navigate: NavigateFunction) => {
  resizeTo(ChatDimensions.width, ChatDimensions.height, () => {
    navigate("/chat");
  });
};

export { moveToMenu, moveToChat };
