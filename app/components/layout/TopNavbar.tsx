"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNavbar() {
  return (
    <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-2">
        <svg
          width="100"
          height="24"
          viewBox="0 0 1466 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-foreground"
        >
          <path
            d="M572.94 125.229C516.275 125.229 495.398 161.25 495.398 206.734C495.398 252.218 516.275 288.239 572.94 288.239C620.36 288.239 642.132 267.176 646.605 229.629H603.062C600.08 242.45 591.431 248.86 572.94 248.86C549.976 248.86 539.538 233.292 539.538 206.734C539.538 180.176 549.976 164.608 572.94 164.608C591.431 164.608 600.08 171.018 603.062 183.839H646.605C642.132 146.292 620.36 125.229 572.94 125.229Z"
            fill="currentColor"
          />
          <path
            d="M759.537 168.576V125.84C757.748 125.534 752.976 125.229 751.187 125.229C727.029 125.229 714.205 136.829 708.24 149.04V129.808H667.382V283.66H710.924V196.966C710.924 177.124 722.854 167.355 740.45 167.355C747.608 167.355 753.573 167.661 759.537 168.576Z"
            fill="currentColor"
          />
          <path
            d="M834.707 129.808V84.9346H791.165V129.808H767.902V165.829H791.165V232.376C791.165 269.618 812.339 286.408 848.426 286.408C856.18 286.408 863.338 285.797 869.899 284.271V248.25C864.829 249.166 861.25 249.471 857.075 249.471C843.058 249.471 834.707 245.197 834.707 228.713V165.829H869.899V129.808H834.707Z"
            fill="currentColor"
          />
          <path
            d="M874.962 283.66H925.663L956.978 234.208L988.293 283.66H1038.99L986.504 205.818L1038.99 129.808H988.293L956.978 177.429L925.663 129.808H874.962L927.452 205.818L874.962 283.66Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M298.552 196.298L310.437 162.963H350.109L359.581 135.476H320.237L333.57 98.0791H305.83L292.497 135.476L259.014 135.476L249.281 162.963H282.697L270.812 196.298H298.552Z"
            fill="currentColor"
            fillOpacity="0.4"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M200.463 98H228.218L214.878 135.413H246.753L237.016 162.911H205.073L191.732 200.326H191.68L178.34 237.739H256.545L267.06 208.247H294.815L284.3 237.739H323.664L314.188 265.237H274.495L261.154 302.651H233.4L246.74 265.237H168.535L155.194 302.651H127.44L140.78 265.237H102L111.476 237.739H150.585L163.925 200.326H163.978L177.318 162.911H138.538L148.014 135.413H187.123L200.463 98Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}