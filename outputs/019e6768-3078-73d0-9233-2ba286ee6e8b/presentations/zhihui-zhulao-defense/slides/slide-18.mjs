const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
const A="C:/Users/Lenovo/Desktop/the-old-no-deps/outputs/019e6768-3078-73d0-9233-2ba286ee6e8b/presentations/zhihui-zhulao-defense/assets/screens";
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
async function shot(s,c,title,path,x,y,w,h,col){c.addShape(s,{x,y,w,h,fill:"#fff",line:c.line(C.line,1)});t(s,c,title,x+18,y+14,w-36,24,20,col,true);await c.addImage(s,{path,x:x+18,y:y+54,w:w-36,h:h-68,fit:"contain",alt:title});}
export async function slide18(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"实时通信与积分：让服务过程可沟通、可激励、可留痕",64,48,980,46,32,C.ink,true);
 await shot(s,ctx,"订单级实时聊天：围绕工单沉淀沟通记录",`${A}/order-chat.png`,84,140,520,428,C.blue);
 await shot(s,ctx,"积分激励机制：服务积分与兑换商城",`${A}/points-mall.png`,676,140,520,428,C.green);
 t(s,ctx,"真实页面展示：Socket.io 支撑服务过程沟通；积分商城把服务完成、质量反馈和持续参与连接起来。",120,620,1040,42,20,C.ink,true,"center");return s;}
