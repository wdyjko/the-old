const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function row(s,c,y,a,b,d,fill){c.addShape(s,{x:82,y,w:1116,h:66,fill,line:c.line(C.line,1)});t(s,c,a,102,y+20,190,24,17,C.ink,true);t(s,c,b,318,y+13,360,34,16,C.ink);t(s,c,d,720,y+20,340,24,16,C.green,true);}
export async function slide19(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"系统测试：覆盖功能、流程联动与异常场景",64,48,860,46,32,C.ink,true);
 ctx.addShape(s,{x:82,y:145,w:1116,h:52,fill:C.dark,line:ctx.line(C.dark,0)});t(s,ctx,"测试类型",102,160,160,22,16,"#fff",true);t(s,ctx,"目标",318,160,260,22,16,"#fff",true);t(s,ctx,"范围",720,160,260,22,16,"#fff",true);
 row(s,ctx,197,"功能测试","验证各模块功能正常使用","三端全部功能","#FFFFFF");
 row(s,ctx,263,"流程联动测试","验证完整业务链条顺畅","订单流转、状态同步、角色协同","#F8FBFA");
 row(s,ctx,329,"异常场景测试","验证边界情况下的系统反馈","空值提交、越权访问、重复操作、消息延迟","#FFFFFF");
 t(s,ctx,"测试结论",100,458,160,34,24,C.orange,true);["三类角色均可在权限范围内完成操作","登录认证、需求发布、订单审核、任务接单、服务执行、积分奖励和聊天沟通功能正常","订单状态流转清晰，前后端分离架构和实时通信机制可用性良好"].forEach((l,i)=>t(s,ctx,"✓ "+l,300,456+i*44,760,30,18,C.ink));
 return s;}

