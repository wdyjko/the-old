const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function table(s,c,y,a,b,d,fill){c.addShape(s,{x:86,y,w:1108,h:62,fill,line:c.line(C.line,1)});t(s,c,a,108,y+18,190,24,16,C.ink,true);t(s,c,b,320,y+14,455,30,15,C.ink);t(s,c,d,806,y+18,320,24,16,C.muted);}
export async function slide12(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"数据库设计：以订单为主线串联用户、档案、沟通与积分",64,48,960,46,31,C.ink,true);
 ctx.addShape(s,{x:86,y:142,w:1108,h:50,fill:C.dark,line:ctx.line(C.dark,0)});t(s,ctx,"数据表",108,156,160,22,16,"#fff",true);t(s,ctx,"核心字段",320,156,300,22,16,"#fff",true);t(s,ctx,"作用",806,156,220,22,16,"#fff",true);
 table(s,ctx,192,"user","user_id, phone, password, role","用户身份与角色管理","#FFFFFF");
 table(s,ctx,254,"elder_profile","profile_id, owner_user_id, address, health_note","老人档案与服务地址","#F8FBFA");
 table(s,ctx,316,"service_order","order_id, status, service_type, service_time, address","订单全生命周期","#FFFFFF");
 table(s,ctx,378,"chat_message","message_id, order_id, content, is_read","订单级实时沟通","#F8FBFA");
 table(s,ctx,440,"point_record","record_id, change_value, reason, balance_after","积分激励记录","#FFFFFF");
 t(s,ctx,"设计重点：所有服务行为最终沉淀到订单、消息和积分记录中，便于查询、追踪与统计。",132,590,1016,42,21,C.ink,true,"center");return s;}

