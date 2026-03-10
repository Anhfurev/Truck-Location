import * as React from "react";

export function Toaster() {
  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md">
      {/* Toast notifications will be rendered here */}
    </div>
  );
}

export default Toaster;
