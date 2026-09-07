const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function mock(s,c,x,y,w,h,title,col){c.addShape(s,{x,y,w,h,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x,y,w,h:44,fill:col,line:c.line(col,0)});t(s,c,title,x+16,y+11,w-32,20,17,"#fff",true);for(let i=0;i<4;i++){c.addShape(s,{x:x+22,y:y+70+i*44,w:w-44,h:24,fill:i%2?"#F8FBFA":"#FFE8CF",line:c.line("transparent",0)});}}
export async function slide14(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"登录与权限：身份识别后进入对应端",64,48,760,46,32,C.ink,true);
 mock(s,ctx,92,170,350,330,"登录表单",C.orange);t(s,ctx,"手机号\n密码\n角色识别\n会话管理",150,244,230,150,22,C.ink,true,"center");
 mock(s,ctx,830,170,350,330,"角色首页",C.blue);t(s,ctx,"老人 / 家属端\n志愿者端\n管理员端",896,260,220,110,22,C.ink,true,"center");
 ctx.addShape(s,{x:500,y:282,w:260,h:78,fill:"#E8F4F1",line:ctx.line("#E8F4F1",0)});t(s,ctx,"认证授权\n路由守卫",545,294,170,50,20,C.green,true,"center");
 ctx.addShape(s,{x:442,y:312,w:58,h:5,fill:C.dark,line:ctx.line(C.dark,0)});ctx.addShape(s,{x:760,y:312,w:70,h:5,fill:C.dark,line:ctx.line(C.dark,0)});
 t(s,ctx,"实现要点：表单校验、身份认证、角色识别、未登录拦截和按角色跳转。",150,598,980,36,21,C.ink,true,"center");return s;}

