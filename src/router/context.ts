import { createContext, useContext } from 'react';

export interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

export const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
});

export const useRouter = () => useContext(RouterContext);
