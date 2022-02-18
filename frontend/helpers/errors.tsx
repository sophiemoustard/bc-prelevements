import { VALIDATION_ERROR } from "../data/constants";

export const throwValidationError = (message) => {
  const error = new Error(message)
  error.name = VALIDATION_ERROR;
  throw error;
};

export const addMessageAndThrow = (error, addedMessage) => {
  const e = new Error();
  e.name = error.name;
  e.message = error.name === VALIDATION_ERROR ? error.message : error.message.concat('\n\t', addedMessage);

  throw e;
};
