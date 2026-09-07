const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:6,right:6,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function card(s,c,title,items,x,y,col){c.addShape(s,{x,y,w:322,h:350,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x,y,w:322,h:54,fill:col,line:c.line(col,0)});t(s,c,title,x+18,y+14,286,26,21,"#fff",true,"center");items.forEach((it,i)=>{t(s,c,"• "+it,x+26,y+84+i*45,260,28,17,C.ink);});}
export async function slide09(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"需求分析：三类角色覆盖服务全链条",64,50,740,46,32,C.ink,true);
 card(s,ctx,"老人 / 家属端",["注册登录与老人档案","需求发布与订单查询","实时聊天与结果评价","操作简洁、流程清晰"],90,175,C.orange);
 card(s,ctx,"志愿者端",["任务大厅与地图筛选","接单执行与过程反馈","积分累计与兑换","提升接单效率与参与动力"],480,175,C.blue);
 card(s,ctx,"管理员端",["用户与志愿者审核","需求审核与订单调度","统计分析与平台运营","保障流程规范与资源配置"],870,175,C.green);
 t(s,ctx,"设计目标：每个角色只看到必要功能，同时共享同一条订单状态链。",184,604,912,36,22,C.ink,true,"center");return s;}

