const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7",dark:"#17313A"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function step(s,c,n,label,x,y,col){c.addShape(s,{x,y,w:145,h:92,fill:"#fff",line:c.line(col,2)});t(s,c,n,x+52,y+12,42,24,16,col,true,"center");t(s,c,label,x+20,y+46,105,32,17,C.ink,true,"center");}
export async function slide10(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"核心业务流程：需求到评价形成闭环",64,48,720,46,32,C.ink,true);
 const xs=[80,260,440,620,800,980]; const labs=["发布需求","系统校验","管理员审核","志愿者接单","服务执行","评价反馈"]; const cols=[C.orange,C.blue,C.green,C.orange,C.blue,C.green];
 labs.forEach((l,i)=>step(s,ctx,String(i+1).padStart(2,"0"),l,xs[i],235,cols[i]));
 for(let i=0;i<5;i++){ctx.addShape(s,{x:xs[i]+145,y:278,w:35,h:6,fill:C.dark,line:ctx.line(C.dark,0)});ctx.addShape(s,{x:xs[i]+173,y:270,w:20,h:20,fill:C.dark,line:ctx.line(C.dark,0),geometry:"triangle"});}
 t(s,ctx,"双向实时沟通：老人 / 家属 ↔ 志愿者",285,382,360,34,17,C.blue,true,"center");ctx.addShape(s,{x:250,y:420,w:430,h:4,fill:C.blue,line:ctx.line(C.blue,0)});
 ctx.addShape(s,{x:150,y:480,w:980,h:92,fill:"#E8F4F1",line:ctx.line("#E8F4F1",0)});t(s,ctx,"状态同步与数据沉淀：订单状态、服务凭证、积分记录、统计分析",420,500,440,52,20,C.ink,true,"center");
 t(s,ctx,"流程价值：将人工对接中的分散信息转化为可查询、可追踪、可统计的业务记录。",166,608,948,36,21,C.ink,true,"center");return s;}

