import{j as u,k as h,l as b,c as m}from"./web.9f2b549d.js";var y=r=>(n,s,o,{client:a})=>{if(window._$HY||(window._$HY={events:[],completed:new WeakSet,r:{}}),!r.hasAttribute("ssr"))return;const d=a==="only"?h:b;let t={};if(Object.keys(o).length>0)if(u.context)r.querySelectorAll("astro-slot").forEach(e=>{t[e.getAttribute("name")||"default"]=e.cloneNode(!0)});else for(const[e,f]of Object.entries(o))t[e]=document.createElement("astro-slot"),e!=="default"&&t[e].setAttribute("name",e),t[e].innerHTML=f;const{default:l,...c}=t,i=r.dataset.solidRenderId;d(()=>m(n,{...s,...c,children:l}),r,{renderId:i})};export{y as default};
