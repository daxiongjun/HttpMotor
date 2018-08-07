const HttpException = require("./http_exp") ;
const http = require("http") ;

/* api test */
let httpExp = new HttpException({
	defWarning : "bigbear" ,
	writeLog : true
}) ;
httpExp.defineWarningError("bigbear",["404","500"]) ; // 定义一个唯一的名称，选择你想要错误状态码，这个设置会格外地对这两种网络错误进行额外的处理，比如，控制台错误输出，日志文件写入。
http.get("http://www.baidu2.com",function(response){
	httpExp.catchError(response.statusCode,function(data){
		console.log(data)
	}) ;
}) ;