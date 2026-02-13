import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config();

// Type definitions
interface ParseJSONResult {
    isJSON: boolean;
    data?: any;
}

interface GroupedData<T> {
    [key: string]: any;
    groupedData: T[];
}

interface NumberRange {
    min: number;
    max: number;
}

// Event type for onlynum function (for React environment)
// If not using React, replace with: (e: any) => void
type InputChangeEvent = {
    target: {
        value: string;
    };
};

// Encryption functions
export const encryptPasswordFun = (str: string): string => {
    if (!str) throw new Error('No string provided for encryption');
    if (!process.env.passwordKey) throw new Error('No encryption key provided');
    return CryptoJS.AES.encrypt(str, process.env.passwordKey).toString();
};

export const decryptPasswordFun = (cipherText: string): string => {
    if (!cipherText) throw new Error('No cipher text provided for decryption');
    if (!process.env.passwordKey) throw new Error('No decryption key provided');
    const bytes = CryptoJS.AES.decrypt(cipherText, process.env.passwordKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// Array helper functions
export const toArray = <T>(array: T | T[]): T[] => Array.isArray(array) ? array : [];

export const isArray = (array: any): boolean => Array.isArray(array);

// Date helper functions
export const isValidDate = (dateString: string): boolean => {
    const timestamp = Date.parse(dateString);
    return !isNaN(timestamp);
};

export const LocalDate = (dateObj?: string | Date): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getDaysBetween = (invoiceDateStr: string, currentDateStr: string = new Date().toISOString()): number => {
    const invoiceDate = new Date(invoiceDateStr);
    const currentDate = new Date(currentDateStr);

    // Get UTC midnight for both dates to avoid timezone discrepancies
    invoiceDate.setUTCHours(0, 0, 0, 0);
    currentDate.setUTCHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffInMs = currentDate.getTime() - invoiceDate.getTime();
    const diffInDays = Math.floor(diffInMs / msPerDay);

    return diffInDays;
};

export const getIndianTime = (dateString?: string | Date): string => {
    const date = dateString ? new Date(dateString) : new Date();

    const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
        hour12: false
    };

    const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);

    const get = (type: string): string =>
        parts.find(p => p.type === type)?.value ?? "";

    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}.${get("fractionalSecond")}`;
};

export const addFiveThirty = (dateStr: string): string => {
    const iso = dateStr.replace(" ", "T");
    const baseDate = new Date(iso);
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(baseDate.getTime() + IST_OFFSET_MS);

    const pad = (n: number, size: number = 2): string => String(n).padStart(size, "0");

    return `${istDate.getFullYear()}-${pad(istDate.getMonth() + 1)}-${pad(
        istDate.getDate()
    )} ${pad(istDate.getHours())}:${pad(
        istDate.getMinutes()
    )}:${pad(istDate.getSeconds())}.${pad(istDate.getMilliseconds(), 3)}`;
};

export const LocalDateTime = (): string => {
    const now = new Date();
    const utcTime = now.getTime();
    const istOffsetInMilliseconds = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(utcTime + istOffsetInMilliseconds);
    return istTime.toISOString();
};

export const LocalDateWithTime = (dateObj?: string | Date): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

export const LocalTime = (dateObj?: string | Date): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

export const UTCDateWithTime = (dateObj?: string | Date): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toLocaleString('en-US', {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export const getMonth = (date?: Date): string => {
    const dateObj = date ? date : new Date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

export const TimeDisplay = (dateObj: string | Date): string => {
    const reqTime = new Date(dateObj);
    let hours = reqTime.getHours();
    const minutes = reqTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return hours + ':' + minutesStr + ' ' + ampm;
};

export const extractHHMM = (dateObj: string | Date): string => {
    const reqTime = new Date(dateObj);
    const hours = reqTime.getUTCHours();
    const minutes = reqTime.getUTCMinutes();
    const hourStr = hours < 10 ? '0' + hours : hours;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return hourStr + ':' + minutesStr;
};

export const formatTime24 = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);

    let hours12 = hours % 12;
    hours12 = hours12 || 12;
    const period = hours < 12 ? 'AM' : 'PM';
    const formattedHours = hours12 < 10 ? '0' + hours12 : hours12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${period}`;
};

export const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const UTCTime = (isoString: string): string => {
    const date = new Date(isoString);

    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return hours + ':' + minutesStr + ' ' + ampm;
};

export const timeToDate = (time?: string): Date => {
    if (!time) {
        console.error("No time input provided.");
        return new Date(Date.UTC(1970, 0, 1, 12, 0, 0));
    }

    const [hours, minutes] = time.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
};

