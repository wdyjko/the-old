const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function row(s,c,y,id,item,result,fill){c.addShape(s,{x:72,y,w:1136,h:62,fill,line:c.line(C.line,1)});t(s,c,id,94,y+18,90,22,16,C.blue,true);t(s,c,item,206,y+16,440,24,16,C.ink);t(s,c,result,910,y+18,180,22,16,C.green,true,"center");}
export async function slide20(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"核心测试用例：关键链路均符合预期",64,48,780,46,32,C.ink,true);
 ctx.addShape(s,{x:72,y:145,w:1136,h:48,fill:C.dark,line:ctx.line(C.dark,0)});t(s,ctx,"编号",94,158,80,22,15,"#fff",true);t(s,ctx,"测试项目",206,158,200,22,15,"#fff",true);t(s,ctx,"实际结果",930,158,160,22,15,"#fff",true);
 row(s,ctx,193,"L1-L5","注册登录与权限控制","符合预期","#FFFFFF");
 row(s,ctx,255,"D1-D5","需求发布与订单跟踪","符合预期","#F8FBFA");
 row(s,ctx,317,"V1-V5","志愿者接单与服务执行","符合预期","#FFFFFF");
 row(s,ctx,379,"M1-M5","后台审核与实时通信","符合预期","#F8FBFA");
 ctx.addShape(s,{x:150,y:520,w:980,h:80,fill:"#FFE8CF",line:ctx.line("#FFE8CF",0)});t(s,ctx,"待改进",182,536,120,32,21,C.orange,true);t(s,ctx,"老年用户提示不足、异常说明不够清楚、界面细节统一性仍需继续打磨。",318,536,710,36,19,C.ink);
 return s;}

