export function calculateSingleSongRating(rate: number, score: number): number {

    if (!rate || !score) return 0
    if (score >= 1009000) return rate + 2.15
    if (score >= 1007500) return rate + 2 + (score - 1007500) / 1500 * .1
    if (score >= 1005000) return (score - 1005000) / 2500 * 0.5 + 1.5 + rate;
    if (score >= 1000000) return (score - 1000000) / 5000 * 0.5 + 1 + rate;
    if (score >= 975000) return (score - 975000) / 25000 + rate;

    return 0
}


export const generateScript = (id: number) => {
    return `javascript:!function(){const s=${id},n=["ultima","master","expert"];let c=[];function h(t){for(var e="",n=0,o=t.length;n<o;n++){var r=t[n].charCodeAt(0);65280<=r&&r<=65519&&(r=255&r+32),e+=String.fromCharCode(r)}return e.replace(/[\n\s'’]/g,"").replace(/[”“]/g,'"')}Number.prototype.round=function(t){return+(Math.round(this+"e+"+t)+"e-"+t)},async function(){fetch("https://chuni-log.com/api/songs",{method:"GET",headers:{"Content-Type":"application/json"}}).then(t=>t.json()).then(async t=>{var e=t;for(let t=0;t<n.length;t++)await async function(r,i){const a="https://chunithm-net-eng.com/mobile/record/musicGenre/"+r;return fetch(a,{credentials:"include"}).then(function(t){return t.text()}).then(function(t){t=(new DOMParser).parseFromString(t,"text/html");const e=$(t).find(".musiclist_box");if(e.length<=0)throw"fail, please try again on this link "+a;for(let t=0;t<e.length;t++){var n,o=e[t].getElementsByClassName("play_musicdata_highscore")[0];o&&(n=e[t].getElementsByClassName("music_title")[0].innerText,o=$(o).find("span")[0].innerText.split(",").join(""),0<=parseInt(o)&&i[h(n)]&&i[h(n)][r]&&c.push({name:n,user_id:s,song_id:i[h(n)].id,rate:i[h(n)][r],difficulty:r,score:parseInt(o)}))}}).catch(t=>{alert("fail")})}(n[t],e);c.length<=0||(console.table(c),fetch("https://chuni-log.com/api/record/update",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:c,user_id:s})}).then(t=>t.text()).then(t=>{window.open("https://chuni-log.com/home")}))}).catch(t=>{alert(t)})}()}();`
}