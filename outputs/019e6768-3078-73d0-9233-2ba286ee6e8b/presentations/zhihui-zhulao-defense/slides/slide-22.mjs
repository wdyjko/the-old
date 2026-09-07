const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function point(s,c,n,title,body,x,y,col){c.addShape(s,{x,y,w:500,h:130,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x:x+20,y:y+32,w:54,h:54,fill:col,line:c.line(col,0),geometry:"ellipse"});t(s,c,n,x+20,y+43,54,25,18,"#fff",true,"center");t(s,c,title,x+94,y+25,330,28,21,col,true);t(s,c,body,x+94,y+62,360,42,16,C.ink);}
export async function slide22(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"创新点：围绕协同、实时、激励与决策形成组合能力",64,48,1000,46,31,C.ink,true);
 point(s,ctx,"01","多角色统一平台","打破信息孤岛，实现服务信息集中管理。",100,170,C.orange);
 point(s,ctx,"02","实时通信 + 地图辅助","Socket.io 即时同步，高德地图辅助定位和接单判断。",680,170,C.blue);
 point(s,ctx,"03","积分激励机制","服务时长与完成质量挂钩，促进志愿者持续参与。",100,360,C.green);
 point(s,ctx,"04","数据看板辅助决策","ECharts 可视化运营数据，辅助社区管理。",680,360,C.orange);
 return s;}

