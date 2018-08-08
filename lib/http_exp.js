/*
 * @author Bigbear Wang. Ziyue
 */
/* Global Register Error Codes */
const http_code_errors = {
	"400" : {
		code : "400" ,
		message : "请求错误，服务器不理解请求的语法" ,
		type : "1"
	} ,
	"404" : {
		code : "404" ,
		message : "找不到请求的网页" ,
		type : "1"
	} ,
	"500" : {
		code : "500" ,
		message : "服务器遇到错误，无法完成请求" ,
		type : "2"
	} ,
	"501" : {
		code : "501" ,
		message : "服务器不具备完成请求的功能" ,
		type : "2"
	} ,
	"502" : {
		code : "502" ,
		message : "服务器作为网关或代理，从上游服务器收到无效响应" ,
		type : "2"
	} ,
	"503" : {
		code : "503" ,
		message : "服务器目前无法使用，由于超载或停机维护。通常，这只是暂时状态" ,
		type : "2"
	}
} ;
function ErrorCode(error){
	this.code    = error.code ;
	this.message = error.message ;
	this.type    = error.type ;
} ;
ErrorCode.prototype = {
	constructor : ErrorCode ,
	getCode : function(){
		return this.code ;
	} ,
	getMessage : function(){
		return this.message ;
	} ,
	getType : function(){
		return this.type ;
	} ,
	getErrorSideName : function(){
		return ("1" == this.type ? "客户端" : "服务器") ;
	} ,
	getInfo : function(isOrign){
		if(isOrign)
			return {
				type    : this.type ,
				error_side_name    : this.getErrorSideName() ,
				code    : this.code ,
				message : this.message			
			} ;
		return {
			code    : this.code ,
			message : this.message
		} ;
	}
} ;
// 错误关注点处理 
function ErrorFocus(id){
	this.id = id ;
	this.errors = []
} ;
ErrorFocus.prototype = {
	constructor : ErrorFocus ,
	getID : function(){
		return this.id ;
	} ,
	getError : function(name){
		if(!name){
			return this.errors ;
		}
		return this.findError(name) ;
	} ,
	addError : function(error){
		if(this.hasError(error)){
			throw error + "已经存在" ;
		}
		this.errors.push(error) ;
	} ,
	hasError : function(error){
		return this.findError(error) ? true : false ;
	} ,
	findError : function(name){
		let finded = false ;
		if(!name){
			return this.getError() ;
		}
		this.errors.forEach(function(v){
			if(name == v){
				finded = true ;
				return false ;
			}
		}) ;
		return finded ? name : null ;
	} ,
	getInfo : function(name){
		let retInfo = { 
			id : this.getID() ,
			focusInfo : {}
		} ;
		if(name){
			let error = this.findError(name) ;
			let codes = this.requestError.getErrorCodes() ;
			retInfo["focusInfo"] = codes[error] ;
		}
		else{
			(this.getError()).forEach(function(v){
				retInfo["focusInfo"][v.getCode()] = v.getInfo(true) ;
			}) ;
		}
		return retInfo ;
	}
} ;
function ErrorLeveL(id,options){
	this.id   = id ;
	this.name = options.name ;
	this.desc = options.desc ;
	this.type = options.type || "default" ;
	this.errorFocus = null ;
} ;
ErrorLeveL.prototype = {
	constructor : ErrorLeveL ,
	getID : function(){
		return this.id ;
	} ,
	getName : function(){
		return this.name ;
	} ,
	getType : function(){
		return this.type ;
	} ,
	getDesc : function(){
		return this.desc ;
	} ,
	setErrorFocus : function(errorFocus){
		this.errorFocus = errorFocus ;
	} ,
	getErrorFocus : function(){
		return this.errorFocus ;
	}
} ;
// 级别错误处理
function HttpThrowExector(){
	this.leves = {} ;
} ;
HttpThrowExector.InternalHandle = { // 示意性质的操作
	"default" : function(data){
		console.log(data) ;
	} ,
	"normal" : function(data){
		console.log("异常错误写入文件！") ;
		console.log("异常错误屏幕输出！") ;
	} ,
	"high" : function(data){ 
		console.log('\x1B[36m%s\x1B[0m',"异常错误写入文件！");
		console.log('\x1B[36m%s\x1B[0m',"异常错误屏幕输出！");
		console.log('\x1B[36m%s\x1B[0m',"异常错误上报到服务端数据库！");
	}
} ;
HttpThrowExector.prototype = {
	constructor : HttpThrowExector ,
	addLeveL : function(Lv){
		let LID = Lv.getID() ;
		if(this.hasLeveL(LID)){
			throw "id" + LID + "已经存在" ;
		}
		this.leves[LID] = Lv ;
	} ,
	hasLeveL : function(id){
		return this.leves[id] ? true : false ;
	} ,
	getLeveL : function(id){
		if(!id){
			return this.leves ;
		}
		return this.leves[id] ;
	} ,
	throwHttpError : function(statusCode,callback){
		let Lvs = this.getLeveL() , httpThrowExexHandle = HttpThrowExector.InternalHandle , tmp = null ;
		for(let prop in Lvs){
			let LV = Lvs[prop] ;
			let responseData = {
				LID  : LV.getID()   ,
				name : LV.getName() ,
				type : LV.getType() ,
				desc : LV.getDesc() ,
				focusID : LV.getErrorFocus().getID() ,
				errorCodes : LV.getErrorFocus().getError()
			} ;
			let codes = responseData.errorCodes ;
			codes.forEach(function(v){
				if(statusCode == v){
					tmp = responseData ;
					return false ;
				}
			}) ;
			if(tmp){
				break ;
			}
		}
		httpThrowExexHandle[tmp.type].call(httpThrowExexHandle,tmp) ;
		callback && callback(tmp) ;
	}
} ;
function RequestError(){
	this.errorCodes  = {} ;
	this.errorsFocus = {} ;
} ;
RequestError.prototype = {
	constructor : RequestError ,
	addErrorCode : function(codeID,value){
		if(this.hasErrorCode(codeID))
			throw "无效的" + codeID ;
		this.errorCodes[codeID] = value ;
	} ,
	hasErrorCode : function(codeID){
		return this.errorCodes[codeID] ? true : false ;
	} ,
	getErrorCodes : function(){
		return this.errorCodes ;
	} ,
	findErrorCode : function(value,extra){
		let errorCodes = this.errorCodes , rets = [] ;
		if("string" == typeof value && !extra){
			if(!errorCodes[value]){
				return rets ;
			}
			return (errorCodes[value]).getInfo(true) || rets ;
		}
		if("object" == typeof value){
			let k = value.key , v = value.value ;
			for(let prop in errorCodes){
				let ec = errorCodes[prop] ;
				let _value = ec[k] ;
				if(!_value){
					return rets ;
				}
				if(_value == v){
					rets.push(ec.getInfo(true)) ;
				}
			}
		}
		return rets ;
	} ,
	addErrorFocus : function(focusID,codes){
		if(this.hasErrorFocus(focusID)){
			throw "无效的" + focusID ;
		}
		let eFocus = new ErrorFocus(focusID) ;
		for(let prop in codes){
			let code = codes[prop] ;
			eFocus.addError(code) ;
		}
		this.errorsFocus[focusID] = eFocus ;
	} ,
	hasErrorFocus : function(fid){
		return this.errorsFocus[fid] ? truev : false ;
	} ,
	getErrorFocus : function(fid){
		if(!fid){
			return this.errorsFocus ;
		}
		return this.errorsFocus[fid] ;
	} ,
	_init : function(){
		this._initErrorCodes() ;
	} ,
	_initErrorCodes : function(){
		for(let prop in http_code_errors){
			let hce = http_code_errors[prop] ;
			this.addErrorCode(prop,new ErrorCode(hce)) ;
		}
	}
} ;
function HttpException(options){
	this.definedFocusError = "" ;
	this.hasDefinedErrorFocus = false ;
	this.requestError = new RequestError() ;
	this.httpThrowExector = new HttpThrowExector() ;
	this.init() ;
} ;
HttpException.prototype = {
	constructor : HttpException ,
	getRequestError : function(){
		return this.requestError ;
	} ,
	init : function(){
		this.requestError._init() ;
		this.requestError.addErrorFocus("client",["400","404"]) ;
		this.requestError.addErrorFocus("server",[
			"500","501",
			"502","503"
		]) ;
	} ,
	getHttpCodeErrors : function(){
		return this.requestError.getErrorCodes() ;
	} ,
	useALLErrorFocus : function(){
		if(this.hasDefinedErrorFocus) return ;
		this.defineErrorFocus("all",[
			"400","404",
			"500","501",
			"502","503" 
		],{
			name : LeveL.name || "all" ,
			desc : LeveL.desc || "all" ,
			type : LeveL.type || "default"
		}) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	useClientErrorFocus : function(){
		if(this.hasDefinedErrorFocus) return ;
		this.defineErrorFocus("client",["400","404"],{
			name : LeveL.name || "client" ,
			desc : LeveL.desc || "client" ,
			type : LeveL.type || "high"
		}) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	useServerErrorFocus : function(){
		if(this.hasDefinedErrorFocus) return ;
		this.defineErrorFocus("server",[
			"500","501",
			"502","503"
		] ,{
			name : LeveL.name || "server" ,
			desc : LeveL.desc || "server" ,
			type : LeveL.type || "normal"
		}) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	defineErrorFocus : function(name,codes,LeveL){
		if(this.hasDefinedErrorFocus) return ;
		let _this = this ;
		codes.forEach(function(v){
			let code = _this.requestError.findErrorCode(v) ;
			if(code.constructor === Array && !code.length){
				throw "无效的" + v ;
			}
		}) ;
		this.requestError.addErrorFocus(name,codes) ;
		let errorLeveL = new ErrorLeveL(LeveL.id || ("Lv_ID_" + new Date().getTime()),{
			name : LeveL.name || "" ,
			desc : LeveL.desc || "" ,
			type : LeveL.type || "default"
		}) ;
		errorLeveL.setErrorFocus(this.requestError.getErrorFocus(name)) ;
		this.definedFocusError += name ;
		this.httpThrowExector.addLeveL(errorLeveL) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	getDefinedErrorFocus : function(){
		return this.requestError.getErrorFocus() ;
	} ,
	catchHttpException : function(responseStatusCode,callback){
		let _focus = null , statusCode = responseStatusCode + "" ;
		let c = null ;
		if(!this.hasDefinedErrorFocus){
			this.useALLErrorFocus() ; // 默认构建全部错误状态的异常关注
		}
		_focus = this.requestError.getErrorFocus(this.definedFocusError) ;	
		_focus.errors.forEach(function(v,k){
			if(statusCode == v){
				c = v ;
				return false ;
			}
		}) ;
		if(!c){
			let flashErrorFocus = [] ;
			flashErrorFocus.push(statusCode) ;
			this.defineErrorFocus("flash_focus",flashErrorFocus,{
				name : "flash" ,
				desc : "flash" ,
				type : "default"	
			}) ; // 创建临时异常关注点
		}
		this.httpThrowExector.throwHttpError(statusCode,function(responseData){
			if(callback && "function" == typeof callback){
				return callback(responseData) ;
			}
		}) ;
	} ,
	_writeLog : function(info){ // 这里的代码就是一个示意，实际可能会加入本地存储写入日志或者别的操作
		let s = "" ;
		for(let prop in info){
			let v = info[prop] ;
			s += v + "\n" ;
		}
		console.log('\x1B[36m%s\x1B[0m',s) ;
	}
} ;

// export api
module.exports = HttpException ;