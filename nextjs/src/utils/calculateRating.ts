export function calculateSingleSongRating(rate: number, score: number): number {

    if (!rate || !score) return 0
    if (score >= 1009000) return rate + 2.15
    if (score >= 1007500) return rate + 2 + (score - 1007500) / 10000
    if (score >= 1005000) return (score - 1005000) / 2500 * 0.5 + 1.5 + rate;
    if (score >= 1000000) return (score - 1000000) / 5000 * 0.5 + 1 + rate;
    if (score >= 975000) return (score - 975000) / 25000 + rate;

    return 0
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

export const generateScript = (id: number) => {
    return `javascript:!function(){const t=["ultima","master","expert"];let e=[];const n="https://chuni-log.com";async function o(t,n){const o="https://chunithm-net-eng.com/mobile/record/musicGenre/"+t;return fetch(o,{credentials:"include"}).then((function(t){return t.text()})).then((function(n){var i=(new DOMParser).parseFromString(n,"text/html");const a=$(i).find(".musiclist_box");if(a.length<=0)throw"fail, please try again on this link "+o;for(let n=0;n<a.length;n++){let o=a[n].getElementsByClassName("play_musicdata_highscore")[0];if(o){let i=a[n].getElementsByClassName("music_title")[0].innerText,l=$(o).find("span")[0].innerText.split(",").join("");parseInt(l)>=0&&e.push({name:i,difficulty:t,score:parseInt(l)})}}})).catch((t=>{console.log("calculateRating",t),alert("fail")}))}Number.prototype.round=function(t){return+(Math.round(this+"e+"+t)+"e-"+t)},async function(){for(let e=0;e<t.length;e++)await o(t[e]);if(e.length<=0)throw"no songs record, please retry";console.table(e),fetch(n+"/api/record/" + ${id},{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:e})}).then((t=>t.text())).then((t=>{console.log("🚀 ~ file: calculateRating.js ~ line 120 ~ .then ~ r",t),window.open(n)})).catch((t=>alert(t)))}()}();`    
}