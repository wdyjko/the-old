const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function result(s,c,title,body,x,y,col){c.addShape(s,{x,y,w:335,h:230,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x:x+24,y:y+28,w:54,h:54,fill:col,line:c.line(col,0),geometry:"ellipse"});t(s,c,"✓",x+24,y+34,54,36,25,"#fff",true,"center");t(s,c,title,x+92,y+30,210,28,22,col,true);t(s,c,body,x+34,y+110,270,70,18,C.ink,false,"center");}
export async function slide21(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"研究成果：完成社区智慧助老服务对接平台",64,48,880,46,32,C.ink,true);
 result(s,ctx,"平台实现","完成基于 Node.js + React 的社区“智慧助老”服务对接平台。",90,200,C.orange);
 result(s,ctx,"三端协同","支持老人/家属端、志愿者端和管理员端协同工作。",472,200,C.blue);
 result(s,ctx,"业务闭环","实现需求发布、匹配、执行、反馈、评价的完整链路。",854,200,C.green);
 t(s,ctx,"整体效果：平台能够把服务对象、志愿者资源和社区管理流程统一起来。",160,602,960,36,21,C.ink,true,"center");return s;}

