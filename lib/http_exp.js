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
		message : "服务器找不到请求的网页" ,
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
				code    : this.code ,
				message : this.message ,
				type    : this.type ,
				error_side_name    : this.getErrorSideName()
			} ;
		return {
			code    : this.code ,
			message : this.message
		} ;
	}
} ;
function RequestError(){
	this.errorCodes = {} ;
	this.highWarnings = {} ;
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
	setHighWarning : function(name,value){
		if(this.highWarnings[name]){
			throw "无效的" + name ;
		}
		this.highWarnings[name] = value ;
	} ,
	getHighWarning : function(name){
		if(name){
			return this.highWarnings[name] ;
		}
		return this.highWarnings ;
	} ,
	findErrorCode : function(value,extra){
		let errorCodes = this.errorCodes , rets = [] ;
		if("string" == typeof value && !extra){
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
	_getDefaultHighWarning : function(type){
		let codeErrors = this.findErrorCode({
			key   : "type" ,
			value : type + ""
		}) ;
		return codeErrors ;
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
	this.started = false ;
	this.writeLog = false ;
	this.hasDefinedError = false ;
	this.config = {
		
	} ;
	this.requestError = new RequestError() ;
	this.init() ;
} ;
HttpException.prototype = {
	constructor : HttpException ,
	getRequestError : function(){
		return this.requestError ;
	} ,
	getStarted : function(){
		return this.started ;
	} ,
	init : function(){
		if(this.started)
			throw "运行错误" ;
		this.requestError._init() ;
		this.requestError.setHighWarning("client",this.requestError._getDefaultHighWarning("1")) ;
		this.requestError.setHighWarning("server",this.requestError._getDefaultHighWarning("2")) ;
		this.started = true ;
	} ,
	defineWarningError : function(name,errorCodes){
		let errors = [] , _this = this ;
		errorCodes.forEach(function(v){
			let error = _this.requestError.findErrorCode(v) ;
			errors.push(error) ;
		}) ;
		this.requestError.setHighWarning(name,errors) ;
		
	} ,
	getWarningErrors : function(){
		return this.requestError.getHighWarning() ;
	} ,
	catchError : function(name,callback){ // 自定义错误做日志处理
		this.hasDefinedError = true ;
		
	} ,
	_catchClientError : function(callback){
		
	} ,
	_catchServerError : function(callback){
		
	} ,
	finallyError : function(callback){
		
	}
} ;
// export api
module.exports = HttpException ;