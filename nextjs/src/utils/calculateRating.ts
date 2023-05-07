export function calculateSingleSongRating(rate: number, score: number): number {
    const n = 0.00000001
    if (!rate || !score) return 0
    if (score >= 1009000) return rate + 2.15 + n
    if (score >= 1007500) return rate + 2 + (score - 1007500) / 10000 + n
    if (score >= 1005000) return (score - 1005000) / 2500 * 0.5 + 1.5 + rate + n
    if (score >= 1000000) return (score - 1000000) / 5000 * 0.5 + 1 + rate + n
    if (score >= 975000) return (score - 975000) / 25000 + rate + n

    return 0
}
function toFixed(x: any) {
    if (Math.abs(x) < 1.0) {
        let e = parseInt(x.toString().split('e-')[1]);
        if (e) {
            x *= Math.pow(10, e - 1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
    } else {
        let e = parseInt(x.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10, e);
            x += (new Array(e + 1)).join('0');
        }
    }
    return x;
}

export function toFixedTrunc(x: number | string, n: number) {
    x = toFixed(x)

    // From here on the code is the same than the original answer
    const v = (typeof x === 'string' ? x : x.toString()).split('.');
    if (n <= 0) return v[0];
    let f = v[1] || '';
    if (f.length > n) return `${v[0]}.${f.substr(0, n)}`;
    while (f.length < n) f += '0';
    return `${v[0]}.${f}`
}

export function reEscape(chars: string) {
    var ascii = '';
    for (var i = 0, l = chars.length; i < l; i++) {
        var c = chars[i].charCodeAt(0);
        if (c >= 0xFF00 && c <= 0xFFEF) {
            c = 0xFF & (c + 0x20);
        }
        ascii += String.fromCharCode(c);
    }

    return ascii.replace(/[\n\s'’]/g, '').replace(/[”“]/g, '\"')
}

export const generateScript = (id: string) => {
    return `javascript: (function () {var a = document.createElement('script'); a.src = "https://chuni-log.io.kookiym.com/calculateRating.min.js"; window.userID = "${id}"; document.body.appendChild(a);})();`
}