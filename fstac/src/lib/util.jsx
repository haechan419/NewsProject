import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// className을 병합하고 충돌을 해결하는 함수
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}