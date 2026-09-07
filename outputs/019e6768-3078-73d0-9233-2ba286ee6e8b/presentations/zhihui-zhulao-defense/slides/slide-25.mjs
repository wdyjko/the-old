const C={ink:"#17212B",bg:"#17313A",orange:"#F28C38",blue:"#69B3C9",green:"#7ECBA3"};
function t(s,c,text,x,y,w,h,fs=24,col="#fff",b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
export async function slide25(presentation,ctx){const s=presentation.slides.add();ctx.addShape(s,{x:0,y:0,w:ctx.W,h:ctx.H,fill:C.bg});
 ctx.addShape(s,{x:205,y:120,w:870,h:360,fill:"#FFF8F1",line:ctx.line("#FFF8F1",0)});
 t(s,ctx,"Q&A",390,195,500,90,68,C.ink,true,"center");
 t(s,ctx,"欢迎各位老师批评指正",360,315,560,46,30,C.ink,true,"center");
 ["需求发布","任务匹配","过程跟踪","评价反馈"].forEach((l,i)=>{const cols=[C.orange,C.blue,C.green,C.orange];ctx.addShape(s,{x:250+i*210,y:555,w:140,h:38,fill:cols[i],line:ctx.line(cols[i],0)});t(s,ctx,l,250+i*210,564,140,20,16,"#fff",true,"center");});
 return s;}

