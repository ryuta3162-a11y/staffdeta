"use client";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  name?: string;
}

const LABELS = ["", "あまり感じない", "やや感じない", "普通", "やや感じる", "とても感じる"];

export function StarRating({ value, onChange, disabled, name }: StarRatingProps) {
  return (
    <div className="star-rating">
      <div
        className="star-rating-stars"
        role="radiogroup"
        aria-label={name || "5段階評価"}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star}つ星`}
            disabled={disabled}
            className={`star-rating-btn ${value >= star ? "star-rating-btn--active" : ""}`}
            onClick={() => onChange(star)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="star-rating-icon">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      <p className="star-rating-label">
        {value > 0 ? LABELS[value] : "タップして評価してください"}
      </p>
    </div>
  );
}
