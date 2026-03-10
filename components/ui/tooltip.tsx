import { cn } from "@/lib/utils";
import * as React from "react";

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {}

const TooltipProvider = React.forwardRef<
  HTMLDivElement,
  TooltipProps & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props}>
    {children}
  </div>
));
TooltipProvider.displayName = "TooltipProvider";

export { TooltipProvider };
