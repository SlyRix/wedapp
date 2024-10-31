import * as React from "react"
import { cn } from "../../lib/utils"

const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(
            "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
            {
                "bg-background text-foreground": variant === "default",
                "bg-destructive/15 text-destructive dark:bg-destructive/15": variant === "destructive",
            },
            className
        )}
        {...props}
    />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

export { Alert, AlertTitle }