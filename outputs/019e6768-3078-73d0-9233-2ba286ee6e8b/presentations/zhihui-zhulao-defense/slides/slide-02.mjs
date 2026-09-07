const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(slide,ctx){ctx.addShape(slide,{x:0,y:0,w:ctx.W,h:ctx.H,fill:C.bg});}
function t(slide,ctx,text,x,y,w,h,s=24,color=C.ink,bold=false,align="left"){return ctx.addText(slide,{text,x,y,w,h,fontSize:s,color,bold,align,insets:{left:5,right:5,top:3,bottom:3},typeface:"Microsoft YaHei"});}
function info(slide,ctx,label,value,x,color){ctx.addShape(slide,{x,y:605,w:300,h:70,fill:"#FFFFFF",line:ctx.line(C.line,1)});ctx.addShape(slide,{x,y:605,w:8,h:70,fill:color,line:ctx.line(color,0)});t(slide,ctx,`${label}\n${value}`,x+24,616,248,42,18,color,true,"center");}
export async function slide02(presentation, ctx){
  const slide=presentation.slides.add(); bg(slide,ctx);
  t(slide,ctx,"论文查重报告",64,44,360,48,34,C.ink,true);
  t(slide,ctx,"毕业论文（设计）管理系统检测结果",66,98,560,28,18,C.muted);
  await ctx.addImage(slide,{path:"C:/Users/Lenovo/Desktop/the-old-no-deps/outputs/019e6768-3078-73d0-9233-2ba286ee6e8b/presentations/zhihui-zhulao-defense/assets/duplication-report.png",x:64,y:142,w:1152,h:438,fit:"contain",alt:"论文查重报告截图"});
  info(slide,ctx,"去除本人文献复制比","2.3%",155,C.orange);
  info(slide,ctx,"审核状态","审核通过",490,C.green);
  info(slide,ctx,"校内互检","3.9%",825,C.blue);
  return slide;
}