export const convertToTimeObject = (timeString?: string): string => {
    const [hours = 0, minutes = 0, seconds = 0] = timeString 
        ? timeString.split(':').map(Number) 
        : [0, 0, 0];

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(seconds);
    date.setMilliseconds(0);

    return LocalTime(date);
};

export const getPreviousDate = (days?: string | number): string => {
    const num = days ? Number(days) : 1;
    return new Date(new Date().setDate(new Date().getDate() - num)).toISOString().split('T')[0];
};

export const firstDayOfMonth = (): string => {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
};

export const ISOString = (dateObj?: string | Date): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toISOString().split('T')[0];
};

export const timeDuration = (startDate: string | Date, endDate: string | Date): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num: number): string => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const customTimeDifference = (startTime: string, endTime: string): string => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const start = new Date(1970, 0, 1, startHours, startMinutes);
    const end = new Date(1970, 0, 1, endHours, endMinutes);

    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const pad = (num: number): string => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}`;
};

export const timeDifferenceHHMM = (startDate: string | Date, endDate: string | Date): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const pad = (num: number): string => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}`;
};

export const formatDateForDatetimeLocal = (date: Date): string => {
    try {
        const pad = (num: number): string => num?.toString().padStart(2, '0');

        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        console.log('Error in formatDateForDatetimeLocal function: ', e);
        return formatDateForDatetimeLocal(new Date());
    }
};

export const convertUTCToLocal = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString + "Z"); // Append 'Z' to indicate UTC time
    return utcDate.toLocaleString();
};

// Event handler function - Generic version that works without React
export const onlynum = (e: InputChangeEvent): void => {
    const value = e.target.value;
    const newValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    e.target.value = newValue;
};

// Number comparison functions
export const isEqualNumber = (a: any, b: any): boolean => {
    return Number(a) === Number(b);
};

