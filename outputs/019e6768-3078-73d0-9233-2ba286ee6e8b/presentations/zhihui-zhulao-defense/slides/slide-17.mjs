const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function metric(s,c,label,val,x,y,col){c.addShape(s,{x,y,w:205,h:100,fill:"#fff",line:c.line(C.line,1)});t(s,c,val,x+18,y+16,170,42,30,col,true,"center");t(s,c,label,x+18,y+62,170,22,15,C.muted,false,"center");}
export async function slide17(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"管理员端：审核、调度与数据看板支撑运营管理",64,48,960,46,32,C.ink,true);
 metric(s,ctx,"用户规模","用户",90,150,C.orange);metric(s,ctx,"订单数量","订单",335,150,C.blue);metric(s,ctx,"服务完成","完成",580,150,C.green);metric(s,ctx,"活跃趋势","趋势",825,150,C.orange);
 ctx.addShape(s,{x:90,y:292,w:520,h:260,fill:"#fff",line:ctx.line(C.line,1)});t(s,ctx,"志愿者审核管理",120,318,220,26,22,C.blue,true);["查看申请人基本信息","核验认证资料","通过 / 驳回 / 补充材料","同步更新账号权限"].forEach((l,i)=>t(s,ctx,"• "+l,130,370+i*38,300,22,17,C.ink));
 ctx.addShape(s,{x:675,y:292,w:520,h:260,fill:"#fff",line:ctx.line(C.line,1)});t(s,ctx,"需求审核与工单调度",705,318,260,26,22,C.green,true);["审核服务内容、时间与地址","人工干预异常订单","分配志愿者资源","保证前后台调度一致"].forEach((l,i)=>t(s,ctx,"• "+l,715,370+i*38,330,22,17,C.ink));
 t(s,ctx,"运营价值：用审核控制保障服务质量，用统计分析发现高频需求和资源配置问题。",142,618,996,36,21,C.ink,true,"center");return s;}

