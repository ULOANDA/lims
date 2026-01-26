import { Outlet } from "react-router-dom";

export function LibraryPage() {
  return (
    <div className="h-full p-6">
      <Outlet />
    </div>
  );
}
