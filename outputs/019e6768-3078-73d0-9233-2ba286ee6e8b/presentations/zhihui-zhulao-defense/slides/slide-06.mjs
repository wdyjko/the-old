const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:6,right:6,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function row(s,c,y,a,b,d,fill){c.addShape(s,{x:92,y,w:1096,h:58,fill,line:c.line(C.line,1)});t(s,c,a,112,y+15,180,24,17,C.ink,true);t(s,c,b,318,y+15,230,24,17,C.ink);t(s,c,d,585,y+13,560,28,16,C.muted);}
export async function slide06(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"研究现状：已有基础明确，但协同闭环仍有提升空间",64,50,900,46,31,C.ink,true);
 t(s,ctx,"国内研究主要集中在平台建设、服务入口、适老化设计和技术架构四类方向",66,98,900,30,18,C.muted);
 ctx.addShape(s,{x:92,y:160,w:1096,h:48,fill:"#17313A",line:ctx.line("#17313A",0)});t(s,ctx,"研究方向",112,173,180,22,16,"#fff",true);t(s,ctx,"代表学者",318,173,180,22,16,"#fff",true);t(s,ctx,"核心观点",585,173,400,22,16,"#fff",true);
 row(s,ctx,208,"平台建设","朱培垚、凌超","资源整合、需求汇聚、任务分发","#FFFFFF");row(s,ctx,266,"服务入口","彭敏学、傅俊哲","轻量化入口与小程序形态具有使用优势","#F8FBFA");row(s,ctx,324,"适老化设计","耿梦瑶、赵敏","降低理解负担，跨越数字鸿沟","#FFFFFF");row(s,ctx,382,"技术架构","赵莹德、樊斐","物联网感知、微服务架构等技术路线","#F8FBFA");
 ctx.addShape(s,{x:106,y:510,w:496,h:92,fill:"#FFE8CF",line:ctx.line("#FFE8CF",0)});t(s,ctx,"启示",130,526,80,28,22,C.orange,true);t(s,ctx,"平台建设必须贴合本土社区治理模式和老年用户数字能力。",224,526,330,42,18,C.ink);
 ctx.addShape(s,{x:680,y:510,w:496,h:92,fill:"#E8F4F1",line:ctx.line("#E8F4F1",0)});t(s,ctx,"不足",704,526,80,28,22,C.blue,true);t(s,ctx,"实时协同、过程闭环、多角色联动仍有进一步优化空间。",798,526,330,42,18,C.ink);
 return s;}

