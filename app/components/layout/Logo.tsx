"use client";

import { useRouter } from "next/navigation";

export function Logo() {
  const router = useRouter();

  return (
    <div 
      className="h-[72px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => router.push("/")}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 222 177"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M169.145 84.591L179.373 55.904H213.513L221.663 32.2501H187.806L199.28 0.067627H175.408L163.934 32.2501L135.12 32.2501L126.744 55.904H155.501L145.273 84.591H169.145Z"
          fill="currentColor"
          fillOpacity="0.4"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M84.7331 0H108.618L97.1376 32.1961H124.568L116.189 55.86H88.7L77.2198 88.0571H77.1746L65.6946 120.253H132.995L142.044 94.8743H165.929L156.879 120.253H190.754L182.6 143.917H148.442L136.962 176.114H113.077L124.557 143.917H57.257L45.7768 176.114H21.8923L33.3725 143.917H0L8.1547 120.253H41.8102L53.2901 88.0571H53.3353L64.8156 55.86H31.443L39.5977 32.1961H73.2532L84.7331 0Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}