export const isEqualObject = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) {
        return true;
    }

    if (obj1 == null || typeof obj1 !== 'object' ||
        obj2 == null || typeof obj2 !== 'object') {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if (!keys2.includes(key) || !isEqualObject(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
};

export const isGraterNumber = (a: any, b: any): boolean => {
    return Number(a) > Number(b);
};

export const isGraterOrEqual = (a: any, b: any): boolean => {
    return Number(a) >= Number(b);
};

export const isLesserNumber = (a: any, b: any): boolean => {
    return Number(a) < Number(b);
};

export const isLesserOrEqual = (a: any, b: any): boolean => {
    return Number(a) <= Number(b);
};

// Number formatting functions
export const NumberFormat = (num: any): string => {
    return Number(num).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const createPadString = (number: number | string, padLength: number = 0): string => {
    const numberStr = number.toString();
    return numberStr.padStart(padLength, '0');
};

export const limitFractionDigits = (num: any = 0, maxFractionDigits: number = 2): number => {
    const factor = Math.pow(10, maxFractionDigits);
    return Math.round(Number(num) * factor) / factor;
};

export const toNumber = (value: any): number => {
    if (!value) return 0;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/,/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === 'number' ? value : 0;
};

export const RoundNumber = (num: any): string | number => {
    return checkIsNumber(num) ? Number(num).toFixed(2) : 0;
};

// Arithmetic functions
export const Addition = (a: any, b: any): number => limitFractionDigits(Number(a) + Number(b));
export const Subraction = (a: any, b: any): number => limitFractionDigits(Number(a) - Number(b));
export const Multiplication = (a: any, b: any): number => limitFractionDigits(Number(a || 0) * Number(b || 0));
export const Division = (a: any, b: any): number => limitFractionDigits(b != 0 ? Number(a || 0) / Number(b || 1) : 0);

// String manipulation functions
export const trimText = (text: string = '', replaceWith: string = '_'): string => 
    String(text).trim().replace(/\s+/g, replaceWith ?? '_');

export const filterableText = (text: string): string => {
    try {
        return String(trimText(text, ' ')).toLowerCase();
    } catch (e) {
        console.log('Error while convert to filterable text:', e);
        return '';
    }
};

export const stringCompare = (str1: string, str2: string): boolean => 
    filterableText(str1) === filterableText(str2);

export const validValue = (val: any): any => {
    return Boolean(val) ? val : '';
};

export const numberToWords = (prop: any): string => {
    const number = Number(prop);
    const singleDigits: string[] = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens: string[] = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens: string[] = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands: string[] = ['', ' Thousand', ' Lakhs'];

    if (number < 10) {
        return singleDigits[number];
    } else if (number < 20) {
        return teens[number - 10];
    } else if (number < 100) {
        const tenDigit = Math.floor(number / 10);
        const singleDigit = number % 10;
        return tens[tenDigit] + (singleDigit !== 0 ? ' ' + singleDigits[singleDigit] : '');
    } else if (number < 1000) {
        const hundredDigit = Math.floor(number / 100);
        const remainingDigits = number % 100;
        return singleDigits[hundredDigit] + ' Hundred' + (remainingDigits !== 0 ? ' and ' + numberToWords(remainingDigits) : '');
    } else if (number < 100000) {
        const thousandDigit = Math.floor(number / 1000);
        const remainingDigits = number % 1000;
        return numberToWords(thousandDigit) + thousands[1] + (remainingDigits !== 0 ? ', ' + numberToWords(remainingDigits) : '');
    } else if (number < 10000000) {
        const lakhDigit = Math.floor(number / 100000);
        const remainingDigits = number % 100000;
        return numberToWords(lakhDigit) + thousands[2] + (remainingDigits !== 0 ? ', ' + numberToWords(remainingDigits) : '');
    } else {
        return 'Number is too large';
    }
};

export const createAbbreviation = (sentence: string): string => {
    return sentence
        .split(' ')
        .map(word => word[0])
        .filter(char => /[a-zA-Z]/.test(char))
        .join('')
        .toUpperCase();
};

// Validation functions
export const checkIsNumber = (num: any): boolean => {
    return (num !== '' && num !== null && num !== undefined) ? !isNaN(num) : false;
};

export const isValidNumber = (num: any): boolean => {
    return checkIsNumber(num) && Number(num) !== 0;
};

export const isPositiveNumber = (num: any): boolean => {
    return checkIsNumber(num) && Number(num) > 0;
};

export const isNegativeNumber = (num: any): boolean => {
    return checkIsNumber(num) && Number(num) < 0;
};

export const isValidJSON = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};

export const parseJSON = (str: string): ParseJSONResult => {
    try {
        const value = JSON.parse(str);
        return { isJSON: true, data: value };
    } catch (e) {
        return { isJSON: false };
    }
};

export const isNumber = (value: any): boolean => 
    !isNaN(parseInt(value, 10)) && isFinite(value);

export const isObject = (val: any): boolean => {
    return Object.prototype.toString.call(val) === '[object Object]';
};

export const isValidObject = (obj: any): boolean => {
    return Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).length !== 0;
};

// Constants
export const numbersRange: NumberRange[] = [
    { min: 0, max: 500 },
    { min: 500, max: 2000 },
    { min: 2000, max: 5000 },
    { min: 5000, max: 10000 },
    { min: 10000, max: 15000 },
    { min: 15000, max: 20000 },
    { min: 20000, max: 30000 },
    { min: 30000, max: 40000 },
    { min: 40000, max: 50000 },
    { min: 50000, max: 75000 },
    { min: 75000, max: 100000 },
    { min: 100000, max: 150000 },
    { min: 150000, max: 200000 },
    { min: 200000, max: 300000 },
    { min: 300000, max: 400000 },
    { min: 400000, max: 500000 },
    { min: 500000, max: 1000000 },
    { min: 1000000, max: 1500000 },
    { min: 1500000, max: 2000000 },
    { min: 2000000, max: 1e15 },
];

// Utility functions
export const getRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export const getPermutations = <T>(arr: T[]): T[][] => {
    if (arr.length === 1) {
        return [arr];
    }

    let permutations: T[][] = [];

    for (let i = 0; i < arr.length; i++) {
        let currentElement = arr[i];
        let remainingElements = arr.slice(0, i).concat(arr.slice(i + 1));
        let remainingPermutations = getPermutations(remainingElements);

        for (let perm of remainingPermutations) {
            permutations.push([currentElement, ...perm]);
        }
    }

    return permutations;
};

export const randomString = (length: number = 15): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let result = '';

    if (length <= 0) {
        return '';
    }

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
    }

    return result;
};

// Fixed groupData function - corrected indexing issue
export const groupData = <T extends Record<string, any>>(arr: T[], key: keyof T): GroupedData<T>[] => {
    if (Array.isArray(arr) && key) {
        return arr.reduce((acc: GroupedData<T>[], item) => {
            const groupKey = item[key];

            if (groupKey === undefined || groupKey === null) {
                return acc;
            }

            // Fix: Use type assertion for string key
            const groupIndex = acc.findIndex(group => group[String(key)] === groupKey);

            if (groupIndex === -1) {
                // Fix: Create object with proper key
                const newGroup: GroupedData<T> = {
                    [String(key)]: groupKey,
                    groupedData: [{ ...item }]
                };
                acc.push(newGroup);
            } else {
                acc[groupIndex].groupedData.push(item);
            }

            return acc;
        }, []);
    } else {
        return [];
    }
};

export const randomNumber = (minDigits: number = 5, maxDigits: number = 8): number => {
    const digits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;

    return Math.floor(Math.random() * (max - min + 1)) + min;
};