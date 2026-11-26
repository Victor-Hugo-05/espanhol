(function(){
"use strict";
const tiers=["Bronze","Prata","Ouro","Platina","Diamante","Mestre"], roman=["I","II","III","IV"], totals={pt:40,de:120};
function countRows(stats,total){
 let count=0;
 for(let start=1;start+4<=total;start+=5){
  if([0,1,2,3,4].every(n=>Number(stats?.[start+n]?.best)===25))count++;
 }
 return count;
}
function rank(rows){
 if(!rows)return {name:"Aprendiz",tier:-1,division:0,prestige:0};
 const offset=rows-1,prestige=Math.floor(offset/24),tier=Math.floor((offset%24)/4),division=offset%4+1;
 return {name:tiers[tier]+" "+roman[division-1]+(prestige?" · Prestígio "+prestige:""),tier,division,prestige};
}
function badge(tier,division){
 const node=document.createElement("div");node.className="rank-badge";
 if(tier<0){node.classList.add("rank-locked");node.textContent="🔒";return node;}
 node.style.backgroundPosition=(tier%3*50)+"% "+(Math.floor(tier/3)*100)+"%";
 const dots=document.createElement("div");dots.className="rank-gems";
 for(let i=1;i<=4;i++){const gem=document.createElement("span");gem.className=i<=division?"lit":"";gem.textContent="◆";dots.append(gem);}
 node.append(dots);node.setAttribute("role","img");node.setAttribute("aria-label",tiers[tier]+" "+roman[division-1]);return node;
}
function render(container,pt,de){
 const counts=[countRows(pt,totals.pt),countRows(de,totals.de)],rows=counts[0]+counts[1],r=rank(rows),next=rank(rows+1);
 container.replaceChildren();
 const hero=document.createElement("div");hero.className="rank-hero";hero.append(badge(r.tier,r.division));
 const info=document.createElement("div");const title=document.createElement("h3");title.textContent=r.name;
 const detail=document.createElement("p");detail.textContent=rows+" de 32 filas gabaritadas · "+(rows*125)+" acertos nas filas completas";
 const target=document.createElement("p");target.textContent=rows<32?"Próxima patente: "+next.name+" · mais uma fila com 125/125.":"Todas as filas disponíveis foram gabaritadas!";
 info.append(title,detail,target);hero.append(info);container.append(hero);
 const summary=document.createElement("p");summary.className="rank-summary";summary.textContent="🇧🇷 Português: "+counts[0]+"/8 filas · 🇩🇪 Alemão: "+counts[1]+"/24 filas";container.append(summary);
 const ladder=document.createElement("div");ladder.className="rank-ladder";
 tiers.forEach((name,i)=>{const entry=document.createElement("div");entry.className="rank-tier";if(!r.prestige&&i>r.tier)entry.classList.add("rank-future");entry.append(badge(i,r.tier===i?r.division:(r.prestige||i<r.tier?4:0)));const label=document.createElement("strong");label.textContent=name;entry.append(label);ladder.append(entry);});container.append(ladder);
}
window.LanguageRanks={countRows,rank,render};
})();