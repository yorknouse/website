import{d as S,g as a,i as c,c as p,a as g,b as x,s as X,r as N,e as w,F as B,f as L,t as i,h as E}from"./web.9f2b549d.js";const A=i('<div class="2xl:text-large hidden h-12 w-full text-base text-white md:block 2xl:px-[13%]" id="muse-navbar-desktop"><ul class="flex h-full w-full flex-row justify-between border-t-[1px] border-transparent border-white text-xs lg:text-base"></ul></div>'),M=i('<div class="relative flex w-full flex-col md:hidden"><!#><!/><span class="mx-4 border-b-4 border-b-white px-4 pt-8"></span></div>'),F=i("<li></li>"),T=i('<span class="h-3/5 self-center border-r-2 border-white"></span>'),j=i('<a class="mx-auto my-auto"></a>'),H=i('<button class="mx-auto my-auto"></button>'),R=i("<p></p>"),q=t=>[(()=>{const s=a(A),r=s.firstChild;return c(r,p(B,{get each(){return t.categories},children:(l,u)=>[g((()=>{const e=g(()=>u()!==0);return()=>e()&&a(T)})()),(()=>{const e=a(F);return c(e,(()=>{const o=g(()=>t.active()===l.name);return()=>o()?(()=>{const n=a(j);return c(n,()=>l.displayName),x(()=>X(n,"href",`/${l.name}`)),n})():(()=>{const n=a(H);return n.$$click=()=>{const b=document.getElementById(`muse_${t.active()}`);b?.classList.remove("opacity-100","h-min","my-4"),b?.classList.add("opacity-0","h-0"),t.setActive(l.name);const v=document.getElementById(`muse_${l.name}`);v?.classList.remove("opacity-0","h-0"),v?.classList.add("opacity-100","h-min","my-4")},c(n,()=>l.displayName),N(),n})()})()),x(()=>w(e,`group relative flex h-full w-full border-b-4 ${t.active()===l.name?"border-white":"border-transparent"}`)),e})()]})),s})(),(()=>{const s=a(M),r=s.firstChild,[l,u]=L(r.nextSibling);return l.nextSibling,c(s,p(B,{get each(){return t.categories},children:e=>(()=>{const o=a(R);return c(o,()=>e.displayName),x(()=>w(o,`${e.name===t.active()?"opacity-100":"opacity-0"} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-lg text-white transition-opacity delay-100 duration-500`)),o})()}),l,u),s})()];S(["click"]);const z=i('<div id="muse-component" class="relative flex w-full flex-col"><!#><!/><!#><!/><div class="my-4 flex flex-row self-center md:hidden"></div></div>'),D=i("<span></span>"),J=t=>{const[s,r]=E(t.categories[0].name),[l,u]=E(0);return(()=>{const e=a(z),o=e.firstChild,[n,b]=L(o.nextSibling),v=n.nextSibling,[k,I]=L(v.nextSibling),C=k.nextSibling;return e.$$touchend=h=>{const $=h.changedTouches[0].screenX;l()-$>100?t.categories.every((y,m,d)=>{if(y.name===s()&&m+1<d.length){const f=document.getElementById(`muse_mobile_${s()}`);f?.classList.remove("opacity-100","h-min","my-4","w-full"),f?.classList.add("opacity-0","h-0","w-0"),r(d[m+1].name);const _=document.getElementById(`muse_mobile_${d[m+1].name}`);return _?.classList.remove("opacity-0","h-0","w-0"),_?.classList.add("opacity-100","h-min","my-4","w-full"),!1}return!0}):$-l()>100&&t.categories.every((y,m,d)=>{if(y.name===s()&&m-1>=0){const f=document.getElementById(`muse_mobile_${s()}`);f?.classList.remove("opacity-100","h-min","my-4","w-full"),f?.classList.add("opacity-0","h-0","w-0"),r(d[m-1].name);const _=document.getElementById(`muse_mobile_${d[m-1].name}`);return _?.classList.remove("opacity-0","h-0","w-0"),_?.classList.add("opacity-100","h-min","my-4","w-full"),!1}return!0})},e.$$touchstart=h=>{u(h.changedTouches[0].screenX)},c(e,p(q,{active:s,setActive:r,get categories(){return t.categories}}),n,b),c(e,()=>t.children,k,I),c(C,p(B,{get each(){return t.categories},children:h=>(()=>{const $=a(D);return x(()=>w($,`mr-2 h-4 w-4 rounded-full border-[6px] transition-colors delay-100 duration-700 ${s()===h.name?"border-white":"border-gray-500"}`)),$})()})),N(),e})()};S(["touchstart","touchend"]);export{J as default};
