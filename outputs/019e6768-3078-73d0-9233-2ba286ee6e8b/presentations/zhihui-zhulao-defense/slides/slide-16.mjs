const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
const A="C:/Users/Lenovo/Desktop/the-old-no-deps/outputs/019e6768-3078-73d0-9233-2ba286ee6e8b/presentations/zhihui-zhulao-defense/assets/screens";
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
async function shot(s,c,title,path,x,y,w,h,col){c.addShape(s,{x,y,w,h,fill:"#fff",line:c.line(C.line,1)});t(s,c,title,x+18,y+14,w-36,24,20,col,true);await c.addImage(s,{path,x:x+16,y:y+52,w:w-32,h:h-66,fit:"contain",alt:title});}
export async function slide16(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"志愿者端：任务大厅与地图辅助提升接单效率",64,48,900,46,32,C.ink,true);
 await shot(s,ctx,"任务大厅列表视图：快速浏览与一键接单",`${A}/task-list.png`,64,142,548,420,C.blue);
 await shot(s,ctx,"地图视图：附近实时需求分布",`${A}/task-map.png`,668,142,548,420,C.green);
 t(s,ctx,"真实页面展示：列表适合快速筛选，地图结合距离与出行成本辅助志愿者判断。",145,620,990,36,20,C.ink,true,"center");return s;}
