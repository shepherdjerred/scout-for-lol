/**
 * Result rating component (star rating and notes)
 */
import { StarRating } from "./star-rating";

type ResultRatingProps = {
  rating: 1 | 2 | 3 | 4 | undefined;
  notes: string;
  onRatingChange: (rating: 1 | 2 | 3 | 4) => Promise<void>;
  onNotesChange: (notes: string) => Promise<void>;
};

export function ResultRating({ rating, notes, onRatingChange, onNotesChange }: ResultRatingProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rate this generation</h3>
      <div className="mb-3">
        <StarRating
          rating={rating}
          onRate={(newRating) => {
            void (async () => {
              try {
                await onRatingChange(newRating);
              } catch {
                // Error handling is done in the parent component
              }
            })();
          }}
          size="large"
        />
      </div>
      <div>
        <label htmlFor="rating-notes" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Notes (optional)
        </label>
        <textarea
          id="rating-notes"
          value={notes}
          onChange={(e) => {
            void (async () => {
              try {
                await onNotesChange(e.target.value);
              } catch {
                // Error handling is done in the parent component
              }
            })();
          }}
          placeholder="What did you like or dislike about this generation?"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-vertical placeholder:text-gray-400 dark:placeholder:text-gray-500"
          rows={2}
        />
      </div>
    </div>
  );
}
