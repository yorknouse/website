import{h as d,c as r,g as a,f as m,i as n,S as _,F as A,t as o}from"./web.507ce5e1.js";import{a as y,S as C}from"./Spinner.8eb3cc57.js";const T=o('<div class="mt-4"></div>'),k=o('<div class="block min-h-[10rem] w-full"><h3 class="text-2xl md:text-4xl">Top Articles</h3><div class="relative flex h-full flex-row md:flex-col"><!#><!/><!#><!/></div></div>'),P=o('<div class="h-min"></div>'),F=p=>{const[c,$]=d(!0),[l,f]=d([]);return fetch("/api/topArticles.php",{method:"POST"}).then(async e=>{if(e.status!==200)throw new Error(e.statusText);const s=await e.json();s.result&&f(s.response)}).catch(e=>{console.error(e)}).finally(()=>$(!1)),r(_,{get when(){return c()||l().length>0},get children(){const e=a(k),s=e.firstChild,i=s.nextSibling,x=i.firstChild,[u,v]=m(x.nextSibling),S=u.nextSibling,[w,b]=m(S.nextSibling);return n(i,r(y,{showAccessor:c}),u,v),n(i,r(_,{get when(){return l().length>0},get children(){const g=a(T);return n(g,r(A,{get each(){return l()},children:t=>(()=>{const h=a(P);return n(h,r(C,{get headline(){return t.articlesDrafts_headline},excerpt:null,get author(){return`${t.users_name1} ${t.users_name2}`},get authorId(){return t.users_userid},get category(){return t.categories_name},categoryColor:void 0,categoryLink:void 0,get imageUrl(){return t.image},get articleUrl(){return`${p.baseUrl}${t.url}`},isVertical:!0,get isPortrait(){return t.articles_isThumbnailPortrait},hideCategoryAccent:!0})),h})()})),g}}),w,b),e}})};export{F as default};