import { VALIDATION_ERROR } from "../data/constants";

export const throwValidationError = (message) => {
  const error = new Error(message)
  error.name = VALIDATION_ERROR;
  throw error;
}

export const appendAndThrow = (e, appendMessage) => {
  if (e.name !== VALIDATION_ERROR) e.message = e.message.concat('\n\t', appendMessage);
  throw e;
}
