const C={ink:"#17212B",muted:"#61707F",bg:"#FFF8F1",orange:"#F28C38",blue:"#287C9F",green:"#4F9D7A",line:"#D9E2E7"};
function bg(s,c){c.addShape(s,{x:0,y:0,w:c.W,h:c.H,fill:C.bg});}
function t(s,c,text,x,y,w,h,fs=24,col=C.ink,b=false,al="left"){return c.addText(s,{text,x,y,w,h,fontSize:fs,color:col,bold:b,align:al,insets:{left:5,right:5,top:4,bottom:4},typeface:"Microsoft YaHei"});}
function layer(s,c,name,tech,role,x,y,col){c.addShape(s,{x,y,w:1060,h:88,fill:"#fff",line:c.line(C.line,1)});c.addShape(s,{x,y,w:16,h:88,fill:col,line:c.line(col,0)});t(s,c,name,x+34,y+18,220,28,23,C.ink,true);t(s,c,tech,x+284,y+15,330,42,18,col,true);t(s,c,role,x+654,y+19,360,42,17,C.muted);}
export async function slide07(presentation,ctx){const s=presentation.slides.add();bg(s,ctx);t(s,ctx,"技术选型：前后端分离支撑三端协同",64,48,720,46,32,C.ink,true);t(s,ctx,"技术栈选择以成熟、可维护、适合实时服务为原则",66,96,700,30,18,C.muted);
 layer(s,ctx,"前端表现层","React + TypeScript + Redux Toolkit + Ant Design","组件化构建多角色界面，统一状态管理，兼顾适老化 UI。",110,170,C.orange);
 layer(s,ctx,"后端业务层","Node.js + Express + Socket.io","提供 RESTful 服务、实时通信和高并发业务处理。",110,285,C.blue);
 layer(s,ctx,"数据持久层","MySQL + Redis","存储核心业务数据，并支撑缓存与临时状态管理。",110,400,C.green);
 layer(s,ctx,"可视化能力","高德地图 API + ECharts","用于地图定位、任务分布展示和运营数据看板。",110,515,C.orange);
 return s;}

