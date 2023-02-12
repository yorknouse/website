/**
 * Throws an error with the desired message.
 * @param {string} message The error message.
 */
const fail = (message: string) => {
  throw new Error(message);
};

export { fail };
