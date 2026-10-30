const p=await figma.getNodeByIdAsync("13:2");await figma.setCurrentPageAsync(p);
await Promise.all(["Regular","Medium","SemiBold","Bold"].map(style=>figma.loadFontAsync({family:"Be Vietnam Pro",style})));
const createdNodeIds=[],mutatedNodeIds=[],variableIds=[],styleIds=[];
const collection=await figma.variables.getVariableCollectionByIdAsync("VariableCollectionId:13:7"),mode="13:0";
const vars=await figma.variables.getLocalVariablesAsync(),byName=new Map(vars.map(v=>[v.name,v]));
const hexColor=hex=>({r:parseInt(hex.slice(0,2),16)/255,g:parseInt(hex.slice(2,4),16)/255,b:parseInt(hex.slice(4,6),16)/255});
function variable(name,type,value,scopes,syntax){let v=byName.get(name);if(!v){v=figma.variables.createVariable(name,collection,type);byName.set(name,v);}v.scopes=scopes;v.setValueForMode(mode,value);if(syntax)v.setVariableCodeSyntax("WEB",syntax);variableIds.push(v.id);return v;}
const defs=[["brand/primary","a4262c","--red"],["brand/hover","82212a","--red-dark"],["brand/subtle","f9edeb","--red-soft"],["text/primary","292728","--ink"],["text/secondary","74716e","--muted"],["surface/paper","ffffff","--surface"],["surface/canvas","f7f6f2","--ground"],["border/default","e9e6e0","--line"],["status/success","41624b","--green"],["status/warning","8a611f","--amber"]];
const semantic={};
for(const [name,hex,syntax]of defs){let primitive=byName.get("color/"+hex);if(!primitive)primitive=variable("color/"+hex,"COLOR",hexColor(hex),["FRAME_FILL","SHAPE_FILL","TEXT_FILL","STROKE_COLOR"]);semantic[name]=variable(name,"COLOR",figma.variables.createVariableAlias(primitive),["FRAME_FILL","SHAPE_FILL","TEXT_FILL","STROKE_COLOR"],"var("+syntax+")");}
const spacing={};for(const n of [4,8,12,16,24,32])spacing[n]=variable("spacing/"+n,"FLOAT",n,["GAP"]);
const radii={};for(const n of [4,7,12])radii[n]=variable("radius/"+n,"FLOAT",n,["CORNER_RADIUS"]);
function paint(name){return [figma.variables.setBoundVariableForPaint({type:"SOLID",color:hexColor("292728")},"color",semantic[name])];}
function record(n){createdNodeIds.push(n.id);return n;}
const existing=p.children.find(n=>n.name==="Foundations · VJU Learning");if(existing)return {skipped:existing.id};
const board=record(figma.createAutoLayout("VERTICAL"));board.name="Foundations · VJU Learning";board.x=2350;board.y=100;board.resize(1400,1900);board.primaryAxisSizingMode="AUTO";board.counterAxisSizingMode="FIXED";board.paddingLeft=48;board.paddingRight=48;board.paddingTop=48;board.paddingBottom=48;board.itemSpacing=32;board.fills=paint("surface/paper");board.setBoundVariable("itemSpacing",spacing[32]);
function txt(parent,text,size=14,style="Regular",color="text/primary"){const t=record(figma.createText());t.fontName={family:"Be Vietnam Pro",style};t.fontSize=size;t.characters=text;t.lineHeight={unit:"PERCENT",value:155};t.fills=paint(color);parent.appendChild(t);return t;}
function row(parent,name,gap=24){const f=record(figma.createAutoLayout("HORIZONTAL"));f.name=name;f.fills=[];f.itemSpacing=gap;f.primaryAxisSizingMode="AUTO";f.counterAxisSizingMode="AUTO";f.setBoundVariable("itemSpacing",spacing[gap]||spacing[24]);parent.appendChild(f);return f;}
function column(parent,name){const f=record(figma.createAutoLayout("VERTICAL"));f.name=name;f.fills=[];f.itemSpacing=12;f.primaryAxisSizingMode="AUTO";f.counterAxisSizingMode="AUTO";f.setBoundVariable("itemSpacing",spacing[12]);parent.appendChild(f);return f;}
txt(board,"VJU Learning",36,"SemiBold");txt(board,"Campus agenda · Operate · Sinh viên & Giảng viên",16,"Regular","text/secondary");
txt(board,"Màu sắc",22,"SemiBold");
for(let offset=0;offset<defs.length;offset+=5){const r=row(board,"Semantic color tokens");for(const[name,hex]of defs.slice(offset,offset+5)){const c=column(r,name);const sw=record(figma.createRectangle());sw.name=name;sw.resize(220,72);sw.fills=paint(name);sw.cornerRadius=7;sw.setBoundVariable("cornerRadius",radii[7]);c.appendChild(sw);txt(c,name,13,"Medium");txt(c,"#"+hex.toUpperCase(),11,"Regular","text/secondary");}}
txt(board,"Kiểu chữ · Be Vietnam Pro",22,"SemiBold");
const existingStyles=await figma.getLocalTextStylesAsync();
for(const[name,size,style,height,tracking]of [["Heading / Page",28,"SemiBold",37.8,-0.98],["Heading / Section",17,"SemiBold",25.5,-0.34],["Heading / Panel",14,"SemiBold",21,0],["Body / Default",13,"Regular",20.8,0],["Control / Label",11,"Medium",15.4,0],["Metadata / Small",10,"Regular",16,0]]){let s=existingStyles.find(s=>s.name===name);if(!s){s=figma.createTextStyle();s.name=name;s.fontName={family:"Be Vietnam Pro",style};s.fontSize=size;s.lineHeight={unit:"PIXELS",value:height};s.letterSpacing={unit:"PIXELS",value:tracking};}styleIds.push(s.id);const t=txt(board,name+" — Học tập hôm nay",size,style);await t.setTextStyleIdAsync(s.id);}
txt(board,"Khoảng cách & bo góc",22,"SemiBold");const scales=row(board,"Spacing scale",24);
for(const n of [4,8,12,16,24,32]){const c=column(scales,"Spacing "+n);const r=record(figma.createRectangle());r.resize(Math.max(n,4),24);r.fills=paint("brand/primary");c.appendChild(r);txt(c,n+" px",11);}
txt(board,"Nút thao tác",22,"SemiBold");
const variants=[];
for(const [i,tone]of ["Primary","Secondary"].entries())for(const[j,state]of ["Default","Hover","Disabled"].entries()){
 const c=record(figma.createComponent());c.name="Tone="+tone+", State="+state;c.resize(180,38);c.layoutMode="HORIZONTAL";c.primaryAxisSizingMode="FIXED";c.counterAxisSizingMode="FIXED";c.primaryAxisAlignItems="CENTER";c.counterAxisAlignItems="CENTER";c.cornerRadius=7;c.setBoundVariable("cornerRadius",radii[7]);c.fills=paint(tone==="Primary"?(state==="Hover"?"brand/hover":"brand/primary"):"surface/paper");if(tone==="Secondary"){c.strokes=paint("border/default");c.strokeWeight=1;}if(state==="Disabled")c.opacity=0.45;c.x=j*220;c.y=i*90;txt(c,tone==="Primary"?"Lưu thay đổi":"Hủy",11,"Medium",tone==="Primary"?"surface/paper":"text/primary");c.description="Source: .button and .button.secondary in src/styles/app.css; disabled opacity from tokens.css";variants.push(c);
}
const set=record(figma.combineAsVariants(variants,p));set.name="Button";set.description="Primary and secondary actions. Default, hover and disabled variants; keyboard focus is a 3px outline in the frontend.";set.fills=[];set.resize(640,180);board.appendChild(set);
txt(board,"Component từ các màn hình",22,"SemiBold");txt(board,"Bộ component bên trái giữ nội dung và kích thước đã dùng trong các màn hình. Logo dùng nguyên bản; các màn desktop và mobile nằm ở trang riêng.",13,"Regular","text/secondary");
const controls=p.children.filter(n=>n.type==="COMPONENT"&&!n.name.startsWith("Brand"));
for(const[i,c]of controls.entries()){c.x=100+(i%4)*500;c.y=700+Math.floor(i/4)*100;mutatedNodeIds.push(c.id);}
await board.screenshot({scale:0.65});
return {createdNodeIds,mutatedNodeIds,variableIds,styleIds,board:{id:board.id,w:board.width,h:board.height},buttonSet:set.id,extractedComponents:controls.length};
