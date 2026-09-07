const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function block(s,c,title,items,x,y,col){c.addShape(s,{x,y,w:335,h:330,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x,y,w:335,h:54,fill:col,line:c.line(col,0)});items.forEach((it,i)=>t(s,c,"• "+it,x+34,y+82+i*60,255,52,15,C.ink));t(s,c,title,x+20,y+14,295,24,20,"#fff",true,"center");}
export async function slide23(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"不足与展望：从可用走向更智能、更适老、更可扩展",64,48,980,46,31,C.ink,true);
 block(s,ctx,"待优化",["智能推荐算法","适老化交互细节打磨","高并发场景性能优化"],90,195,C.orange);
 block(s,ctx,"可扩展",["健康监测接入","紧急求助功能","多社区资源联动","AI 辅助调度"],472,195,C.blue);
 block(s,ctx,"推广价值",["为社区养老服务数字化提供可落地方案","支持本地社区治理场景持续演进"],854,195,C.green);
 t(s,ctx,"后续方向：在保证基础流程稳定的前提下，引入更精准的匹配策略和更友好的老年人交互体验。",128,610,1024,42,21,C.ink,true,"center");return s;}

