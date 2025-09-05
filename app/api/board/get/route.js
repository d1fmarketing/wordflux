import { getBoard } from "../../../lib/board.js";
import { apiSuccess, apiError, withErrorHandling } from "../../../lib/api-utils.js";

export const GET = withErrorHandling(async () => {
  // Ensure we always read the canonical source (DynamoDB if configured)
  const board = await getBoard(true);
  
  if (!board) {
    return apiError('Board not found', 404);
  }
  
  return apiSuccess({ board });
});
