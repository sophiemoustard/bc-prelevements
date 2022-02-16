import { VALIDATION_ERROR } from "../data/constants";

export const throwValidationError = (message) => {
  const error = new Error(message)
  error.name = VALIDATION_ERROR;
  throw error;
}

export const addMessageAndThrow = (e, addedMessage) => {
  if (e.name !== VALIDATION_ERROR) e.message = e.message.concat('\n\t', addedMessage);
  throw e;
}
