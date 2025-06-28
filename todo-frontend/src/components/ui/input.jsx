import * as React from "react";
import { cn } from "../../lib/utils";
import { CalendarIcon } from "lucide-react";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          type === "date" ? "pr-10" : "", // add space for icon
          className
        )}
        ref={ref}
        {...props}
      />
      {type === "date" && (
        <CalendarIcon className="absolute -right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };
