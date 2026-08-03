import { Outlet } from 'react-router-dom';

/** Minimal layout — no chrome, used for Splash/Welcome screens */
export function EmptyLayout() {
  return <Outlet />;
}
