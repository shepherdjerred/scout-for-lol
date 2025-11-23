import React from "react";

type StarRatingProps = {
  rating: number | undefined;
  onRate?: (rating: 1 | 2 | 3 | 4) => void;
  size?: "small" | "medium" | "large";
  readonly?: boolean;
};

const SIZES = {
  small: 16,
  medium: 24,
  large: 32,
};

export function StarRating({ rating, onRate, size = "medium", readonly = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayRating = hoverRating ?? rating ?? 0;
  const isInteractive = !readonly && onRate !== undefined;
  const starSize = SIZES[size];

  const handleClick = (starNumber: number) => {
    if (!isInteractive) return;

    if (starNumber >= 1 && starNumber <= 4) {
      onRate?.(starNumber as 1 | 2 | 3 | 4);
    }
  };

  return (
    <div
      className="inline-flex gap-1 items-center"
      onMouseLeave={() => {
        if (isInteractive) setHoverRating(null);
      }}
    >
      {[1, 2, 3, 4].map((starNumber) => {
        const isFilled = starNumber <= displayRating;

        return (
          <button
            key={starNumber}
            type="button"
            onClick={() => {
              handleClick(starNumber);
            }}
            onMouseEnter={() => {
              if (isInteractive) setHoverRating(starNumber);
            }}
            disabled={!isInteractive}
            className="border-none bg-transparent p-0 transition-transform disabled:cursor-default enabled:cursor-pointer enabled:hover:scale-110"
            aria-label={`Rate ${starNumber.toString()} star${starNumber > 1 ? "s" : ""}`}
          >
            <svg
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              fill={isFilled ? "#fbbf24" : "#d1d5db"}
              stroke={isFilled ? "#f59e0b" : "#9ca3af"}
              strokeWidth="1.5"
              className="transition-all"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
      {rating !== undefined && rating > 0 && <span className="ml-2 text-sm text-gray-600 font-medium">{rating}/4</span>}
    </div>
  );
}
