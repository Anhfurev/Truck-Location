import * as React from "react";

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  action?: React.ReactNode;
}

export type ToastActionElement = React.ReactNode;

export const Toast = React.forwardRef<
  HTMLDivElement,
  ToastProps & React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-md border px-4 py-3 text-sm ${className}`}
    {...props}
  />
));
Toast.displayName = "Toast";

export const ToastTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={`font-semibold ${className}`} {...props} />
));
ToastTitle.displayName = "ToastTitle";

export const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm opacity-90 ${className}`} {...props} />
));
ToastDescription.displayName = "ToastDescription";
