const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
const A="C:/Users/Lenovo/Desktop/the-old-no-deps/outputs/019e6768-3078-73d0-9233-2ba286ee6e8b/presentations/zhihui-zhulao-defense/assets/screens";
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
async function shot(s,c,title,path,x,y,w,h,col){c.addShape(s,{x,y,w,h,fill:"#fff",line:c.line(C.line,1)});t(s,c,title,x+14,y+12,w-28,22,18,col,true);await c.addImage(s,{path,x:x+12,y:y+46,w:w-24,h:h-58,fit:"contain",alt:title});}
export async function slide15(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"老人 / 家属端：低认知负担的服务入口",64,48,760,46,32,C.ink,true);
 await shot(s,ctx,"首页：个人资料与近期动态",`${A}/elder-home.png`,54,138,380,430,C.orange);
 await shot(s,ctx,"发布需求：表单校验与地图选点",`${A}/publish-demand.png`,450,138,380,430,C.blue);
 await shot(s,ctx,"订单跟踪：状态分类与进度查看",`${A}/order-tracking.png`,846,138,380,430,C.green);
 t(s,ctx,"真实页面展示：入口聚合、表单完整性校验、订单状态可视化，降低老年人和家属的操作负担。",120,620,1040,36,20,C.ink,true,"center");return s;}
