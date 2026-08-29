const VIEW_TITLES={pet:"蓝豆桌宠 · LanDou Creative Lab",cat:"橘团桌宠 · LanDou Creative Lab",otter:"小獭桌宠 · LanDou Creative Lab",effects:"代码特效 · LanDou Creative Lab"};
const VALID_VIEWS=["pet","cat","otter","effects"];
const VALID_HASHES=["#playground","#cat","#otter","#effects"];

export const viewFromHash=hash=>hash==="#effects"?"effects":hash==="#otter"?"otter":hash==="#cat"?"cat":"pet";
export const hashForView=name=>name==="effects"?"#effects":name==="otter"?"#otter":name==="cat"?"#cat":"#playground";
export const normalizeView=name=>VALID_VIEWS.includes(name)?name:"pet";

export function initSidebar({onViewChange}={}){
  const shell=document.querySelector("#app-shell"),collapse=document.querySelector("#sidebar-collapse"),reveal=document.querySelector("#sidebar-reveal"),scrim=document.querySelector("#sidebar-scrim"),navItems=[...document.querySelectorAll("[data-view]")],panels=[...document.querySelectorAll("[data-view-panel]")];
  const isMobile=()=>window.matchMedia("(max-width: 760px)").matches;

  function setSidebar(open){
    if(isMobile()){
      shell.classList.toggle("mobile-sidebar-open",open);
      scrim.hidden=!open;
      reveal.hidden=open;
    }else{
      shell.classList.toggle("sidebar-hidden",!open);
      collapse.setAttribute("aria-expanded",String(open));
      collapse.setAttribute("aria-label",open?"隐藏侧边栏":"显示侧边栏");
      reveal.hidden=open;
    }
  }

  function renderView(name,{scroll=true}={}){
    navItems.forEach(item=>{
      const active=item.dataset.view===name;
      item.classList.toggle("active",active);
      active?item.setAttribute("aria-current","page"):item.removeAttribute("aria-current");
    });
    panels.forEach(panel=>{
      const active=panel.dataset.viewPanel===name;
      panel.classList.toggle("active",active);
      panel.hidden=!active;
    });
    document.title=VIEW_TITLES[name];
    if(isMobile())setSidebar(false);
    onViewChange?.(name);
    if(scroll)window.scrollTo({top:0,behavior:"smooth"});
  }

  function showView(name){
    const nextName=normalizeView(name);
    const nextHash=hashForView(nextName);
    if(location.hash!==nextHash)history.pushState(null,"",nextHash);
    renderView(nextName);
  }

  collapse.addEventListener("click",()=>setSidebar(false));
  reveal.addEventListener("click",()=>setSidebar(true));
  scrim.addEventListener("click",()=>setSidebar(false));
  navItems.forEach(item=>item.addEventListener("click",()=>showView(item.dataset.view)));
  window.addEventListener("hashchange",()=>renderView(viewFromHash(location.hash)));
  window.addEventListener("resize",()=>{
    if(!isMobile()){
      shell.classList.remove("mobile-sidebar-open");
      scrim.hidden=true;
    }else if(!shell.classList.contains("mobile-sidebar-open")){
      reveal.hidden=false;
    }
  });

  if(!VALID_HASHES.includes(location.hash))history.replaceState(null,"","#playground");
  renderView(viewFromHash(location.hash),{scroll:false});
  if(isMobile())setSidebar(false);
  return{showView,setSidebar};
}
