const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function pain(s,c,title,body,x,y,col){c.addShape(s,{x,y,w:330,h:150,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x:x+22,y:y+20,w:52,h:52,fill:col,line:c.line(col,0),geometry:"ellipse"});t(s,c,"!",x+22,y+27,52,34,25,"#fff",true,"center");t(s,c,title,x+92,y+24,210,28,22,C.ink,true);t(s,c,body,x+28,y+88,270,42,17,C.muted);}
export async function slide04(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"研究背景：社区养老服务需要数字化协同",64,48,760,48,32,C.ink,true);t(s,ctx,"老龄化背景下，服务需求呈现多样化、即时化和过程可追踪的特点",66,96,820,30,18,C.muted);
 t(s,ctx,"服务需求",88,172,180,30,24,C.blue,true);["就医陪护","精神慰藉","紧急求助","日常代办","康复支持"].forEach((x,i)=>{ctx.addShape(s,{x:80+i*222,y:220,w:170,h:54,fill:i%2? "#E8F4F1":"#FFE8CF",line:ctx.line("transparent",0)});t(s,ctx,x,80+i*222,236,170,24,18,C.ink,true,"center");});
 pain(s,ctx,"信息分散","需求依赖电话、微信群和纸质登记，难以及时汇总。",86,350,C.orange);pain(s,ctx,"任务低效","志愿者匹配依赖人工经验，响应速度受限。",476,350,C.blue);pain(s,ctx,"过程难追踪","服务执行、沟通记录和结果反馈缺少统一闭环。",866,350,C.green);
 t(s,ctx,"因此，本课题将服务对象、志愿者资源与社区管理流程统一到平台中，实现从需求到反馈的全流程管理。",150,612,980,44,21,C.ink,true,"center");return s;}

