const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
export async function slide24(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);
 t(s,ctx,"致谢",92,80,320,62,44,C.ink,true);
 ctx.addShape(s,{x:92,y:168,w:1096,h:1,fill:C.line,line:ctx.line(C.line,0)});
 t(s,ctx,"衷心感谢指导教师余小军老师的悉心指导",118,230,860,36,28,C.orange,true);
 t(s,ctx,"在课题方向、功能取舍、框架搭建、实现细节和论文写作规范等方面给予了重要帮助。",118,282,930,34,20,C.ink);
 t(s,ctx,"感谢学院老师的专业基础培养，感谢同学朋友在资料查找、功能测试、界面反馈和论文修改中的帮助。",118,370,960,34,20,C.ink);
 t(s,ctx,"感谢家人一直以来的理解、支持与鼓励。",118,440,700,34,20,C.ink);
 t(s,ctx,"谢谢各位老师！",420,570,440,48,34,C.blue,true,"center");
 return s;}

