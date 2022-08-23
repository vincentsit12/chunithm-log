var CryptoJS = require("crypto-js");


export function encrypt(string: string) {
    return CryptoJS.AES.encrypt(string, 'chunithm').toString().replace(/\+/g, 'p1L2u3S').replace(/\//g, 's1L2a3S4h').replace(/=/g, 'e1Q2u3A4l');
}
export function decrypt(string: string) {
    let decryptedString = string.replace(/p1L2u3S/g, '+').replace(/s1L2a3S4h/g, '/').replace(/e1Q2u3A4l/g, '=');
    return CryptoJS.AES.decrypt(decryptedString, 'chunithm').toString(CryptoJS.enc.Utf8)
}