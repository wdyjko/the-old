const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:6,right:6,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function box(s,c,title,sub,x,y,w,h,col){c.addShape(s,{x,y,w,h,fill:"#fff",line:c.line(col,2)});t(s,c,title,x+18,y+16,w-36,28,22,col,true,"center");t(s,c,sub,x+22,y+56,w-44,h-72,17,C.muted,false,"center");}
export async function slide08(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"系统架构：表现层、业务层、数据层清晰分工",64,48,800,46,32,C.ink,true);
 box(s,ctx,"表现层 Presentation","React + TypeScript + Ant Design\n老人/家属端 | 志愿者端 | 管理端",220,150,840,112,C.orange);
 box(s,ctx,"业务层 Business","Node.js + Express + Socket.io\n认证授权 | 需求管控 | 订单流转 | 实时聊天",220,318,840,112,C.blue);
 box(s,ctx,"数据层 Data","MySQL 核心业务数据 | Redis 缓存与临时状态",220,486,840,112,C.green);
 [[640,262,640,318],[640,430,640,486]].forEach(([x1,y1,x2,y2])=>{ctx.addShape(s,{x:x1-2,y:y1,w:4,h:y2-y1,fill:C.dark,line:ctx.line(C.dark,0)});ctx.addShape(s,{x:x2-10,y:y2-12,w:20,h:20,fill:C.dark,line:ctx.line(C.dark,0),geometry:"triangle"});});
 t(s,ctx,"架构特点：前后端分离、模块边界明确，便于维护扩展和多端协同。",214,632,852,32,20,C.ink,true,"center");return s;}

