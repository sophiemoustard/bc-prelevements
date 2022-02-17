import { isValidIBAN as _isValidIBAN, isValidBIC as _isValidBIC } from 'ibantools';

export const isValidName = value => value.length <= 70;

export const isValidIBAN = value => _isValidIBAN(value?.split(' ').join(''));

export const isValidBIC = _isValidBIC;

export const isValidICS = value => value && /^[A-Z]{2}[0-9]{2}[0-9A-Z]{3}[0-9A-Z]+$/.test(value);

export const isValidPrefix = value => value && /^[0-9]{3}$/.test(value);
