const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function state(s,c,label,x,y,col){c.addShape(s,{x,y,w:150,h:70,fill:"#fff",line:c.line(col,2)});t(s,c,label,x+12,y+16,126,38,16,C.ink,true,"center");}
export async function slide13(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"状态字典：统一状态让多端协同可控",64,48,780,46,32,C.ink,true);
 const xs=[86,292,498,704,910]; const labs=["pending\n待审核","approved\n已通过","assigned\n已接单","in_service\n服务中","completed\n已完成"]; const cols=[C.orange,C.blue,C.green,C.orange,C.blue];
 labs.forEach((l,i)=>state(s,ctx,l,xs[i],210,cols[i])); for(let i=0;i<4;i++){ctx.addShape(s,{x:xs[i]+150,y:238,w:50,h:5,fill:C.dark,line:ctx.line(C.dark,0)});ctx.addShape(s,{x:xs[i]+190,y:230,w:20,h:20,fill:C.dark,line:ctx.line(C.dark,0),geometry:"triangle"});}
 ctx.addShape(s,{x:520,y:338,w:240,h:58,fill:"#FFE8CF",line:ctx.line("#FFE8CF",0)});t(s,ctx,"cancelled / 已取消",540,356,200,24,18,C.orange,true,"center");
 t(s,ctx,"关键字段",100,470,160,28,24,C.ink,true);t(s,ctx,"user.role：elder / volunteer / admin\nchat_message.message_type：text / image / system\npoint_record.reason：order_complete / bonus / exchange",294,462,650,92,19,C.ink);
 t(s,ctx,"价值：前端展示、后端校验和管理端调度使用同一套状态语义，减少业务歧义。",142,622,996,36,21,C.ink,true,"center");return s;}

