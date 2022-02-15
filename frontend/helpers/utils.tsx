export const throwValidationError = (message) => {
  const error = new Error(message)
    error.name = 'validation error'
    throw error;
}
