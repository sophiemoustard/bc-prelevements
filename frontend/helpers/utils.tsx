export const getFixedNumber = (number, toFixedNb) =>
  (Math.round(number * (10 ** toFixedNb)) / (10 ** toFixedNb)).toFixed(toFixedNb);

export const removeSpaces = str => (str ? str.split(' ').join('') : '');
