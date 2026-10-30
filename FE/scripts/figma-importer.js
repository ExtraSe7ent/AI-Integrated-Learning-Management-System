// Embedded in use_figma after STATE and SCREENS have been supplied.
const createdNodeIds=[],mutatedNodeIds=[],deletedNodeIds=[];
const page=await figma.getNodeByIdAsync(STATE.pages[TARGET]);
await figma.setCurrentPageAsync(page);
await Promise.all(['Regular','Medium','SemiBold','Bold'].map(style=>figma.loadFontAsync({family:'Be Vietnam Pro',style})));
const foundations=await figma.getNodeByIdAsync(STATE.pages.foundations);
const variables=await figma.variables.getLocalVariablesAsync();
const colorVariables=new Map(variables.filter(v=>v.name.startsWith('color/')).map(v=>[v.name.slice(6),v]));
const collection=await figma.variables.getVariableCollectionByIdAsync(STATE.collectionId);
const components={};
await Promise.all(Object.entries(STATE.components).map(async([key,id])=>{components[key]=await figma.getNodeByIdAsync(id);}));
function hash(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
function rgba(value){const match=(value||'').match(/rgba?\(([^)]*)\)/);const n=match?.[1].match(/[\d.]+/g)?.map(Number);return n&&n.length>=3?{r:n[0]/255,g:n[1]/255,b:n[2]/255,a:Math.min(1,n[3]??1)}:null;}
function paint(value){const c=rgba(value);if(!c||c.a===0)return [];const hex=[c.r,c.g,c.b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');let v=colorVariables.get(hex);if(!v){v=figma.variables.createVariable('color/'+hex,collection,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(STATE.modeId,c);colorVariables.set(hex,v);}return [figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:c.r,g:c.g,b:c.b},opacity:c.a},'color',v)];}
function record(node){createdNodeIds.push(node.id);return node;}
function textNode(n){const t=record(figma.createText());t.name=n.text.slice(0,65);t.fontName={family:'Be Vietnam Pro',style:n.weight>=700?'Bold':n.weight>=600?'SemiBold':n.weight>=500?'Medium':'Regular'};t.fontSize=n.fontSize||12;t.characters=n.text;t.fills=paint(n.color);t.lineHeight={unit:'PIXELS',value:n.lineHeight||Math.round((n.fontSize||12)*1.6)};t.letterSpacing={unit:'PIXELS',value:n.spacing||0};if(n.h<(n.fontSize||12)*1.8){t.textAutoResize='WIDTH_AND_HEIGHT';}else{t.textAutoResize='HEIGHT';t.resize(Math.max(n.w+3,1),Math.max(n.h,1));}return t;}
function styleFrame(node,n){node.name=String(n.name||n.kind).slice(0,100);node.resize(Math.max(n.w,1),Math.max(n.h,1));node.fills=paint(n.bg);if(n.borderWidth&&n.borderWidth>0){node.strokes=paint(n.border);node.strokeWeight=n.borderWidth;node.strokeAlign='INSIDE';}if(n.radius)node.cornerRadius=n.radius;node.clipsContent=false;if(n.opacity!==undefined)node.opacity=n.opacity;}
function element(n,allowComponent=true){
 if(n.kind==='text')return textNode(n);
 if(n.kind==='svg'){let vector;try{vector=record(figma.createNodeFromSvg(n.svg));vector.resize(Math.max(n.w,1),Math.max(n.h,1));vector.name='Icon / '+String(n.name).replace(/.*lucide-/,'');for(const c of vector.findAllWithCriteria({types:['VECTOR','FRAME','GROUP']}))createdNodeIds.push(c.id);return vector;}catch{return null;}}
 if(n.kind==='image'){const rect=record(figma.createRectangle());rect.name='Image / '+(n.src.includes('vju-seal')?'VJU Seal':'VJU Logo');rect.resize(n.w,n.h);const hash=STATE.images[n.src]||STATE.images[n.src.split('/').pop()];if(hash)rect.fills=[{type:'IMAGE',imageHash:hash,scaleMode:'FIT'}];else if(n.src.startsWith('data:image')){const image=figma.createImage(figma.base64Decode(n.src.split(',')[1]));rect.fills=[{type:'IMAGE',imageHash:image.hash,scaleMode:'FIT'}];}else rect.fills=[];return rect;}
 // Reusable controls are main components; repeated source structures become instances.
 const canComponent=allowComponent&&['button','badge','avatar','workspace-mark','nav-item'].includes(n.component);
 const signature=canComponent?hash([n.component,n.name,Math.round(n.w),Math.round(n.h),n.bg,n.border,n.opacity,JSON.stringify(n.children.map(c=>[c.kind,c.text||c.name,c.x,c.y,c.w,c.h,c.color,c.svg]))].join('|')):null;
 if(signature&&components[signature]){const instance=record(components[signature].createInstance());return instance;}
 let node=record(canComponent?figma.createComponent():figma.createFrame());styleFrame(node,n);
 if(canComponent){node.layoutMode='HORIZONTAL';node.primaryAxisSizingMode='FIXED';node.counterAxisSizingMode='FIXED';node.counterAxisAlignItems='CENTER';node.primaryAxisAlignItems=n.component==='nav-item'?'MIN':'CENTER';node.itemSpacing=8;node.paddingLeft=n.component==='nav-item'?12:0;}
 if(n.kind==='progress'){const back=record(figma.createRectangle());back.name='Track';back.resize(n.w,Math.max(n.h,3));back.fills=paint('rgb(236, 233, 227)');back.cornerRadius=3;node.appendChild(back);if(n.value>0){const bar=record(figma.createRectangle());bar.name='Progress';bar.resize(Math.max(n.w*n.value,1),Math.max(n.h,3));bar.fills=paint('rgb(164, 38, 44)');bar.cornerRadius=3;node.appendChild(bar);}return node;}
 if(n.kind==='input'){
  if(n.inputType==='radio'||n.inputType==='checkbox'){node.fills=paint(n.checked?'rgb(164, 38, 44)':'rgb(255,255,255)');node.strokes=paint('rgb(180,160,145)');node.strokeWeight=1;node.cornerRadius=n.inputType==='radio'?n.w/2:3;return node;}
  if(n.inputType==='select-one'){const arrow=element({kind:'svg',name:'lucide-chevron-down',w:14,h:14,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(72,68,66)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'});node.appendChild(arrow);arrow.x=n.w-26;arrow.y=(n.h-14)/2;}
  if(n.inputType!=='file'&&n.text){const label=textNode({text:n.text,fontSize:n.fontSize,weight:400,color:n.color,w:Math.max(n.w-24,1),h:n.h,lineHeight:n.fontSize*1.5});node.appendChild(label);label.x=12;label.y=Math.max(5,(n.h-label.height)/2);}return node;
 }
 for(const child of n.children||[]){const c=element(child,true);if(c){node.appendChild(c);if(!canComponent){c.x=child.x;c.y=child.y;}}}
 if(n.name==='app-main'){const header=node.children.find(c=>c.name==='Topbar');if(header)node.appendChild(header);}
 if(String(n.name).includes('course-cover-title')){const t=node.children.find(c=>c.type==='TEXT');if(t){t.textAutoResize='HEIGHT';t.resize(Math.max(n.w,1),1);const full=t.characters;if(t.height>n.h+1){let low=0,high=full.length;while(low<high){const mid=Math.ceil((low+high)/2);t.characters=full.slice(0,mid).trimEnd()+'…';if(t.height<=n.h+1)low=mid;else high=mid-1;}t.characters=full.slice(0,low).trimEnd()+'…';}}}
 if(canComponent){node.name=n.component+' / '+String(n.children.find(c=>c.kind==='text')?.text||n.name).slice(0,45);node.description='Reusable component from VJU Learning frontend. Source: src/shared/UI.tsx and role composition.';foundations.appendChild(node);const count=Object.keys(components).length;node.x=100+(count%7)*270;node.y=700+Math.floor(count/7)*100;components[signature]=node;const instance=record(node.createInstance());return instance;}
 return node;
}
const frames=[];
for(const screen of SCREENS){
 const existing=STATE.frames.find(f=>f.route===screen.route&&f.width===screen.width);
 const roleIndex=STATE.frames.filter(f=>f.role===TARGET).length+frames.filter(f=>!STATE.frames.some(s=>s.id===f.id)).length;
 const wrapper=existing?await figma.getNodeByIdAsync(existing.id):record(figma.createAutoLayout('VERTICAL'));
 if(existing){mutatedNodeIds.push(wrapper.id);for(const c of [...wrapper.children]){deletedNodeIds.push(c.id);c.remove();}}
 wrapper.name=(existing?.order?String(existing.order).padStart(2,'0')+' · ':'')+screen.name+' / '+(screen.width===390?'Mobile':'Desktop');wrapper.resize(screen.width,Math.max(screen.height,screen.width===390?844:1000));wrapper.primaryAxisSizingMode='FIXED';wrapper.counterAxisSizingMode='FIXED';wrapper.fills=paint('rgb(247,246,242)');wrapper.clipsContent=true;
 if(!existing){wrapper.x=100+(roleIndex%3)*(screen.width+120);wrapper.y=100+Math.floor(roleIndex/3)*(screen.width===390?3000:2300);}
 const root=element(screen.root,false);wrapper.appendChild(root);root.layoutPositioning='ABSOLUTE';root.x=0;root.y=0;
 frames.push({id:wrapper.id,name:screen.name,route:screen.route,width:screen.width,role:TARGET,w:wrapper.width,h:wrapper.height});
}
return {createdNodeIds,mutatedNodeIds,deletedNodeIds,frames,components:Object.fromEntries(Object.entries(components).filter(([k])=>!STATE.components[k]).map(([k,v])=>[k,v.id])),variables:[...colorVariables.values()].filter(v=>!variables.some(old=>old.id===v.id)).map(v=>({id:v.id,name:v.name})),stats:{frames:frames.length,components:Object.keys(components).length,nodes:createdNodeIds.length}};
