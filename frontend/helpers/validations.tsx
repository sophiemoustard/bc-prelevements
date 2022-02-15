import { isValidIBAN, isValidBIC } from 'ibantools';

export const isInvalidIBAN = value => !value || !isValidIBAN(value.split(' ').join(''));

export const isInvalidBIC = value => !value || !isValidBIC(value);

export const isInvalidICS = value => !value || !/^[A-Z]{2}[0-9]{2}[A-Z]{3}[0-9]{6}$/.test(value);

export const isInvalidPrefix = value => !value || !/^[0-9]{3}$/.test(value);
