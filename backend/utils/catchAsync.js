/**
 * Wrapper function to catch errors in async functions
 * @param {Function} fn - Async function to be wrapped
 * @returns {Function} Express middleware function with error handling
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
