import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-white/10 text-foreground hover:bg-white/20",
        outline: "border-border bg-transparent text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>((props, ref) => {
  const { className, variant, asChild = false, ...rest } = props;
  const Comp = asChild ? Slot : "div";
  return <Comp ref={ref} className={cn(badgeVariants({ variant }), className)} {...rest} />;
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
