const C = {
  ink: "#17212B", muted: "#61707F", bg: "#FFF8F1", orange: "#F28C38",
  blue: "#287C9F", green: "#4F9D7A", cream: "#FFE8CF", pale: "#E8F4F1", line: "#D9E2E7"
};
function bg(slide, ctx, dark=false){ctx.addShape(slide,{x:0,y:0,w:ctx.W,h:ctx.H,fill:dark?"#17313A":C.bg});}
function t(slide,ctx,text,x,y,w,h,s=24,color=C.ink,bold=false,align="left"){return ctx.addText(slide,{text,x,y,w,h,fontSize:s,color,bold,align,insets:{left:4,right:4,top:3,bottom:3},typeface:"Microsoft YaHei"});}
function chip(slide,ctx,text,x,y,w,color){ctx.addShape(slide,{x,y,w,h:34,fill:color,line:ctx.line(color,0)});t(slide,ctx,text,x+10,y+5,w-20,22,15,"#fff",true,"center");}
export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add(); bg(slide,ctx);
  ctx.addShape(slide,{x:0,y:0,w:1280,h:720,fill:"#FFF8F1"});
  ctx.addShape(slide,{x:760,y:0,w:520,h:720,fill:"#17313A"});
  ctx.addShape(slide,{x:820,y:78,w:330,h:330,fill:"#E8F4F1",line:ctx.line("#E8F4F1",0),geometry:"ellipse"});
  ctx.addShape(slide,{x:970,y:310,w:210,h:210,fill:"#F6B26B",line:ctx.line("#F6B26B",0),geometry:"ellipse"});
  t(slide,ctx,"毕业设计答辩",72,68,360,36,22,C.orange,true);
  t(slide,ctx,"基于 Node.js 和 React 的社区“智慧助老”服务对接平台",72,130,640,168,44,C.ink,true);
  t(slide,ctx,"面向老年人、家属、志愿者与社区管理员的多端协同服务平台",76,318,600,56,22,C.muted);
  chip(slide,ctx,"需求发布",835,160,128,C.blue); chip(slide,ctx,"任务匹配",985,232,128,C.green); chip(slide,ctx,"过程跟踪",850,338,128,C.orange); chip(slide,ctx,"评价反馈",1010,420,128,C.blue);
  t(slide,ctx,"答辩人：汪序磊\n指导教师：余小军\n东华理工大学 软件学院",76,555,520,86,22,C.ink);
  t(slide,ctx,"社区养老服务数字化闭环",820,575,330,36,26,"#FFFFFF",true,"center");
  return slide;
}
