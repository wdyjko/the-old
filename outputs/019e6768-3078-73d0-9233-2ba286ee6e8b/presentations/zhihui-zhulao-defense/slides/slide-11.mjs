const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function lane(s,c,title,items,x,y,col){c.addShape(s,{x,y,w:330,h:325,fill:"#fff",line:c.line(C.line,1)});t(s,c,title,x+22,y+22,286,28,22,col,true);items.forEach((it,i)=>{c.addShape(s,{x:x+28,y:y+74+i*42,w:10,h:10,fill:col,line:c.line(col,0),geometry:"ellipse"});t(s,c,it,x+48,y+66+i*42,240,24,16,C.ink);});}
export async function slide11(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"功能模块设计：围绕三端职责拆分",64,50,680,46,32,C.ink,true);
 lane(s,ctx,"老人 / 家属端",["注册登录模块","老人档案模块","需求发布模块","订单跟踪模块","聊天沟通模块","评价反馈模块"],92,190,C.orange);
 lane(s,ctx,"志愿者端",["任务大厅模块","地图接单模块","服务执行模块","过程回传模块","积分奖励模块","个人信息维护"],475,190,C.blue);
 lane(s,ctx,"管理员端",["用户审核模块","订单审核模块","工单调度模块","数据统计模块","平台基础管理"],858,190,C.green);
 t(s,ctx,"模块设计原则：前台降低操作负担，后台强化审核调度，平台侧沉淀可分析数据。",150,606,980,36,21,C.ink,true,"center");return s;}

