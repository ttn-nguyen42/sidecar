import { create } from "zustand";
import { ViewHeight, ViewWidth } from "./const";

type ViewStateStore = {
  height: number;
  width: number;
  setHeight: (height: number) => void;
  setWidth: (width: number) => void;
};

const useViewStore = create<ViewStateStore>((set) => ({
  height: ViewHeight.MENU,
  width: ViewWidth.FULL_WIDTH,
  setHeight: (height: number) => {
    set({ height });
  },
  setWidth: (width: number) => {
    set({ width });
  },
}));

export { useViewStore };
