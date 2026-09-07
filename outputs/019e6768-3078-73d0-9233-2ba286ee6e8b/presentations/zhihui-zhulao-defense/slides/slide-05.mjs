const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function policy(s,c,title,desc,x,y,col){c.addShape(s,{x,y,w:342,h:186,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x,y,w:342,h:10,fill:col,line:c.line(col,0)});t(s,c,title,x+22,y+28,296,54,21,C.ink,true);t(s,c,desc,x+22,y+100,288,58,17,C.muted);}
export async function slide05(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"政策与研究意义：从服务供给到闭环治理",64,50,760,46,32,C.ink,true);
 policy(s,ctx,"“十四五”国家老龄事业发展和养老服务体系规划","健全居家、社区、机构相协调，医养康养相结合的养老服务体系。",82,168,C.orange);
 policy(s,ctx,"关于发展银发经济增进老年人福祉的意见","培育高质量养老服务模式，推进养老服务提质扩容。",469,168,C.blue);
 policy(s,ctx,"深化养老服务改革发展的意见","完善养老服务网络，增强服务供给能力。",856,168,C.green);
 const xs=[148,388,628,868]; const labels=["整合多方主体","实现闭环管理","提升服务效率","数据辅助决策"]; const colors=[C.orange,C.blue,C.green,C.orange];
 labels.forEach((l,i)=>{ctx.addShape(s,{x:xs[i],y:440,w:132,h:132,fill:colors[i],line:ctx.line(colors[i],0),geometry:"ellipse"});t(s,ctx,l,xs[i]+11,480,110,48,18,"#fff",true,"center");});
 t(s,ctx,"课题价值：让养老服务从“人工协调”转向“平台协同 + 数据留痕 + 管理可追踪”。",160,620,960,40,22,C.ink,true,"center");return s;}

